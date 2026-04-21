// Seed 30 days of realistic analytics + sample videos for the logged-in user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SAMPLE_VIDEOS = [
  { title: "POV: editing in 60 seconds", status: "live" },
  { title: "My 5 most stolen LUTs", status: "live" },
  { title: "Reacting to viewer edits", status: "live" },
  { title: "Studio tour 2026", status: "scheduled" },
  { title: "How I shoot in golden hour", status: "live" },
  { title: "Behind the scenes — neon set", status: "draft" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert sample videos (skip if user already has plenty)
    const { count: existingCount } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    let videoIds: string[] = [];
    if ((existingCount ?? 0) < 3) {
      const rows = SAMPLE_VIDEOS.map((v) => ({
        user_id: userId,
        title: v.title,
        status: v.status,
        views_count: Math.floor(1000 + Math.random() * 80000),
        viral_status: "analyzed",
        ai_score: Math.floor(60 + Math.random() * 35),
        ai_feedback: {
          triggers: ["Strong Hook", "Trending Audio", "Pattern Interrupt"],
          suggestions: [
            "Shorten the intro by 1.5s.",
            "Add a bold caption in the first 2s.",
            "End with a loop-friendly cut.",
          ],
          hook: "strong",
          pacing: "fast",
          trend_alignment: "high",
        },
      }));
      const { data: inserted, error: vErr } = await supabase.from("videos").insert(rows).select("id");
      if (vErr) throw vErr;
      videoIds = (inserted ?? []).map((r) => r.id);
    } else {
      const { data: vids } = await supabase
        .from("videos")
        .select("id")
        .eq("user_id", userId)
        .limit(6);
      videoIds = (vids ?? []).map((v) => v.id);
    }

    if (videoIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, videos: 0, analytics: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 30 days of analytics with a realistic upward trend + noise
    const today = new Date();
    const analyticsRows: Array<Record<string, unknown>> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);

      const trend = 1 + (29 - i) * 0.04; // grow over time
      for (const vid of videoIds) {
        const noise = 0.7 + Math.random() * 0.7;
        const views = Math.floor(800 * trend * noise);
        analyticsRows.push({
          user_id: userId,
          video_id: vid,
          date: dayKey,
          views,
          watch_time: Math.floor(views * (8 + Math.random() * 12)),
          engagement: Math.floor(views * (0.05 + Math.random() * 0.08)),
          revenue: Number((views * (0.002 + Math.random() * 0.004)).toFixed(2)),
        });
      }
    }

    // Wipe last 30 days first to avoid duplicates? analytics has no unique constraint,
    // so it's safe to insert. Cap to chunks of 500.
    for (let i = 0; i < analyticsRows.length; i += 500) {
      const chunk = analyticsRows.slice(i, i + 500);
      const { error: aErr } = await supabase.from("analytics").insert(chunk);
      if (aErr) throw aErr;
    }

    return new Response(
      JSON.stringify({ ok: true, videos: videoIds.length, analytics: analyticsRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("seed-demo-data error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
