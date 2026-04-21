import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demoUser";

export interface VideoRow {
  id: string;
  title: string;
  status: string;
  views_count: number;
  thumbnail_url: string | null;
  video_url: string | null;
  created_at: string;
}

export function useVideos(limit = 8) {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const userId = await getDemoUserId();
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    setVideos((data ?? []) as VideoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const userId = await getDemoUserId();
      channel = supabase
        .channel("videos-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "videos", filter: `user_id=eq.${userId}` },
          () => refresh(),
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return { videos, loading, refresh };
}
