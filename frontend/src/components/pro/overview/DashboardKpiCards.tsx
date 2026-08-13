import { Database, MapPinned, Phone, Users } from "lucide-react";

import { formatNumber, formatPct, type OverviewData } from "@/lib/overview-data";

export function DashboardKpiCards({ kpis }: { kpis: OverviewData["kpis"] }) {
  const cards = [
    {
      icon: Users,
      label: "Dentistes uniques",
      value: formatNumber(kpis.dentists),
      hint: "Fiches consolidées",
      accent: "bg-brandblue/12 text-brandblue",
    },
    {
      icon: Database,
      label: "Lignes sources",
      value: formatNumber(kpis.rows),
      hint: "Avant déduplication",
      accent: "bg-navy/10 text-navy",
    },
    {
      icon: Phone,
      label: "Avec téléphone",
      value: formatNumber(kpis.withPhone),
      hint: formatPct(kpis.withPhonePct),
      accent: "bg-turquoise/12 text-turquoise",
    },
    {
      icon: MapPinned,
      label: "Gouvernorats couverts",
      value: kpis.governorates,
      hint: formatPct(kpis.governoratesPct),
      accent: "bg-turquoise/12 text-turquoise",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-turquoise/35 hover:shadow-[var(--shadow-lift)]"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-turquoise/70" aria-hidden="true" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${c.accent}`}>
              <c.icon className="size-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-navy">{c.value}</p>
          <p className="mt-1 text-xs font-semibold text-turquoise">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
