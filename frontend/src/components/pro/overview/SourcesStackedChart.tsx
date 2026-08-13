import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

export function SourcesStackedChart({ data }: { data: OverviewData["sources"] }) {
  const sourceTotals = data
    .map((source) => ({
      ...source,
      total: source.phone + source.noPhone,
      duplicateRows: source.duplicates,
    }))
    .slice(0, 7);

  return (
    <ChartCard title="Repartition par source" subtitle="Lignes exploitables par site source">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sourceTotals}
            layout="vertical"
            margin={{ top: 6, right: 42, left: 18, bottom: 0 }}
            barCategoryGap={10}
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
              width={118}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--navy)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--soft)" }}
              formatter={(v: number, name: string, item) => {
                const total = Number(item?.payload?.total ?? 0);
                const percentage = total ? Math.round((v / total) * 100) : 0;
                return [`${formatNumber(v)} (${percentage} %)`, name];
              }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="phone" name="Avec telephone" stackId="source" fill="var(--turquoise)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="noPhone" name="Sans telephone" stackId="source" fill="var(--brandblue)" radius={[0, 8, 8, 0]}>
              <LabelList
                dataKey="total"
                position="right"
                formatter={(value: number) => formatNumber(value)}
                className="fill-navy text-xs font-black"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {sourceTotals.slice(0, 3).map((source) => (
          <div key={source.name} className="rounded-2xl bg-soft/60 p-3">
            <p className="truncate text-xs font-bold text-muted-foreground">{source.name}</p>
            <p className="mt-1 text-lg font-black text-navy">{formatNumber(source.total)}</p>
            <p className="text-[11px] font-semibold text-turquoise">
              {formatNumber(source.duplicateRows)} doublons inter-sources
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
