import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

export function MonthlyTrendChart({ data }: { data: OverviewData["monthly"] }) {
  const latestTotal = data.at(-1)?.dentists ?? 0;

  if (data.length <= 1) {
    return (
      <ChartCard title="Volume consolide" subtitle="Snapshot actuel de la base SQL">
        <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-turquoise/35 bg-soft/50 p-8 text-center">
          <p className="text-5xl font-black text-navy">{formatNumber(latestTotal)}</p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">dentistes uniques references</p>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            L'historique mensuel demarre avec les prochains runs GitHub Actions. Les valeurs seront
            tracees automatiquement lorsque plusieurs snapshots seront disponibles.
          </p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Evolution mensuelle" subtitle="Nombre de dentistes references">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 26, right: 18, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--turquoise)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--turquoise)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(v: number) => [
                `${formatNumber(v)} (${latestTotal ? Math.round((v / latestTotal) * 100) : 0} % du dernier mois)`,
                "Dentistes",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="dentists"
              stroke="var(--turquoise)"
              strokeWidth={2.5}
              fill="url(#trendFill)"
              dot={{ r: 4, fill: "var(--turquoise)" }}
            >
              <LabelList
                dataKey="dentists"
                position="top"
                formatter={(value: number) => formatNumber(value)}
                className="fill-navy text-xs font-bold"
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
