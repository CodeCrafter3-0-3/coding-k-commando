import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { BarChart3, Home, PlayCircle, Settings, Upload, Eye, Sparkles } from "lucide-react";
import { useVideos } from "@/hooks/useVideos";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { videos } = useVideos(20);
  const [, force] = useState(0);

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        force((n) => n + 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search videos, metrics, navigate…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}>
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/content")}>
            <PlayCircle className="mr-2 h-4 w-4" /> Content
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/upload")}>
            <Upload className="mr-2 h-4 w-4" /> Upload a video
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>

        {videos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your videos">
              {videos.slice(0, 8).map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.title} ${v.status}`}
                  onSelect={() => go(`/dashboard/video/${v.id}`)}
                >
                  <PlayCircle className="mr-2 h-4 w-4 text-primary-glow" />
                  <span className="truncate">{v.title}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {v.views_count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Metrics">
          {["Views", "Engagement", "Revenue", "Subscribers"].map((m) => (
            <CommandItem key={m} onSelect={() => go("/dashboard")}>
              <Sparkles className="mr-2 h-4 w-4 text-accent" /> Open {m} chart
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
