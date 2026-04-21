import { Link } from "react-router-dom";
import { Eye, Loader2, Play, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/creator/DashboardLayout";
import { useVideos } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  live: "bg-success/15 text-success",
  processing: "bg-warning/15 text-warning",
  analyzing: "bg-primary/15 text-primary-glow",
  scheduled: "bg-primary/15 text-primary-glow",
  draft: "bg-muted text-muted-foreground",
};

export default function ContentPage() {
  const { videos, loading } = useVideos(50);

  return (
    <DashboardLayout>
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">All uploads</p>
            <h1 className="font-display text-3xl font-semibold">Your Content</h1>
          </div>
          <Link
            to="/dashboard/upload"
            className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            New upload
          </Link>
        </div>

        {loading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading videos…
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-border/60 p-10 text-center">
            <p className="font-display text-lg">No videos yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload your first video to see it here.</p>
          </div>
        )}

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => {
            const status = (v.status ?? "draft").toLowerCase();
            return (
              <li key={v.id}>
                <Link
                  to={`/dashboard/video/${v.id}`}
                  className="group block overflow-hidden rounded-xl border border-border/50 bg-secondary/30 transition hover:border-primary/40"
                >
                  <div className="relative aspect-[9/12] w-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30">
                    {v.thumbnail_url && (
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-background/80 backdrop-blur">
                        <Play className="h-5 w-5" fill="currentColor" />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        statusStyles[status] ?? statusStyles.draft,
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{v.title}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {v.views_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-primary-glow">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardLayout>
  );
}
