import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const COLORS = [
  "var(--brandblue)",
  "var(--turquoise)",
  "var(--primary)",
  "oklch(0.72 0.13 245)",
  "oklch(0.76 0.12 178)",
  "oklch(0.72 0.12 50)",
];

export function SpecialityDonutChart({ data }: { data: OverviewData["specialities"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const top = data.slice(0, 6);

  return (
    <ChartCard title="Specialites en Tunisie" subtitle={`${formatNumber(total)} mentions consolidees`}>
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div className="relative h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={3}
              >
                {top.map((d, i) => (
                  <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n) => [
                  `${formatNumber(v)} (${Math.round((v / total) * 100)} %)`,
                  n as string,
                ]}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <p className="text-2xl font-black text-navy">{formatNumber(total)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">mentions</p>
          </div>
        </div>
        <div className="space-y-3">
          {top.map((item, index) => {
            const pct = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="rounded-2xl bg-soft/55 p-3">
                <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-navy">{item.name}</span>
                    <span className="shrink-0 font-black text-turquoise">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-soft-2">
                    <div
                      className="h-full rounded-full bg-current text-turquoise"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {formatNumber(item.value)} mentions
                  </p>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
