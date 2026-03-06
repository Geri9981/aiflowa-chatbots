import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function upsertSubscription(
  userId: string,
  email: string,
  customerId: string,
  subscription: any
) {
  const periodEnd =
    (subscription as any).current_period_end ||
    subscription.items?.data?.[0]?.current_period_end;

  if (!periodEnd) {
    logStep("Missing current_period_end", { subscriptionId: subscription.id });
    return;
  }

  const productId = subscription.items?.data?.[0]?.price?.product as string;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      user_email: email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_product_id: productId || null,
      status: subscription.status,
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    logStep("DB upsert error", { error: error.message });
  } else {
    logStep("DB upsert success", { userId, status: subscription.status });
  }

  // Also update is_premium on user_profiles for quick access
  const isActive = ["active", "trialing"].includes(subscription.status);
  await supabase
    .from("user_profiles")
    .update({ is_premium: isActive })
    .eq("id", userId);
}

async function getUserByEmail(email: string) {
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();
  return data;
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  return "email" in customer ? customer.email : null;
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("ERROR", { message: "No signature provided" });
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          sessionId: session.id,
          customerId: session.customer,
          email: session.customer_email,
          subscriptionId: session.subscription,
        });

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const email = session.customer_email;
          if (email) {
            const userProfile = await getUserByEmail(email);
            if (userProfile) {
              await upsertSubscription(
                userProfile.id,
                email,
                session.customer as string,
                subscription
              );
            }
          }
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", {
          id: subscription.id,
          status: subscription.status,
        });

        const email = await getCustomerEmail(subscription.customer as string);
        if (email) {
          const userProfile = await getUserByEmail(email);
          if (userProfile) {
            await upsertSubscription(
              userProfile.id,
              email,
              subscription.customer as string,
              subscription
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          id: subscription.id,
          status: subscription.status,
        });

        const email = await getCustomerEmail(subscription.customer as string);
        if (email) {
          const userProfile = await getUserByEmail(email);
          if (userProfile) {
            await upsertSubscription(
              userProfile.id,
              email,
              subscription.customer as string,
              subscription
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", {
          id: subscription.id,
        });

        const email = await getCustomerEmail(subscription.customer as string);
        if (email) {
          const userProfile = await getUserByEmail(email);
          if (userProfile) {
            // Directly update to canceled status
            const periodEnd =
              (subscription as any).current_period_end ||
              subscription.items?.data?.[0]?.current_period_end;

            const { error } = await supabase.from("subscriptions").upsert(
              {
                user_id: userProfile.id,
                user_email: email,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_product_id: subscription.items?.data?.[0]?.price?.product as string || null,
                status: "canceled",
                current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

            if (error) {
              logStep("DB upsert error (deleted)", { error: error.message });
            }

            // Remove premium access
            await supabase
              .from("user_profiles")
              .update({ is_premium: false })
              .eq("id", userProfile.id);

            logStep("Subscription canceled and premium removed", { userId: userProfile.id });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", {
          id: invoice.id,
          email: invoice.customer_email,
          amount: invoice.amount_paid,
        });

        if (invoice.subscription && invoice.customer_email) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userProfile = await getUserByEmail(invoice.customer_email);
          if (userProfile) {
            await upsertSubscription(
              userProfile.id,
              invoice.customer_email,
              invoice.customer as string,
              subscription
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", {
          id: invoice.id,
          email: invoice.customer_email,
        });

        if (invoice.customer_email) {
          const userProfile = await getUserByEmail(invoice.customer_email);
          if (userProfile) {
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userProfile.id);

            await supabase
              .from("user_profiles")
              .update({ is_premium: false })
              .eq("id", userProfile.id);
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
