import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    setVideos((data ?? []) as VideoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const channel = supabase
      .channel(`videos-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "videos", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, limit]);

  return { videos, loading, refresh };
}
