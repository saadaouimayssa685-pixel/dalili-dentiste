import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

export function TopGovernoratesChart({ data }: { data: OverviewData["topGovernorates"] }) {
  const max = Math.max(...data.map((d) => d.dentists));
  const total = data.reduce((sum, d) => sum + d.dentists, 0);
  return (
    <ChartCard title="Top gouvernorats" subtitle="Dentistes référencés par gouvernorat">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            barCategoryGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={84}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--navy)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--soft)" }}
              formatter={(v: number) => [
                `${formatNumber(v)} (${Math.round((v / total) * 100)} % du top)`,
                "Dentistes",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="dentists" radius={[0, 8, 8, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill="var(--brandblue)"
                  fillOpacity={0.35 + 0.65 * (d.dentists / max)}
                />
              ))}
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
