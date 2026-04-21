import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme !== "light";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-secondary/40 transition hover:border-primary/50"
    >
      {mounted && (isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />)}
    </button>
  );
}
