import { Home, PlayCircle, Upload, BarChart3, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { url: "/dashboard", icon: Home, label: "Home" },
  { url: "/dashboard/content", icon: PlayCircle, label: "Content" },
  { url: "/dashboard/upload", icon: Upload, label: "Upload" },
  { url: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { url: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-4 left-1/2 z-40 -translate-x-1/2 glass-card flex items-center gap-1 rounded-full px-2 py-2 shadow-elegant"
    >
      {items.map((item) => {
        const active =
          item.url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.url);
        return (
          <NavLink
            key={item.url}
            to={item.url}
            aria-label={item.label}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-full transition",
              active
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </NavLink>
        );
      })}
    </nav>
  );
}
