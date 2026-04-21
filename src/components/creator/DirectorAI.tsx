import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, X, Loader2, TrendingUp, Palette, Compass } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Brief {
  theme: string;
  suggestion: string;
  trend: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function DirectorAI() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadBrief = async () => {
    setBriefLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("director-ai", { body: { mode: "brief" } });
      if (error) throw error;
      setBrief(data);
    } catch {
      // silent
    } finally {
      setBriefLoading(false);
    }
  };

  useEffect(() => {
    if (user && open && !brief) loadBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("director-ai", {
        body: { mode: "chat", messages: next },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data?.reply ?? "…" }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "I hit a snag. Try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = [
    "What should I post next?",
    "Critique my latest video",
    "Suggest a new thumbnail style",
  ];

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 18 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Director AI"
        className="fixed bottom-24 right-5 z-40 md:bottom-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow ring-1 ring-primary/40"
      >
        <span className="absolute inset-0 -z-10 animate-pulse-glow rounded-full" />
        <Bot className="h-6 w-6" />
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="glass-card !border-l border-border/60 p-0 w-full sm:max-w-md flex flex-col gap-0"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/50 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight">Director AI</p>
              <p className="text-xs text-muted-foreground">Reading your channel in real time</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Brief */}
          <div className="space-y-3 border-b border-border/50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Today's brief
            </p>

            {briefLoading && !brief && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your last 10 videos…
              </div>
            )}

            <AnimatePresence>
              {brief && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <BriefRow icon={Compass} tint="primary" label="Theme" text={brief.theme} />
                  <BriefRow icon={Palette} tint="accent" label="Suggestion" text={brief.suggestion} />
                  <BriefRow icon={TrendingUp} tint="success" label="Trend alert" text={brief.trend} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs hover:border-primary/50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border border-border/50 bg-secondary/40 text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="max-w-[88%] rounded-2xl border border-border/50 bg-secondary/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 focus-within:border-primary/60">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask the director anything…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BriefRow({
  icon: Icon,
  tint,
  label,
  text,
}: {
  icon: any;
  tint: "primary" | "accent" | "success";
  label: string;
  text: string;
}) {
  const colors: Record<string, string> = {
    primary: "hsl(var(--primary))",
    accent: "hsl(var(--accent))",
    success: "hsl(var(--success))",
  };
  const c = colors[tint];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${c}22`, color: c }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-snug">{text}</p>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, delay }}
      className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/60"
    />
  );
}
