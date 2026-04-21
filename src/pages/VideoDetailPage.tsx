import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/creator/DashboardLayout";
import { toast } from "@/hooks/use-toast";

interface AiFeedback {
  triggers: string[];
  suggestions: string[];
  hook: string;
  pacing: string;
  trend_alignment: string;
}

interface VideoDetail {
  id: string;
  title: string;
  status: string;
  views_count: number;
  video_url: string | null;
  thumbnail_url: string | null;
  ai_score: number | null;
  ai_feedback: AiFeedback | null;
  viral_status: string;
  created_at: string;
}

export default function VideoDetailPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchVideo = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      toast({ title: "Failed to load video", description: error.message, variant: "destructive" });
    }
    setVideo(data as unknown as VideoDetail | null);
    setLoading(false);
  };

  const runAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke("analyze-video", {
        body: { video_id: id },
      });
      if (error) throw error;
      await fetchVideo();
      toast({ title: "Analysis complete", description: "AI Reach Prediction is ready." });
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e?.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchVideo();
    // Auto-trigger analysis if pending
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (video && video.viral_status === "pending" && !analyzing) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  return (
    <DashboardLayout>
      <Link
        to="/dashboard/content"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to content
      </Link>

      {loading && (
        <div className="glass-card grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
        </div>
      )}

      {!loading && !video && (
        <div className="glass-card p-8 text-center">
          <p className="font-display text-lg">Video not found</p>
        </div>
      )}

      {video && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Player + meta */}
          <div className="space-y-4 lg:col-span-2">
            <div className="glass-card overflow-hidden">
              <div className="relative aspect-video w-full bg-black">
                {video.video_url ? (
                  <video
                    src={video.video_url}
                    controls
                    className="h-full w-full object-contain"
                    poster={video.thumbnail_url ?? undefined}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">No video URL</div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(video.created_at).toLocaleString()}
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold">{video.title}</h1>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {video.views_count.toLocaleString()} views
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] uppercase tracking-wide">
                    {video.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Reviewer */}
          <AiReviewer
            score={video.ai_score}
            feedback={video.ai_feedback}
            status={video.viral_status}
            analyzing={analyzing}
            onRerun={runAnalysis}
          />
        </div>
      )}
    </DashboardLayout>
  );
}

function AiReviewer({
  score,
  feedback,
  status,
  analyzing,
  onRerun,
}: {
  score: number | null;
  feedback: AiFeedback | null;
  status: string;
  analyzing: boolean;
  onRerun: () => void;
}) {
  const isReady = status === "analyzed" && score != null && feedback;

  return (
    <div className="glass-card flex flex-col p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" /> AI Reviewer
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold">Reach Prediction</h3>
        </div>
        <button
          onClick={onRerun}
          disabled={analyzing}
          className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
        >
          {analyzing ? "Analyzing…" : "Re-run"}
        </button>
      </div>

      {(analyzing || !isReady) && (
        <div className="mt-6 grid place-items-center gap-3 rounded-xl border border-dashed border-border/60 bg-secondary/30 p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
          <p className="text-sm font-medium">Analyzing hook, pacing & trends…</p>
          <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
        </div>
      )}

      {isReady && feedback && (
        <>
          <ScoreRing score={score!} />

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Viral triggers
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {feedback.triggers.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs text-success"
                >
                  <CheckCircle2 className="h-3 w-3" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Suggestions
            </p>
            <ul className="mt-2 space-y-2">
              {feedback.suggestions.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 rounded-lg border border-border/50 bg-secondary/30 p-2.5 text-xs"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
            <Stat label="Hook" value={feedback.hook} />
            <Stat label="Pacing" value={feedback.pacing} />
            <Stat label="Trend" value={feedback.trend_alignment} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2 text-center">
      <p className="uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 80 ? "hsl(var(--success))" : pct >= 60 ? "hsl(var(--primary))" : "hsl(var(--warning))";

  return (
    <div className="mt-6 flex items-center gap-5">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke={tone}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 42}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${tone})` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-3xl font-semibold">{pct}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">/100</p>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="flex items-center gap-1 text-xs font-semibold text-primary-glow">
          <TrendingUp className="h-3.5 w-3.5" />
          {pct >= 80 ? "Viral potential" : pct >= 60 ? "Strong reach" : "Needs work"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          AI prediction based on hook, pacing & trend alignment.
        </p>
      </div>
    </div>
  );
}
