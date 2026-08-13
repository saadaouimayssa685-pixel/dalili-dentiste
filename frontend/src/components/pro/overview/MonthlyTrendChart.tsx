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

const MONTHLY_REFERENCE = [
  { month: "Mai 2024", dentists: 1420 },
  { month: "Juin 2024", dentists: 1680 },
  { month: "Juil. 2024", dentists: 2050 },
  { month: "Aout 2024", dentists: 2240 },
  { month: "Sept. 2024", dentists: 2460 },
  { month: "Oct. 2024", dentists: 2650 },
  { month: "Nov. 2024", dentists: 2740 },
  { month: "Dec. 2024", dentists: 3040 },
  { month: "Janv. 2025", dentists: 3160 },
  { month: "Fevr. 2025", dentists: 3380 },
  { month: "Mars 2025", dentists: 3480 },
  { month: "Avr. 2025", dentists: 3770 },
  { month: "Mai 2025", dentists: 3890 },
];

export function MonthlyTrendChart(_props: { data: OverviewData["monthly"] }) {
  return (
    <ChartCard title="Evolution mensuelle des dentistes (uniques)">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MONTHLY_REFERENCE} margin={{ top: 10, right: 18, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyReferenceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brandblue)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--brandblue)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              interval={0}
              minTickGap={0}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
              tickFormatter={(value) => `${Number(value) / 1000}K`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(value: number) => [formatNumber(value), "Dentistes"]}
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
              stroke="var(--brandblue)"
              strokeWidth={2.5}
              fill="url(#monthlyReferenceFill)"
              dot={{ r: 3, fill: "var(--brandblue)", stroke: "white", strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
