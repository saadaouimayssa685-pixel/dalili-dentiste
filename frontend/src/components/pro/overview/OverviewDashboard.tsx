import { CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

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
import { OVERVIEW_DEFAULT_FILTERS } from "@/lib/overview-data";

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

  return (
    <div className="space-y-6">
      <header className="relative flex flex-wrap items-start justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-turquoise via-primary to-turquoise/20" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
            Dashboard statistique - Dalili Dentiste Tounsi
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Analyse des dentistes en Tunisie</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-turquoise/10 px-2.5 py-1 text-[11px] font-bold text-turquoise">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Base SQL synchronisee
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Derniere mise a jour : {refreshedAt ?? data?.updatedAt ?? "-"}
          </p>
          <Button
            size="icon"
            variant="outline"
            aria-label="Actualiser les donnees"
            className="size-9 shrink-0 rounded-full"
            onClick={() => setRefreshedAt(new Date().toLocaleString("fr-FR"))}
          >
            <RefreshCw className="size-4 text-turquoise" />
          </Button>
        </div>
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
              <div className="grid gap-6 lg:grid-cols-2">
                <MonthlyTrendChart data={data.monthly} />
                <SpecialityDonutChart data={data.specialities} />
              </div>
              <TopGovernoratesChart data={data.topGovernorates} />
              <div className="grid gap-6 lg:grid-cols-2">
                <SourcesStackedChart data={data.sources} />
                <TunisiaCoverageMap data={data.coverage} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <TopLocalitiesTable data={data.localities} />
                <DataQualityPanel data={data.quality} />
              </div>
            </>
          ) : null}
      </div>
    </div>
  );
}
