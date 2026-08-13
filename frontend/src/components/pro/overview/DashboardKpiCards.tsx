import { ArrowUpRight, Database, MapPinned, Phone, Users } from "lucide-react";

import { formatNumber, formatPct, type OverviewData } from "@/lib/overview-data";

export function DashboardKpiCards({ kpis }: { kpis: OverviewData["kpis"] }) {
  const cards = [
    {
      icon: Users,
      label: "Dentistes uniques",
      value: formatNumber(kpis.dentists),
      hint: "Fiches consolidees",
      accent: "from-brandblue/18 to-brandblue/5 text-brandblue",
      bar: "bg-brandblue",
    },
    {
      icon: Database,
      label: "Lignes sources",
      value: formatNumber(kpis.rows),
      hint: "Avant deduplication",
      accent: "from-navy/12 to-navy/5 text-navy",
      bar: "bg-navy",
    },
    {
      icon: Phone,
      label: "Avec telephone",
      value: formatNumber(kpis.withPhone),
      hint: formatPct(kpis.withPhonePct),
      accent: "from-turquoise/18 to-turquoise/5 text-turquoise",
      bar: "bg-turquoise",
    },
    {
      icon: MapPinned,
      label: "Gouvernorats couverts",
      value: kpis.governorates,
      hint: formatPct(kpis.governoratesPct),
      accent: "from-primary/14 to-turquoise/5 text-primary",
      bar: "bg-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-turquoise/35 hover:shadow-[var(--shadow-lift)]"
        >
          <span className={`absolute inset-x-0 bottom-0 h-1 ${c.bar}`} aria-hidden="true" />
          <span className="absolute -right-8 -top-8 size-28 rounded-full bg-soft-2/70" aria-hidden="true" />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105 ${c.accent}`}
            >
              <c.icon className="size-[18px]" />
            </span>
          </div>
          <p className="relative mt-4 text-3xl font-extrabold tracking-tight text-navy">{c.value}</p>
          <p className="relative mt-2 inline-flex items-center gap-1 text-xs font-bold text-turquoise">
            <ArrowUpRight className="size-3.5" /> {c.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
