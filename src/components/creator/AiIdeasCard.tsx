import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AiIdeasCard() {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-ideas");
      if (error) throw error;
      setIdeas((data?.ideas ?? []).slice(0, 3));
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate ideas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="glass-card flex flex-col justify-between overflow-hidden p-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" /> AI Studio
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold">Ideas for next week</h3>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Regenerate ideas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <ul className="mt-4 space-y-3 text-sm">
          {loading && ideas.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3 text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> Brainstorming…
                </li>
              ))
            : ideas.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-primary shadow-glow" />
                  <span>{t}</span>
                </li>
              ))}
          {error && <li className="text-xs text-destructive">{error}</li>}
        </ul>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="mt-6 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary-glow transition hover:bg-primary/20 disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Generate more ideas"}
      </button>
    </div>
  );
}
