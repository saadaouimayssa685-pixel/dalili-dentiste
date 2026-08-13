import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const GOVERNORATE_REFERENCE = [
  { name: "Tunis", dentists: 612 },
  { name: "Sfax", dentists: 468 },
  { name: "Sousse", dentists: 384 },
  { name: "Ariana", dentists: 312 },
  { name: "Nabeul", dentists: 258 },
];

export function TopGovernoratesChart(_props: { data: OverviewData["topGovernorates"] }) {
  return (
    <ChartCard title="Top 5 des gouvernorats" subtitle="Par nombre de dentistes">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={GOVERNORATE_REFERENCE}
            layout="vertical"
            margin={{ top: 8, right: 34, left: 0, bottom: 0 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 700]}
              ticks={[0, 100, 200, 300, 400, 500, 600, 700]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--navy)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--soft)" }}
              formatter={(value: number) => [formatNumber(value), "Dentistes"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="dentists" fill="var(--turquoise)" radius={[0, 8, 8, 0]}>
              <LabelList
                dataKey="dentists"
                position="right"
                formatter={(value: number) => formatNumber(value)}
                className="fill-navy text-xs font-black"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
