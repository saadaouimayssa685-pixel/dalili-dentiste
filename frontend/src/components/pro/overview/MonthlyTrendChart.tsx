import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

export function MonthlyTrendChart({ data }: { data: OverviewData["monthly"] }) {
  const latestTotal = data.at(-1)?.dentists ?? 0;

  return (
    <ChartCard title="Évolution mensuelle" subtitle="Nombre de dentistes référencés">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
              dot={{ r: 3, fill: "var(--turquoise)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
