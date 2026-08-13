import { Database, MapPin, Phone, Users } from "lucide-react";

import type { PublicStats as Stats } from "@/lib/dalili-api";

function formatNumber(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function PublicStats({ stats, loading }: { stats: Stats | undefined; loading: boolean }) {
  const items = [
    {
      icon: Users,
      value: formatNumber(stats?.dentists ?? null),
      label: "Dentistes référencés",
      hint: "Base Dalili consolidée",
    },
    {
      icon: Phone,
      value: formatNumber(stats?.withPhone ?? null),
      label: "Avec téléphone",
      hint: "Contact direct possible",
    },
    {
      icon: MapPin,
      value:
        stats?.governoratesCovered != null
          ? `${stats.governoratesCovered} / ${stats.governoratesTotal}`
          : null,
      label: "Gouvernorats couverts",
      hint: "Couverture nationale",
    },
    {
      icon: Database,
      value: "Sources multiples",
      label: "Données consolidées",
      hint: "Informations regroupées",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-turquoise/35 hover:shadow-[var(--shadow-lift)]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft-2 text-turquoise transition-colors group-hover:bg-turquoise group-hover:text-white">
            <s.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {loading && s.value === null ? (
              <span className="block h-6 w-20 animate-pulse rounded bg-soft-2" />
            ) : (
              <p className="truncate text-lg font-extrabold text-primary">{s.value ?? "—"}</p>
            )}
            <p className="truncate text-xs font-semibold text-navy">{s.label}</p>
            <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
