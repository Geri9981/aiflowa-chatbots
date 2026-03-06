import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ONSPACE_AI_API_KEY");
    const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { period, language } = await req.json();
    const daysBack = period === "2months" ? 60 : period === "1month" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split("T")[0];

    console.log(`Health report for user ${user.id}, period: ${period}, from: ${startStr}`);

    // Fetch user data in parallel
    const [moodsRes, journalsRes, meditationsRes, breathingsRes, profileRes] = await Promise.all([
      supabase.from("mood_entries").select("*").eq("user_id", user.id).gte("date", startStr).order("date"),
      supabase.from("journal_entries").select("*").eq("user_id", user.id).gte("date", startStr).order("date"),
      supabase.from("meditation_sessions").select("*").eq("user_id", user.id).gte("date", startStr).order("date"),
      supabase.from("breathing_sessions").select("*").eq("user_id", user.id).gte("date", startStr).order("date"),
      supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    const moods = moodsRes.data || [];
    const journals = journalsRes.data || [];
    const meditations = meditationsRes.data || [];
    const breathings = breathingsRes.data || [];
    const profile = profileRes.data;

    // Prepare data summary for AI
    const moodValues = moods.map((m: any) => `${m.date}: ${m.value}/10${m.note ? ` (${m.note})` : ""}`);
    const avgMood = moods.length > 0 ? (moods.reduce((s: number, m: any) => s + m.value, 0) / moods.length).toFixed(1) : "N/A";
    
    // Calculate mood trend
    let moodTrend = "stable";
    if (moods.length >= 4) {
      const half = Math.floor(moods.length / 2);
      const firstHalf = moods.slice(0, half).reduce((s: number, m: any) => s + m.value, 0) / half;
      const secondHalf = moods.slice(half).reduce((s: number, m: any) => s + m.value, 0) / (moods.length - half);
      if (secondHalf - firstHalf > 0.5) moodTrend = "improving";
      else if (firstHalf - secondHalf > 0.5) moodTrend = "declining";
    }

    const journalNotes = journals.map((j: any) => `${j.date}: "${j.title}" - tags: ${(j.tags || []).join(", ")} - mood: ${j.mood || "N/A"}/10`);
    const totalMeditationMin = meditations.reduce((s: number, m: any) => s + m.duration, 0);
    const totalBreathingSessions = breathings.length;

    const periodLabel = period === "2months" ? "2 months" : period === "1month" ? "1 month" : "1 week";

    const systemPrompt = `You are a clinical wellness report generator for a mental health tracking app called MindSpace. 
Generate a structured health report suitable for sharing with a healthcare professional (doctor, therapist, psychiatrist).

RULES:
- Write in a professional but accessible tone
- Structure the report clearly with sections
- Include specific data points and dates
- Note patterns and trends
- Do NOT diagnose or prescribe
- Do NOT use overly technical jargon
- Be factual and objective
- If data is limited, note that and still provide what analysis is possible
${language && language !== "en" ? `- Write the entire report in the language code "${language}"` : ""}

FORMAT the report using these sections:
1. **Report Overview** — Patient name (first name only), report period, date generated, app used
2. **Wellness Summary** — Brief 2-3 sentence overall assessment
3. **Mood Analysis** — Average mood score, trend (improving/stable/declining), notable highs and lows with dates
4. **Activity Patterns** — Meditation frequency and duration, breathing exercises, journaling frequency
5. **Key Observations** — Patterns, correlations (e.g., mood dips on certain days, mood improvements after meditation)
6. **Journal Highlights** — Relevant themes or concerns from journal entries (anonymized)
7. **Recommendations** — Data-driven suggestions based on patterns observed
8. **Disclaimer** — This is self-reported data from a wellness app, not a clinical assessment

Return the report as a single text string with markdown-style formatting (headers with ##, bold with **, etc).`;

    const userMessage = `Generate a health report for the following patient data:

**Patient**: ${profile?.username || user.email?.split("@")[0] || "User"}
**Diagnosis on file**: ${profile?.diagnosis?.length ? profile.diagnosis.join(", ") : "None specified"}
**Wellness Goals**: ${profile?.wellness_goals?.length ? profile.wellness_goals.join(", ") : "None specified"}
**Report Period**: ${periodLabel} (${startStr} to ${new Date().toISOString().split("T")[0]})
**Country**: ${profile?.country || "Unknown"}

**Mood Data** (${moods.length} entries, average: ${avgMood}/10, trend: ${moodTrend}):
${moodValues.length > 0 ? moodValues.join("\n") : "No mood data recorded"}

**Journal Entries** (${journals.length} entries):
${journalNotes.length > 0 ? journalNotes.join("\n") : "No journal entries"}

**Meditation**: ${meditations.length} sessions, ${totalMeditationMin} total minutes
**Breathing Exercises**: ${totalBreathingSessions} sessions

Please generate a comprehensive, professional health report.`;

    console.log(`Sending to AI: ${moods.length} moods, ${journals.length} journals, ${meditations.length} meditations`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reportText = data.choices?.[0]?.message?.content ?? "";

    console.log(`Health report generated: ${reportText.length} chars`);

    return new Response(
      JSON.stringify({
        report: reportText,
        stats: {
          moodEntries: moods.length,
          avgMood,
          moodTrend,
          journalEntries: journals.length,
          meditationSessions: meditations.length,
          meditationMinutes: totalMeditationMin,
          breathingSessions: totalBreathingSessions,
          period: periodLabel,
          startDate: startStr,
          endDate: new Date().toISOString().split("T")[0],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Health report error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
