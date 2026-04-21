import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUserId } from "@/lib/demoUser";

export interface DashboardData {
  loading: boolean;
  totals: {
    views: number;
    engagement: number;
    revenue: number;
    subscribers: number;
  };
  deltas: {
    views: number;
    engagement: number;
    revenue: number;
    subscribers: number;
  };
  sparks: {
    views: { v: number }[];
    engagement: { v: number }[];
    revenue: { v: number }[];
    subscribers: { v: number }[];
  };
  growth: { day: string; views: number; engagement: number }[];
}

const empty: DashboardData = {
  loading: true,
  totals: { views: 0, engagement: 0, revenue: 0, subscribers: 0 },
  deltas: { views: 0, engagement: 0, revenue: 0, subscribers: 0 },
  sparks: { views: [], engagement: [], revenue: [], subscribers: [] },
  growth: [],
};

function pctDelta(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>(empty);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const userId = await getDemoUserId();

        // Pull last 28 days analytics so we can compare 14d vs prior 14d
        const since = new Date();
        since.setDate(since.getDate() - 28);

        const [{ data: analytics }, { count: subsCount }] = await Promise.all([
          supabase
            .from("analytics")
            .select("date, views, watch_time, engagement, revenue")
            .eq("user_id", userId)
            .gte("date", since.toISOString().slice(0, 10))
            .order("date", { ascending: true }),
          supabase
            .from("videos")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
        ]);

        const rows = analytics ?? [];

        // Bucket per day
        const byDay = new Map<string, { v: number; e: number; r: number }>();
        rows.forEach((r) => {
          const key = r.date as string;
          const cur = byDay.get(key) ?? { v: 0, e: 0, r: 0 };
          cur.v += r.views ?? 0;
          cur.e += r.engagement ?? 0;
          cur.r += Number(r.revenue ?? 0);
          byDay.set(key, cur);
        });

        // Build last 28 days timeline (fill gaps)
        const days: { date: string; v: number; e: number; r: number }[] = [];
        for (let i = 27; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const v = byDay.get(key) ?? { v: 0, e: 0, r: 0 };
          days.push({ date: key, ...v });
        }

        const last14 = days.slice(-14);
        const prev14 = days.slice(0, 14);

        const sum = (arr: typeof days, k: "v" | "e" | "r") =>
          arr.reduce((s, x) => s + x[k], 0);

        const totals = {
          views: sum(last14, "v"),
          engagement: sum(last14, "e"),
          revenue: sum(last14, "r"),
          subscribers: subsCount ?? 0,
        };

        const prev = {
          views: sum(prev14, "v"),
          engagement: sum(prev14, "e"),
          revenue: sum(prev14, "r"),
        };

        const deltas = {
          views: pctDelta(totals.views, prev.views),
          engagement: pctDelta(totals.engagement, prev.engagement),
          revenue: pctDelta(totals.revenue, prev.revenue),
          subscribers: 0,
        };

        const growth = last14.map((d) => ({
          day: d.date.slice(5),
          views: d.v,
          engagement: d.e,
        }));

        const sparks = {
          views: last14.map((d) => ({ v: d.v })),
          engagement: last14.map((d) => ({ v: d.e })),
          revenue: last14.map((d) => ({ v: d.r })),
          subscribers: last14.map((d, i) => ({ v: (subsCount ?? 0) * (0.9 + i * 0.008) })),
        };

        if (active) setData({ loading: false, totals, deltas, sparks, growth });
      } catch (e) {
        console.error("Dashboard data error", e);
        if (active) setData({ ...empty, loading: false });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return data;
}
