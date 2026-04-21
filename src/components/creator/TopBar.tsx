import { Bell, Search, Command } from "lucide-react";

export function TopBar() {
  return (
    <header className="glass-card mx-4 mt-4 flex items-center gap-4 px-5 py-3 md:mx-0 md:mt-0">
      <div className="hidden md:flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span>Search videos, analytics, settings…</span>
        <kbd className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-medium">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-secondary/40 transition hover:border-primary/50">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent shadow-glow" />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 py-1 pl-1 pr-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground">
            AV
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold">Ava Reyes</p>
            <p className="text-[11px] text-muted-foreground">@avastudio · Pro</p>
          </div>
        </div>
      </div>
    </header>
  );
}
