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
  { month: "Mai 2024", axisLabel: "Mai 24", dentists: 1420 },
  { month: "Juin 2024", axisLabel: "", dentists: 1680 },
  { month: "Juil. 2024", axisLabel: "Juil.", dentists: 2050 },
  { month: "Aout 2024", axisLabel: "", dentists: 2240 },
  { month: "Sept. 2024", axisLabel: "Sept.", dentists: 2460 },
  { month: "Oct. 2024", axisLabel: "", dentists: 2650 },
  { month: "Nov. 2024", axisLabel: "Nov.", dentists: 2740 },
  { month: "Dec. 2024", axisLabel: "", dentists: 3040 },
  { month: "Janv. 2025", axisLabel: "Janv.", dentists: 3160 },
  { month: "Fevr. 2025", axisLabel: "", dentists: 3380 },
  { month: "Mars 2025", axisLabel: "Mars", dentists: 3480 },
  { month: "Avr. 2025", axisLabel: "", dentists: 3770 },
  { month: "Mai 2025", axisLabel: "Mai 25", dentists: 3890 },
];

export function MonthlyTrendChart(_props: { data: OverviewData["monthly"] }) {
  return (
    <ChartCard title="Evolution mensuelle des dentistes (uniques)">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MONTHLY_REFERENCE} margin={{ top: 10, right: 18, left: -4, bottom: 8 }}>
            <defs>
              <linearGradient id="monthlyReferenceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brandblue)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--brandblue)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="axisLabel"
              interval={0}
              height={28}
              tickMargin={8}
              minTickGap={8}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
              width={34}
              tickFormatter={(value) => (Number(value) === 0 ? "0" : `${Number(value) / 1000}K`)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.month ?? ""}
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
