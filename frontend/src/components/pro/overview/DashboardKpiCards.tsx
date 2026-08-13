import { Database, MapPinned, Phone, Users } from "lucide-react";

import { formatNumber, formatPct, type OverviewData } from "@/lib/overview-data";

export function DashboardKpiCards({ kpis }: { kpis: OverviewData["kpis"] }) {
  const cards = [
    {
      icon: Users,
      label: "Dentistes uniques",
      value: formatNumber(kpis.dentists),
      hint: "Fiches consolidees",
      accent: "from-brandblue/18 to-brandblue/5 text-brandblue",
      tone: "text-brandblue",
    },
    {
      icon: Database,
      label: "Lignes sources",
      value: formatNumber(kpis.rows),
      hint: "Avant deduplication",
      accent: "from-navy/12 to-navy/5 text-navy",
      tone: "text-navy",
    },
    {
      icon: Phone,
      label: "Avec telephone",
      value: formatNumber(kpis.withPhone),
      hint: formatPct(kpis.withPhonePct),
      accent: "from-turquoise/18 to-turquoise/5 text-turquoise",
      tone: "text-emerald-600",
    },
    {
      icon: MapPinned,
      label: "Gouvernorats couverts",
      value: kpis.governorates,
      hint: formatPct(kpis.governoratesPct),
      accent: "from-primary/14 to-turquoise/5 text-primary",
      tone: "text-primary",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative overflow-hidden rounded-[1.4rem] border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-turquoise/35 hover:shadow-[var(--shadow-lift)]"
        >
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-soft-2/70" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105 ${c.accent}`}
            >
              <c.icon className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-navy">{c.label}</p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${c.tone}`}>{c.value}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{c.hint}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
