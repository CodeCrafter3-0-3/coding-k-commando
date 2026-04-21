import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CloudUpload, Film, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demoUser";
import { CreatorSidebar } from "@/components/creator/CreatorSidebar";
import { TopBar } from "@/components/creator/TopBar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
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
        // Ease out as we approach 92
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

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
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
      const userId = await getDemoUserId();
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);

      const { error: insErr } = await supabase.from("videos").insert({
        user_id: userId,
        video_url: pub.publicUrl,
        title: file.name.replace(/\.[^.]+$/, ""),
        status: "processing",
      });
      if (insErr) throw insErr;

      stopFakeProgress();
      setProgress(100);
      setState("success");
      toast({ title: "Upload complete", description: "Your video is processing." });
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
  }, []);

  const reset = () => {
    setState("idle");
    setProgress(0);
    setFileName(null);
  };

  return (
    <div className="flex min-h-screen w-full">
      <CreatorSidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:pl-0">
        <TopBar />
        <main className="flex-1">
          <div className="glass-card mx-auto max-w-3xl p-8">
            <p className="text-sm text-muted-foreground">Studio · Upload</p>
            <h1 className="mt-1 font-display text-3xl font-semibold">Drop a video to publish</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              MP4, MOV or WebM up to 200 MB. We'll handle the rest.
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
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                      <CloudUpload className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="font-display text-lg">Drag & drop your video here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </motion.div>
                )}

                {state === "uploading" && (
                  <motion.div
                    key="up"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-md"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Film className="h-5 w-5 text-primary-glow" />
                      <p className="truncate text-sm font-medium">{fileName}</p>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-gradient-primary shadow-glow"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut", duration: 0.3 }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Uploading to secure storage…</p>
                  </motion.div>
                )}

                {state === "success" && (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success/20 text-success animate-pulse-glow">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="font-display text-lg">Upload complete</p>
                    <p className="text-xs text-muted-foreground">{fileName} · processing</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="mt-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary"
                    >
                      Upload another
                    </button>
                  </motion.div>
                )}

                {state === "error" && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/20 text-destructive">
                      <X className="h-7 w-7" />
                    </div>
                    <p className="font-display text-lg">Upload failed</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="mt-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
