import { Globe2, Users, Clock } from "lucide-react";

const countries = [
  { name: "United States", pct: 38 },
  { name: "Brazil", pct: 18 },
  { name: "Germany", pct: 12 },
  { name: "Japan", pct: 9 },
  { name: "India", pct: 7 },
];

export function AudienceCard() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-primary-glow" />
        <p className="text-sm text-muted-foreground">Audience</p>
      </div>
      <h3 className="mt-1 font-display text-2xl font-semibold">Top regions</h3>

      <div className="mt-5 space-y-3">
        {countries.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-xs">
              <span className="text-foreground/90">{c.name}</span>
              <span className="text-muted-foreground">{c.pct}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary shadow-glow"
                style={{ width: `${c.pct * 2.4}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat icon={Users} label="New followers" value="+2,418" />
        <Stat icon={Clock} label="Avg. watch" value="3:42" />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
