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
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
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
            <div>
              <p className="text-3xl font-black text-navy">{formatNumber(total)}</p>
              <p className="text-xs font-semibold text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {top.map((item, index) => {
            const pct = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-navy">{item.name}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{formatNumber(item.value)} mentions</p>
                  </div>
                </div>
                <div>
                  <p className="text-right text-xs font-black text-turquoise">{pct}%</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-soft-2">
                    <div
                      className="h-full rounded-full bg-current text-turquoise"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
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
