import { CheckCircle2, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardKpiCards } from "./DashboardKpiCards";
import { DataQualityPanel } from "./DataQualityPanel";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { SourcesStackedChart } from "./SourcesStackedChart";
import { SpecialityDonutChart } from "./SpecialityDonutChart";
import { TopGovernoratesChart } from "./TopGovernoratesChart";
import { TopLocalitiesTable } from "./TopLocalitiesTable";
import { TunisiaCoverageMap } from "./TunisiaCoverageMap";
import { Button } from "@/components/ui/button";
import { fetchOverview } from "@/lib/dalili-api";
import { formatNumber, OVERVIEW_DEFAULT_FILTERS } from "@/lib/overview-data";

function formatFreshness(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OverviewDashboard() {
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchOverview({
      gouvernorat: OVERVIEW_DEFAULT_FILTERS.gouvernorat,
      speciality: OVERVIEW_DEFAULT_FILTERS.speciality,
      source: OVERVIEW_DEFAULT_FILTERS.source,
    })
      .then((result) => active && setData(result))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Backend indisponible.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshedAt]);

  const freshness = formatFreshness(refreshedAt ?? data?.updatedAt);
  const heroFacts = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Base SQL", value: "Synchronisee", icon: Database },
      { label: "Qualite globale", value: `${data.quality.at(-1)?.value ?? 0} %`, icon: ShieldCheck },
      { label: "Volume exploitable", value: formatNumber(data.kpis.dentists), icon: CheckCircle2 },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_52%,#e9f8f8_100%)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        <span className="absolute -right-16 -top-20 size-56 rounded-full bg-turquoise/12" aria-hidden="true" />
        <span className="absolute right-28 top-8 size-20 rounded-full bg-primary/10" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-turquoise/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-turquoise">
              <CheckCircle2 className="size-3.5" aria-hidden="true" /> Donnees consolidees
            </span>
            <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-navy sm:text-3xl">
              Tableau de bord national des dentistes en Tunisie
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Suivi de la couverture, des sources, de la qualite et de la densite des cabinets
              consolides dans la base Dalili Dentiste.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {heroFacts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-white/80 bg-white/75 px-3 py-2 shadow-sm">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <fact.icon className="size-3.5 text-turquoise" /> {fact.label}
                </p>
                <p className="mt-0.5 text-sm font-black text-navy">{fact.value}</p>
              </div>
            ))}
            <Button
              size="icon"
              variant="outline"
              aria-label="Actualiser les donnees"
              className="size-10 shrink-0 rounded-full border-turquoise/30 bg-white/80"
              onClick={() => setRefreshedAt(new Date().toISOString())}
            >
              <RefreshCw className="size-4 text-turquoise" />
            </Button>
          </div>
        </div>
        <p className="relative mt-5 text-xs font-semibold text-muted-foreground">
          Derniere mise a jour : {freshness}
        </p>
      </header>

      <div className="min-w-0 space-y-6">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Synchronisation avec la base SQL en cours...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Impossible de charger les indicateurs backend : {error}
          </div>
        ) : data ? (
          <>
            <DashboardKpiCards kpis={data.kpis} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <MonthlyTrendChart data={data.monthly} />
              <SpecialityDonutChart data={data.specialities} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <TopGovernoratesChart data={data.topGovernorates} />
              <SourcesStackedChart data={data.sources} />
            </div>
            <TunisiaCoverageMap data={data.coverage} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <TopLocalitiesTable data={data.localities} />
              <DataQualityPanel data={data.quality} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
