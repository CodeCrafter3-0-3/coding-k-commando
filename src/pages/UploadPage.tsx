import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CloudUpload, Film, Link2, Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/creator/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { celebrate } from "@/lib/confetti";

type UploadState = "idle" | "uploading" | "success" | "error";

function detectPlatform(url: string) {
  const u = url.toLowerCase();
  if (/\.(mp4|mov|webm|m4v)(\?|$)/.test(u)) return "direct";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return null;
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

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // File upload state
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<number | null>(null);

  // URL state
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const platform = useMemo(() => (url ? detectPlatform(url.trim()) : null), [url]);
  const isValidUrl = !!platform;

  const previewThumb = useMemo(() => {
    if (!url) return null;
    if (platform === "youtube") {
      const id = youTubeId(url.trim());
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    }
    return null;
  }, [url, platform]);

  const startFakeProgress = () => {
    setProgress(2);
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const inc = Math.max(0.6, (92 - p) * 0.06);
        return Math.min(92, p + inc);
      });
    }, 120);
  };

  const stopFakeProgress = () => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !user) return;
      const file = files[0];

      if (!file.type.startsWith("video/")) {
        toast({ title: "Invalid file", description: "Please upload a video file.", variant: "destructive" });
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 200 MB for now.", variant: "destructive" });
        return;
      }

      setFileName(file.name);
      setState("uploading");
      startFakeProgress();

      try {
        const ext = file.name.split(".").pop() ?? "mp4";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("videos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);

        const { data: inserted, error: insErr } = await supabase
          .from("videos")
          .insert({
            user_id: user.id,
            video_url: pub.publicUrl,
            title: file.name.replace(/\.[^.]+$/, ""),
            status: "analyzing",
            viral_status: "pending",
            source_type: "upload",
          } as any)
          .select("id")
          .single();
        if (insErr) throw insErr;

        stopFakeProgress();
        setProgress(100);
        setState("success");

        try {
          const { count } = await supabase
            .from("videos").select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          if ((count ?? 0) <= 1) celebrate();
        } catch {/* ignore */}

        toast({ title: "Upload complete 🎬", description: "Sending to AI Reviewer…" });
        supabase.functions.invoke("analyze-video", { body: { video_id: inserted.id } }).catch(() => {});
        setTimeout(() => navigate(`/dashboard/video/${inserted.id}`), 800);
      } catch (e: any) {
        console.error(e);
        stopFakeProgress();
        setState("error");
        setProgress(0);
        toast({ title: "Upload failed", description: e?.message ?? "Something went wrong.", variant: "destructive" });
      }
    },
    [user, navigate],
  );

  const handleFetchUrl = async () => {
    if (!user || !url.trim()) return;
    if (!isValidUrl) {
      toast({ title: "Unsupported link", description: "Paste a direct .mp4, YouTube, TikTok, or Instagram URL.", variant: "destructive" });
      return;
    }
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-external-video", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      celebrate();
      toast({ title: "Link validated ✓", description: "Sending to AI Reviewer…" });
      const vid = (data as any)?.video_id;
      if (vid) setTimeout(() => navigate(`/dashboard/video/${vid}`), 600);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fetch failed", description: e?.message ?? "Could not process link.", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setFileName(null);
  };

  return (
    <DashboardLayout>
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-sm text-muted-foreground">Studio · Add content</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Upload a file or paste a link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Drop a local video, or analyze any YouTube / Reels / TikTok URL without re-uploading.
        </p>

        <Tabs defaultValue="file" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/40">
            <TabsTrigger value="file" className="gap-2"><CloudUpload className="h-4 w-4" /> File Upload</TabsTrigger>
            <TabsTrigger value="url" className="gap-2"><Link2 className="h-4 w-4" /> URL Link</TabsTrigger>
          </TabsList>

          {/* FILE TAB */}
          <TabsContent value="file" className="mt-5">
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (state === "uploading") return;
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => state !== "uploading" && inputRef.current?.click()}
              className={cn(
                "grid place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition",
                dragOver ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-secondary/30 hover:border-primary/60",
              )}
            >
              <input ref={inputRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => handleFiles(e.target.files)} />

              <AnimatePresence mode="wait">
                {state === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                      <CloudUpload className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="font-display text-lg">Drag & drop your video here</p>
                    <p className="text-xs text-muted-foreground">or click to browse · MP4 / MOV / WebM up to 200 MB</p>
                  </motion.div>
                )}

                {state === "uploading" && (
                  <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
                    <div className="flex items-center gap-3 text-left">
                      <Film className="h-5 w-5 text-primary-glow" />
                      <p className="truncate text-sm font-medium">{fileName}</p>
                      <span className="ml-auto text-xs text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div className="h-full rounded-full bg-gradient-primary shadow-glow" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "easeOut", duration: 0.3 }} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Uploading to secure storage…</p>
                  </motion.div>
                )}

                {state === "success" && (
                  <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success/20 text-success animate-pulse-glow">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="font-display text-lg">Upload complete</p>
                    <p className="text-xs text-muted-foreground">{fileName} · opening AI Reviewer…</p>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="mt-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary">
                      Upload another
                    </button>
                  </motion.div>
                )}

                {state === "error" && (
                  <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/20 text-destructive">
                      <X className="h-7 w-7" />
                    </div>
                    <p className="font-display text-lg">Upload failed</p>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="mt-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary">
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* URL TAB */}
          <TabsContent value="url" className="mt-5">
            <div className="rounded-2xl border border-border bg-secondary/30 p-6">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Paste a video link
              </label>
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/shorts/… or https://cdn.site/clip.mp4"
                    className="pl-9 pr-10 bg-background/60"
                    disabled={fetching}
                  />
                  <AnimatePresence>
                    {isValidUrl && (
                      <motion.div
                        key="ok"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-success"
                        title="Link validated"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button onClick={handleFetchUrl} disabled={!isValidUrl || fetching} className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Fetch & Analyze
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Supports:</span>
                {["YouTube", "TikTok", "Instagram", "Direct .mp4"].map((p) => (
                  <span key={p} className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5">{p}</span>
                ))}
              </div>

              <AnimatePresence>
                {isValidUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-5 flex items-center gap-4 rounded-xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-lg bg-secondary">
                      {previewThumb ? (
                        <img src={previewThumb} alt="Video thumbnail preview" className="h-full w-full object-cover" />
                      ) : (
                        <Film className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Link validated
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-primary-glow">{platform}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
