// Analyze a video: simulate AI vision review using Lovable AI on metadata.
// Updates videos.ai_score, ai_feedback, viral_status.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIGGER_POOL = [
  "Strong Hook",
  "High Contrast",
  "Trending Audio",
  "Pattern Interrupt",
  "Curiosity Gap",
  "Fast Cuts",
  "Bold Caption",
  "Relatable POV",
  "Loop-friendly Ending",
];

function fallbackAnalysis(title: string) {
  // Deterministic-ish based on title length
  const seed = (title || "untitled").length;
  const score = 55 + ((seed * 7) % 40);
  const triggers = [...TRIGGER_POOL]
    .sort(() => 0.5 - ((seed * 13) % 10) / 10)
    .slice(0, 3);
  return {
    score,
    triggers,
    suggestions: [
      "Shorten the intro by ~1.5s to retain swipe-prone viewers.",
      "Add bold on-screen text in the first 2 seconds.",
      "End with a loop-friendly cut so it auto-replays.",
    ],
    hook: "strong",
    pacing: "fast",
    trend_alignment: "high",
  };
}

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

    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: video, error: vErr } = await supabase
      .from("videos")
      .select("id, title, user_id, status")
      .eq("id", video_id)
      .maybeSingle();
    if (vErr || !video) throw vErr ?? new Error("Video not found");
    if (video.user_id !== userId) throw new Error("Forbidden");

    await supabase.from("videos").update({ viral_status: "analyzing" }).eq("id", video_id);

    let analysis = fallbackAnalysis(video.title);

    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are a viral short-form video coach. Analyze the title and predict the reach of the video on TikTok/Reels. Always reply by calling the function.",
              },
              {
                role: "user",
                content: `Video title: "${video.title}". Predict an AI Reach Score (0-100), list 3 viral triggers it likely has, give 3 concrete suggestions to improve, and rate hook/pacing/trend_alignment as weak/average/strong/high/fast/slow.`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "submit_review",
                  description: "Return the AI reach prediction.",
                  parameters: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      triggers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                      suggestions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                      hook: { type: "string", enum: ["weak", "average", "strong"] },
                      pacing: { type: "string", enum: ["slow", "average", "fast"] },
                      trend_alignment: { type: "string", enum: ["low", "average", "high"] },
                    },
                    required: ["score", "triggers", "suggestions", "hook", "pacing", "trend_alignment"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "submit_review" } },
          }),
        });

        if (aiResp.ok) {
          const data = await aiResp.json();
          const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (args) {
            const parsed = JSON.parse(args);
            analysis = {
              score: Math.max(0, Math.min(100, Math.round(parsed.score))),
              triggers: parsed.triggers,
              suggestions: parsed.suggestions,
              hook: parsed.hook,
              pacing: parsed.pacing,
              trend_alignment: parsed.trend_alignment,
            };
          }
        } else {
          console.error("AI gateway error", aiResp.status, await aiResp.text());
        }
      } catch (e) {
        console.error("AI call failed, using fallback", e);
      }
    }

    const ai_feedback = {
      triggers: analysis.triggers,
      suggestions: analysis.suggestions,
      hook: analysis.hook,
      pacing: analysis.pacing,
      trend_alignment: analysis.trend_alignment,
    };

    const { error: updErr } = await supabase
      .from("videos")
      .update({
        ai_score: analysis.score,
        ai_feedback,
        viral_status: "analyzed",
        status: "live",
      })
      .eq("id", video_id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, score: analysis.score, feedback: ai_feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-video error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
