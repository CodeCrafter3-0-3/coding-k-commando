import { useState } from "react";
import { Bell, Search, Command, Database, LogOut, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { user, signOut } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const initials = (user?.email ?? "U")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();
  const handle = user?.email ? `@${user.email.split("@")[0]}` : "@studio";

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data");
      if (error) throw error;
      toast({
        title: "Demo data seeded",
        description: `${data?.videos ?? 0} videos · ${data?.analytics ?? 0} analytics rows`,
      });
      // Trigger refresh
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      toast({ title: "Seed failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 py-1 pl-1 pr-3 transition hover:border-primary/40">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <p className="text-sm font-semibold">{user?.email?.split("@")[0] ?? "Creator"}</p>
                <p className="text-[11px] text-muted-foreground">{handle} · Pro</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-border/60">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Signed in as
              <div className="truncate text-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Developer
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleSeed();
              }}
              disabled={seeding}
            >
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed 30 days of demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                signOut();
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
