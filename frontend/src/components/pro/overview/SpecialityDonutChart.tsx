import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const COLORS = [
  "var(--brandblue)",
  "var(--turquoise)",
  "var(--navy)",
  "oklch(0.7 0.12 235)",
  "oklch(0.78 0.09 199)",
];

export function SpecialityDonutChart({ data }: { data: OverviewData["specialities"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Répartition par spécialité" subtitle={`${formatNumber(total)} fiches`}>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              label={({ value }) => `${Math.round((Number(value) / total) * 100)}%`}
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n) => [
                `${formatNumber(v)} (${Math.round((v / total) * 100)} %)`,
                n as string,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
                const percentage = item ? Math.round((item.value / total) * 100) : 0;
                return `${value} (${percentage}%)`;
              }}
              wrapperStyle={{ fontSize: 12, color: "var(--navy)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
