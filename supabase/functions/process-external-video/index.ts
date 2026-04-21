// Validates a pasted video URL, extracts metadata when possible, and inserts
// a row into the videos table with source_type='link'. Then triggers analysis.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Platform = "youtube" | "instagram" | "tiktok" | "direct" | "unknown";

function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (/\.(mp4|mov|webm|m4v)(\?|$)/.test(u)) return "direct";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return "unknown";
}

function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(shorts|embed)\/([\w-]+)/);
    if (m) return m[2];
    return null;
  } catch { return null; }
}

async function fetchOEmbedTitle(url: string): Promise<string | null> {
  try {
    const endpoints = [
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`,
    ];
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep);
        if (r.ok) {
          const j = await r.json();
          if (j?.title) return j.title as string;
        }
      } catch {/* try next */}
    }
  } catch {/* ignore */}
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try { parsed = new URL(url); } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      return new Response(JSON.stringify({ error: "Only http(s) URLs allowed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = detectPlatform(url);
    if (platform === "unknown") {
      return new Response(JSON.stringify({ error: "Unsupported link. Use a direct .mp4, YouTube, TikTok, or Instagram URL." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let title: string | null = null;
    let thumbnail: string | null = null;

    if (platform === "youtube") {
      const id = youTubeId(url);
      if (id) thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      title = await fetchOEmbedTitle(url);
    } else if (platform === "tiktok" || platform === "instagram") {
      title = await fetchOEmbedTitle(url);
    } else if (platform === "direct") {
      title = decodeURIComponent(parsed.pathname.split("/").pop() || "External video").replace(/\.[^.]+$/, "");
    }

    if (!title) title = `${platform[0].toUpperCase()}${platform.slice(1)} video`;

    const { data: inserted, error: insErr } = await supabase
      .from("videos")
      .insert({
        user_id: userId,
        title,
        external_url: url,
        thumbnail_url: thumbnail,
        source_type: "link",
        source_platform: platform,
        status: "fetching",
        viral_status: "pending",
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    // Trigger analysis (fire and forget)
    supabase.functions.invoke("analyze-video", { body: { video_id: inserted.id } }).catch(() => {});

    return new Response(
      JSON.stringify({ ok: true, video_id: inserted.id, title, thumbnail, platform }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("process-external-video error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
