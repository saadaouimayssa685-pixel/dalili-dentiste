import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

export function SourcesStackedChart({ data }: { data: OverviewData["sources"] }) {
  const sourceTotals = data.map((source) => ({
    ...source,
    total: source.phone + source.noPhone + source.duplicates,
  }));

  return (
    <ChartCard title="Répartition par source" subtitle="Lignes collectées par site source">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sourceTotals} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={48}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--soft)" }}
              formatter={(v: number, name: string, item) => {
                const total = Number(item?.payload?.total ?? 0);
                const percentage = total ? Math.round((v / total) * 100) : 0;
                return [`${formatNumber(v)} (${percentage} % de la source)`, name];
              }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--navy)" }} />
            <Bar dataKey="phone" name="Avec téléphone" stackId="s" fill="var(--turquoise)" />
            <Bar dataKey="noPhone" name="Sans téléphone" stackId="s" fill="var(--brandblue)" />
            <Bar
              dataKey="duplicates"
              name="Doublons"
              stackId="s"
              fill="var(--navy)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
