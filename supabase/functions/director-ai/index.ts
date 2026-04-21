// Director AI — analyzes the user's videos & analytics, returns
// a contextual brief: theme, suggestion, trend alert, plus a chat reply.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK = {
  theme: "Your content is leaning toward modern creator workflow & cinematic edits.",
  suggestion: "Try a 'Behind the Scenes' reel using your top-performing color palette.",
  trend: "Vaporwave aesthetics are trending in your niche — refresh your thumbnails.",
  reply: "I'm warming up — upload a few videos so I can read your style.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { messages = [], mode = "brief" } = await req.json().catch(() => ({}));

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    let videos: any[] = [];
    let topAnalytics: any[] = [];
    if (userId) {
      const { data: vids } = await supabase
        .from("videos")
        .select("title, views_count, viral_status, ai_score, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      videos = vids ?? [];

      const { data: an } = await supabase
        .from("analytics")
        .select("date, views, engagement, revenue")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(14);
      topAnalytics = an ?? [];
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify(FALLBACK), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = `Creator's last ${videos.length} videos:\n${videos
      .map((v, i) => `${i + 1}. "${v.title}" — ${v.views_count ?? 0} views${v.ai_score ? `, ai_score ${v.ai_score}` : ""}`)
      .join("\n") || "(no videos yet)"}\n\nLast 14 analytics rows: ${JSON.stringify(topAnalytics).slice(0, 800)}`;

    const systemPrompt = `You are "Director AI", an expert Creative Director for a modern short-form content creator. You speak in punchy, confident sentences. You read the user's content history and analytics to give SPECIFIC, personalized creative direction — never generic advice. Reference their actual titles when possible. Always tie suggestions to a visual aesthetic (color palette, typography, motion style).`;

    if (mode === "chat") {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `${systemPrompt}\n\nContext:\n${context}` },
            ...messages,
          ],
        }),
      });
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached, try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const j = await aiResp.json();
      const reply = j?.choices?.[0]?.message?.content ?? "Hmm, I lost my train of thought.";
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Brief mode — structured output via tool calling
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this creator and return a brief.\n\n${context}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "creative_brief",
            description: "Return a creative brief for the creator.",
            parameters: {
              type: "object",
              properties: {
                theme: { type: "string", description: "1 sentence: the creator's current visual/content theme. Reference their actual titles." },
                suggestion: { type: "string", description: "1 sentence: a specific next-video suggestion tied to a visual aesthetic." },
                trend: { type: "string", description: "1 sentence: a relevant aesthetic/trend alert for their niche." },
              },
              required: ["theme", "suggestion", "trend"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "creative_brief" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ ...FALLBACK, error: "rate_limit" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ ...FALLBACK, error: "credits" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const j = await aiResp.json();
    const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = {};
    try { parsed = typeof args === "string" ? JSON.parse(args) : args ?? {}; } catch { parsed = {}; }

    return new Response(JSON.stringify({ ...FALLBACK, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("director-ai error", e);
    return new Response(JSON.stringify(FALLBACK), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
