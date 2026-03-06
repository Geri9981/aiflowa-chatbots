import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header not provided");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user?.email) throw new Error("User not authenticated or email unavailable");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check local DB cache (faster)
    const { data: localSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (localSub) {
      const isActive = ["active", "trialing"].includes(localSub.status);
      logStep("Found cached subscription", {
        status: localSub.status,
        isActive,
      });
      return new Response(
        JSON.stringify({
          subscribed: isActive,
          status: localSub.status,
          product_id: localSub.stripe_product_id,
          subscription_end: localSub.current_period_end,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fallback to Stripe API check
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ subscribed: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    // Check both active and trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
    });
    // Filter to active or trialing
    const validSubs = subscriptions.data.filter(s => ["active", "trialing"].includes(s.status));

    const hasActiveSub = validSubs.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subStatus = "inactive";

    if (hasActiveSub) {
      const subscription = validSubs[0];
      const periodEnd =
        (subscription as any).current_period_end ||
        subscription.items.data[0]?.current_period_end;
      subscriptionEnd = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null;
      productId = subscription.items.data[0].price.product;
      subStatus = subscription.status;
      logStep("Active subscription found", {
        id: subscription.id,
        endDate: subscriptionEnd,
      });

      // Cache in DB
      await supabaseClient.from("subscriptions").upsert(
        {
          user_id: user.id,
          user_email: user.email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_product_id: productId as string,
          status: subStatus,
          current_period_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      // Sync is_premium
      await supabaseClient
        .from("user_profiles")
        .update({ is_premium: true })
        .eq("id", user.id);
    } else {
      logStep("No active subscription");
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        status: subStatus,
        product_id: productId,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
