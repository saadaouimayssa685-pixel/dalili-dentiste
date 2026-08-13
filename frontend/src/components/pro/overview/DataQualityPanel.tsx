import { ChartCard } from "./ChartCard";
import { formatPct, type OverviewData } from "@/lib/overview-data";

export function DataQualityPanel({ data }: { data: OverviewData["quality"] }) {
  return (
    <ChartCard title="Qualité des données" subtitle="Indicateurs de complétude et de fiabilité">
      <ul className="space-y-4">
        {data.map((q) => (
          <li key={q.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-navy">{q.label}</span>
              <span
                className={`text-sm font-bold ${q.tone === "warn" ? "text-destructive" : "text-turquoise"}`}
              >
                {formatPct(q.value)}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-soft-2">
              <div
                className={`h-full rounded-full ${q.tone === "warn" ? "bg-destructive" : "bg-turquoise"}`}
                style={{ width: `${Math.min(100, q.value)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}