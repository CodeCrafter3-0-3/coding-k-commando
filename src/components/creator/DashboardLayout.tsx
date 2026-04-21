import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { CreatorSidebar } from "./CreatorSidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { DirectorAI } from "./DirectorAI";
import { CommandPalette } from "./CommandPalette";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <CreatorSidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 pb-28 md:pb-4 md:pl-0">
        <TopBar onOpenSearch={() => setPaletteOpen(true)} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 space-y-4"
        >
          {children}
        </motion.main>
      </div>

      <MobileNav />
      <DirectorAI />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
