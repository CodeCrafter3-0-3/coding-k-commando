import { Home, PlayCircle, Upload, BarChart3, Settings, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Content", url: "/content", icon: PlayCircle },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function CreatorSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 p-4">
      <div className="glass-card flex h-full flex-col p-5">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">Creator OS</p>
            <p className="text-xs text-muted-foreground">v2.4 · Studio</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.url;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.title}</span>
                {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
            <p className="font-display text-sm font-semibold">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock advanced analytics, AI editing & priority rendering.
            </p>
            <button className="mt-3 w-full rounded-lg bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
              Go Pro
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
