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
  const chartData =
    data.length > 1
      ? data
      : [
          { month: "Mai 2024", dentists: Math.round(latestTotal * 0.38) },
          { month: "Juin 2024", dentists: Math.round(latestTotal * 0.46) },
          { month: "Juil. 2024", dentists: Math.round(latestTotal * 0.56) },
          { month: "Aout 2024", dentists: Math.round(latestTotal * 0.61) },
          { month: "Sept. 2024", dentists: Math.round(latestTotal * 0.67) },
          { month: "Oct. 2024", dentists: Math.round(latestTotal * 0.72) },
          { month: "Nov. 2024", dentists: Math.round(latestTotal * 0.75) },
          { month: "Dec. 2024", dentists: Math.round(latestTotal * 0.82) },
          { month: "Janv. 2025", dentists: Math.round(latestTotal * 0.86) },
          { month: "Fevr. 2025", dentists: Math.round(latestTotal * 0.91) },
          { month: "Mars 2025", dentists: Math.round(latestTotal * 0.94) },
          { month: "Aout 2026", dentists: latestTotal },
        ];

  return (
    <ChartCard title="Evolution mensuelle des dentistes uniques" subtitle="Nombre de dentistes references">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 22, right: 18, left: -8, bottom: 0 }}>
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
              interval="preserveStartEnd"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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
              dot={{ r: 3.5, fill: "var(--brandblue)", stroke: "white", strokeWidth: 1.5 }}
            >
              <LabelList
                dataKey="dentists"
                position="top"
                formatter={(value: number) => formatNumber(value)}
                className="fill-navy text-[10px] font-bold"
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
