import { CreatorSidebar } from "@/components/creator/CreatorSidebar";
import { TopBar } from "@/components/creator/TopBar";
import { KpiCard } from "@/components/creator/KpiCard";
import { GrowthChart } from "@/components/creator/GrowthChart";
import { ContentFeed } from "@/components/creator/ContentFeed";
import { AudienceCard } from "@/components/creator/AudienceCard";
import { Eye, Heart, DollarSign, UserPlus } from "lucide-react";

const spark = (seed: number) =>
  Array.from({ length: 16 }, (_, i) => ({
    v: 20 + Math.sin(i / 1.6 + seed) * 14 + i * 1.6 + Math.random() * 6,
  }));

const Index = () => {
  return (
    <div className="flex min-h-screen w-full">
      <CreatorSidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:pl-0">
        <TopBar />

        <main className="flex-1 space-y-4">
          {/* Hero */}
          <section className="glass-card animate-fade-up overflow-hidden p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back, Ava</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Your channel is up <span className="text-gradient">+24.6%</span> this week
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Three videos crossed 100k views. Engagement spiked Tuesday — likely the new editing style.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-2 text-sm font-medium hover:bg-secondary">
                  Export report
                </button>
                <button className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
                  New upload
                </button>
              </div>
            </div>
          </section>

          {/* KPI bento */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Views" value="1.24M" delta={18.2} icon={Eye} data={spark(1)} accent="primary" />
            <KpiCard label="Engagement" value="86.4K" delta={9.1} icon={Heart} data={spark(2)} accent="accent" />
            <KpiCard label="Revenue" value="$12,840" delta={-3.4} icon={DollarSign} data={spark(3)} accent="warning" />
            <KpiCard label="Subscribers" value="248,902" delta={5.8} icon={UserPlus} data={spark(4)} accent="success" />
          </section>

          {/* Bento grid */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><GrowthChart /></div>
            <AudienceCard />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><ContentFeed /></div>
            <div className="glass-card flex flex-col justify-between overflow-hidden p-6">
              <div>
                <p className="text-sm text-muted-foreground">AI Studio</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">Ideas for next week</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    "POV: editing in 60 seconds",
                    "My 5 most stolen LUTs",
                    "Reacting to viewer edits",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-primary shadow-glow" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="mt-6 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary-glow transition hover:bg-primary/20">
                Generate more ideas
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
