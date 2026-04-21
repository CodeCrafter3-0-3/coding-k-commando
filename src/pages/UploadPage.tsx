import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CloudUpload, Film, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/creator/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { celebrate } from "@/lib/confetti";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<number | null>(null);

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
          })
          .select("id")
          .single();
        if (insErr) throw insErr;

        stopFakeProgress();
        setProgress(100);
        setState("success");

        // First-upload celebration
        try {
          const { count } = await supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
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
        toast({
          title: "Upload failed",
          description: e?.message ?? "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    [user, navigate],
  );

  const reset = () => {
    setState("idle");
    setProgress(0);
    setFileName(null);
  };

  return (
    <DashboardLayout>
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-sm text-muted-foreground">Studio · Upload</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Drop a video to publish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          MP4, MOV or WebM up to 200 MB. We'll analyze it with AI right after upload.
        </p>

        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (state === "uploading") return;
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => state !== "uploading" && inputRef.current?.click()}
          className={cn(
            "mt-6 grid place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition",
            dragOver
              ? "border-primary bg-primary/10 shadow-glow"
              : "border-border bg-secondary/30 hover:border-primary/60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                  <CloudUpload className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-display text-lg">Drag & drop your video here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
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
      </div>
    </DashboardLayout>
  );
}
