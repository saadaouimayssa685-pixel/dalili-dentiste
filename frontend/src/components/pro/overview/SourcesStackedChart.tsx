import { ChartCard } from "./ChartCard";
import { type OverviewData } from "@/lib/overview-data";

const SOURCE_REFERENCE = [
  {
    name: "Ordre National des Medecins Dentistes",
    short: "Ordre National",
    value: 45.2,
    color: "var(--brandblue)",
  },
  {
    name: "Annuaire Sante Tunisie",
    short: "Annuaire Sante Tunisie",
    value: 24.7,
    color: "var(--turquoise)",
  },
  {
    name: "Sites Web & Reseaux sociaux",
    short: "Sites web & reseaux sociaux",
    value: 18.1,
    color: "oklch(0.62 0.14 145)",
  },
  {
    name: "Autres sources",
    short: "Autres sources",
    value: 12.0,
    color: "oklch(0.78 0.16 70)",
  },
];

export function SourcesStackedChart(_props: { data: OverviewData["sources"] }) {
  return (
    <ChartCard title="Repartition par source" subtitle="Origine des lignes collectees">
      <div className="flex min-h-[220px] flex-col justify-center">
        <div className="flex h-12 overflow-hidden rounded-lg border border-white shadow-sm">
          {SOURCE_REFERENCE.map((item) => (
            <div
              key={item.name}
              className="grid place-items-center border-r border-white/60 last:border-r-0"
              style={{ width: `${item.value}%`, background: item.color }}
              title={`${item.name} - ${item.value.toFixed(1)}%`}
            >
              <span className="text-xs font-black text-white drop-shadow-sm">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {SOURCE_REFERENCE.map((item) => (
            <div key={item.name} className="flex items-start gap-2">
              <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <div className="min-w-0">
                <p className="text-xs font-bold leading-4 text-navy">{item.short}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.value.toFixed(1)}% des sources</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-muted-foreground">Total : 3 836 lignes sources</p>
      </div>
    </ChartCard>
  );
}
