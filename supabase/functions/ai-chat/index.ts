import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are MindSpace AI, a warm, empathetic mental health companion. You provide supportive, non-judgmental responses to help users manage stress, anxiety, and everyday emotional challenges.

IMPORTANT RULES:
- You are NOT a therapist or medical professional. Always clarify this if asked.
- Never diagnose conditions or prescribe medication.
- If someone expresses suicidal thoughts or self-harm, immediately encourage them to contact emergency services or a crisis hotline (e.g., 988 Suicide & Crisis Lifeline in the US, 112 in EU).
- Keep responses concise (2-4 paragraphs max) and conversational.
- Use gentle, validating language. Acknowledge feelings before offering suggestions.
- Suggest practical coping strategies: breathing exercises, journaling, mindfulness, physical activity.
- Ask thoughtful follow-up questions to show genuine interest.
- Remember context from the conversation to provide personalized support.
- End responses with 2-3 quick reply suggestions the user can tap.

FORMAT: Return a JSON object with:
{
  "text": "Your response text here",
  "quickReplies": ["Reply option 1", "Reply option 2", "Reply option 3"]
}

Always return valid JSON. The quickReplies should be natural, contextual follow-up messages the user might want to send.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ONSPACE_AI_API_KEY");
    const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");

    if (!apiKey || !baseUrl) {
      console.error("Missing ONSPACE_AI_API_KEY or ONSPACE_AI_BASE_URL");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, diagnosis, goals, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build personalized system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (diagnosis && diagnosis.length > 0) {
      systemPrompt += `\n\nThe user has shared that they manage: ${diagnosis.join(", ")}. Be sensitive to these conditions and tailor your suggestions accordingly. Do not repeatedly mention their diagnosis unless relevant.`;
    }
    if (goals && goals.length > 0) {
      systemPrompt += `\n\nThe user's wellness goals are: ${goals.join(", ")}. When appropriate, align your suggestions with these goals.`;
    }
    if (language && language !== "en") {
      systemPrompt += `\n\nThe user prefers the language code "${language}". Respond in that language. Keep quickReplies in the same language.`;
    }

    // Build messages array for the AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { sender: string; text: string }) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    console.log(`AI chat request: ${messages.length} messages, language: ${language || "en"}`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OnSpace AI error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // Parse the JSON response from AI
    let text = rawContent;
    let quickReplies: string[] = [];

    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        text = parsed.text || rawContent;
        quickReplies = parsed.quickReplies || [];
      }
    } catch {
      // If JSON parsing fails, use raw text and generate default quick replies
      text = rawContent.replace(/```json\n?|\n?```/g, "").trim();
      quickReplies = ["Tell me more", "What can I do?", "Thank you"];
    }

    console.log(`AI response generated: ${text.length} chars, ${quickReplies.length} quick replies`);

    return new Response(
      JSON.stringify({ text, quickReplies }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
