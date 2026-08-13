import { CheckCircle2, Database, RefreshCw } from "lucide-react";
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

  return (
    <div className="space-y-3">
      <header className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-navy sm:text-3xl">
            Tableau de bord Dalili Dentiste Tounsi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d'ensemble des donnees collectees, des sources et de la qualite des fiches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-700">
              <CheckCircle2 className="size-4" /> Donnees fraiches
            </p>
            <p className="text-xs font-semibold text-emerald-700/80">{freshness}</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-2">
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <Database className="size-4" /> Synchronise SQL
            </p>
            <p className="text-xs font-semibold text-muted-foreground">Base a jour</p>
          </div>
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
      </header>

      <div className="min-w-0 space-y-3">
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
            <div className="grid gap-3 xl:grid-cols-2">
              <MonthlyTrendChart data={data.monthly} />
              <SpecialityDonutChart data={data.specialities} />
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <TopGovernoratesChart data={data.topGovernorates.slice(0, 5)} />
              <SourcesStackedChart data={data.sources} />
            </div>
            <TunisiaCoverageMap data={data.coverage} />
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
              <TopLocalitiesTable data={data.localities} />
              <DataQualityPanel data={data.quality} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
