import { Eye, MoreHorizontal, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideos } from "@/hooks/useVideos";

const statusStyles: Record<string, string> = {
  live: "bg-success/15 text-success",
  processing: "bg-warning/15 text-warning",
  scheduled: "bg-primary/15 text-primary-glow",
  draft: "bg-muted text-muted-foreground",
};

const thumbGradients = [
  "from-indigo-500/40 to-fuchsia-500/30",
  "from-cyan-500/40 to-indigo-500/30",
  "from-violet-500/40 to-pink-500/30",
  "from-blue-500/40 to-purple-500/30",
  "from-emerald-500/30 to-indigo-500/40",
];

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ContentFeed() {
  const { videos, loading } = useVideos(6);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Recent uploads</p>
          <h3 className="font-display text-2xl font-semibold">Content Feed</h3>
        </div>
        <button className="text-xs font-medium text-primary-glow hover:underline">View all</button>
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading videos…
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="font-display text-lg">No videos yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to <span className="text-primary-glow">Upload</span> to publish your first one.
          </p>
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {videos.map((v, i) => {
          const status = (v.status ?? "draft").toLowerCase();
          return (
            <li
              key={v.id}
              className="group flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 p-3 transition hover:border-primary/40 hover:bg-secondary/60"
            >
              <div
                className={cn(
                  "relative h-24 w-[54px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br",
                  thumbGradients[i % thumbGradients.length],
                )}
              >
                {v.thumbnail_url && (
                  <img src={v.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_60%)]" />
                <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                  <Play className="h-5 w-5 text-foreground drop-shadow" fill="currentColor" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{v.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {formatViews(v.views_count)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                      statusStyles[status] ?? statusStyles.draft,
                    )}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
