// AI Ideas edge function
// Suggests 3 video title ideas based on the user's most-viewed videos.
// Uses the Lovable AI Gateway (no API key needed).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IDEAS = [
  "POV: editing in 60 seconds",
  "My 5 most stolen LUTs",
  "Reacting to viewer edits",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    let topTitles: string[] = [];
    if (userId) {
      const { data: vids } = await supabase
        .from("videos")
        .select("title, views_count")
        .eq("user_id", userId)
        .order("views_count", { ascending: false })
        .limit(5);
      topTitles = (vids ?? []).map((v: { title: string }) => v.title).filter(Boolean);
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ ideas: FALLBACK_IDEAS, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt =
      topTitles.length > 0
        ? `These are a creator's most-viewed videos:\n${topTitles
            .map((t, i) => `${i + 1}. ${t}`)
            .join("\n")}\n\nSuggest exactly 3 short, punchy NEW video title ideas in the same style. Return ONLY a JSON array of 3 strings, no commentary.`
        : `Suggest exactly 3 short, punchy video title ideas for a modern content creator focused on filmmaking, editing and creator workflow. Return ONLY a JSON array of 3 strings, no commentary.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a creative content strategist. Reply only with a JSON array of strings." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ ideas: FALLBACK_IDEAS, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const text: string = aiJson?.choices?.[0]?.message?.content ?? "[]";

    let ideas: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      ideas = match ? JSON.parse(match[0]) : [];
    } catch {
      ideas = [];
    }
    if (!Array.isArray(ideas) || ideas.length === 0) ideas = FALLBACK_IDEAS;

    return new Response(JSON.stringify({ ideas: ideas.slice(0, 3), source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-ideas error", e);
    return new Response(JSON.stringify({ ideas: FALLBACK_IDEAS, source: "error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
