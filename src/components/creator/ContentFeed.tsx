import { Eye, MoreHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Live" | "Processing" | "Scheduled" | "Draft";

interface VideoItem {
  id: string;
  title: string;
  views: string;
  status: Status;
  thumb: string;
  duration: string;
}

const videos: VideoItem[] = [
  { id: "1", title: "How I edit cinematic B-roll in 4 minutes", views: "182.4K", status: "Live", duration: "0:42", thumb: "from-indigo-500/40 to-fuchsia-500/30" },
  { id: "2", title: "Studio tour 2026 — my new setup", views: "—", status: "Processing", duration: "1:08", thumb: "from-cyan-500/40 to-indigo-500/30" },
  { id: "3", title: "Color grading secrets nobody tells you", views: "94.7K", status: "Live", duration: "0:58", thumb: "from-violet-500/40 to-pink-500/30" },
  { id: "4", title: "Premiere Friday — drops at 8PM EST", views: "—", status: "Scheduled", duration: "1:32", thumb: "from-blue-500/40 to-purple-500/30" },
  { id: "5", title: "Sound design pack you can steal", views: "47.2K", status: "Live", duration: "0:51", thumb: "from-emerald-500/30 to-indigo-500/40" },
];

const statusStyles: Record<Status, string> = {
  Live: "bg-success/15 text-success",
  Processing: "bg-warning/15 text-warning",
  Scheduled: "bg-primary/15 text-primary-glow",
  Draft: "bg-muted text-muted-foreground",
};

export function ContentFeed() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Recent uploads</p>
          <h3 className="font-display text-2xl font-semibold">Content Feed</h3>
        </div>
        <button className="text-xs font-medium text-primary-glow hover:underline">View all</button>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {videos.map((v) => (
          <li
            key={v.id}
            className="group flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 p-3 transition hover:border-primary/40 hover:bg-secondary/60"
          >
            {/* 9:16 thumbnail */}
            <div
              className={cn(
                "relative h-24 w-[54px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br",
                v.thumb,
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_60%)]" />
              <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                <Play className="h-5 w-5 text-foreground drop-shadow" fill="currentColor" />
              </div>
              <span className="absolute bottom-1 right-1 rounded bg-background/70 px-1 text-[9px] font-medium backdrop-blur">
                {v.duration}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{v.title}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {v.views}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusStyles[v.status])}>
                  {v.status}
                </span>
              </div>
            </div>

            <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
