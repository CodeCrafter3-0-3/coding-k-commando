import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  data: { v: number }[];
  accent?: "primary" | "accent" | "success" | "warning";
}

const accentMap = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
};

export function KpiCard({ label, value, delta, icon: Icon, data, accent = "primary" }: KpiCardProps) {
  const color = accentMap[accent];
  const positive = delta >= 0;
  const id = `spark-${label.replace(/\s+/g, "")}`;

  return (
    <div className="glass-card group relative overflow-hidden p-5 transition hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: `${color}22`, color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? "+" : ""}
          {delta}%
        </span>
      </div>

      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</p>

      <div className="mt-2 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${id})`}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
