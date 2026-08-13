import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DentistProfileDialog } from "@/components/public/DentistProfileDialog";
import { DentistResults } from "@/components/public/DentistResults";
import { Pagination } from "@/components/public/Pagination";
import { PublicFilters } from "@/components/public/PublicFilters";
import { PublicHero } from "@/components/public/PublicHero";
import { PublicQuickSearches, type QuickSearch } from "@/components/public/PublicQuickSearches";
import { PublicSearchBar } from "@/components/public/PublicSearchBar";
import { PublicStats } from "@/components/public/PublicStats";
import { Button } from "@/components/ui/button";
import {
  onApplyAssistantFilters,
  onOpenAssistantDentist,
  setAssistantOpen,
  type AssistantFilters,
} from "@/lib/assistant-store";
import {
  fetchDentists,
  fetchFilters,
  fetchStats,
  type ApiDentist,
  type FiltersResponse,
  type PublicStats as Stats,
} from "@/lib/dalili-api";
import { EMPTY_FILTERS, PAGE_SIZE, type PublicFilterState } from "@/lib/public-search";

export const Route = createFileRoute("/public/")({
  head: () => ({
    meta: [
      { title: "Espace grand public — Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Recherchez un dentiste par gouvernorat, ville et spécialité parmi les cabinets vérifiés de Tunisie.",
      },
      { property: "og:title", content: "Espace grand public — Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Moteur de recherche dentaire couvrant les 24 gouvernorats tunisiens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicPage,
});

function PublicPage() {
  const [draft, setDraft] = useState<PublicFilterState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<PublicFilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [openFilters, setOpenFilters] = useState(false);

  const [meta, setMeta] = useState<FiltersResponse | null>(null);
  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [statsLoading, setStatsLoading] = useState(true);

  const [items, setItems] = useState<ApiDentist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [profile, setProfile] = useState<ApiDentist | null>(null);

  useEffect(() => {
    let active = true;
    fetchFilters()
      .then((f) => active && setMeta(f))
      .catch(() => active && setMeta({ gouvernorats: [], localites: {}, specialites: [], sources: [] }));
    fetchStats()
      .then((s) => active && setStats(s))
      .catch(() => undefined)
      .finally(() => active && setStatsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchDentists({
      ...(applied.q ? { q: applied.q } : {}),
      ...(applied.gouvernorat !== "all" ? { gouvernorat: applied.gouvernorat } : {}),
      ...(applied.localite !== "all" ? { localite: applied.localite } : {}),
      ...(applied.speciality !== "all" ? { speciality: applied.speciality } : {}),
      ...(applied.source !== "all" ? { source: applied.source } : {}),
      ...(applied.name ? { name: applied.name } : {}),
      withPhone: applied.withPhone,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [applied, page, reloadKey]);

  const search = useCallback((next: PublicFilterState) => {
    setDraft(next);
    setApplied(next);
    setPage(1);
    setOpenFilters(false);
  }, []);

  useEffect(() => {
    const off = onApplyAssistantFilters((f: AssistantFilters) => {
        setDraft((prev) => {
          const next: PublicFilterState = {
            ...prev,
            ...(f.speciality ? { speciality: f.speciality } : {}),
            ...(f.gouvernorat ? { gouvernorat: f.gouvernorat } : {}),
            ...(f.localite ? { localite: f.localite } : {}),
          };
          setApplied(next);
          return next;
        });
      setPage(1);
      if (typeof document !== "undefined") {
        document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth" });
      }
    });
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    const off = onOpenAssistantDentist((d: ApiDentist) => setProfile(d));
    return () => {
      off();
    };
  }, []);

  const localites =
    draft.gouvernorat === "all" ? [] : (meta?.localites[draft.gouvernorat] ?? []);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const scope =
    applied.localite !== "all"
      ? applied.localite
      : applied.gouvernorat !== "all"
        ? applied.gouvernorat
        : applied.q.trim() || "toute la Tunisie";

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-gradient-to-b from-soft to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/" className="hover:text-primary">
              Accueil
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-navy">Espace grand public</span>
          </nav>

          <div className="mt-4">
            <PublicHero />
          </div>

          <div className="mx-auto mt-6 max-w-4xl">
            <PublicSearchBar
              draft={draft}
              onChange={setDraft}
              onSubmit={() => search(draft)}
              gouvernorats={meta?.gouvernorats ?? []}
              localites={localites}
              specialites={meta?.specialites ?? []}
              loading={loading}
            />
            <PublicQuickSearches
              onPick={(q: QuickSearch) => search({ ...EMPTY_FILTERS, ...draft, ...q.patch })}
            />
          </div>

          <div className="mt-8">
            <PublicStats stats={stats} loading={statsLoading} />
          </div>
        </div>
      </section>

      <section id="resultats" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Button
              variant="outline"
              className="w-full rounded-xl lg:hidden"
              onClick={() => setOpenFilters((v) => !v)}
              aria-expanded={openFilters}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {openFilters ? "Masquer les filtres" : "Afficher les filtres"}
            </Button>
            <div
              className={`mt-3 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:mt-0 lg:block ${openFilters ? "block" : "hidden"}`}
            >
              <PublicFilters
                draft={draft}
                onChange={setDraft}
                onApply={() => search(draft)}
                onReset={() => search(EMPTY_FILTERS)}
                gouvernorats={meta?.gouvernorats ?? []}
                localites={localites}
                specialites={meta?.specialites ?? []}
                sources={meta?.sources ?? []}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 min-w-0">
              <h2 className="truncate text-2xl font-extrabold text-navy">
                Résultats pour <span className="text-turquoise">{scope}</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Recherche en cours…"
                  : `${new Intl.NumberFormat("fr-FR").format(total)} dentiste${total > 1 ? "s" : ""} · page ${page} / ${totalPages}`}
              </p>
            </div>

            <DentistResults
              items={items}
              loading={loading}
              error={error}
              onRetry={() => setReloadKey((k) => k + 1)}
              onReset={() => search(EMPTY_FILTERS)}
              onAskAssistant={() => setAssistantOpen(true)}
              onOpen={setProfile}
            />

            {!loading && !error ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => {
                  setPage(p);
                  if (typeof document !== "undefined") {
                    document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      </section>

      <DentistProfileDialog dentist={profile} onOpenChange={(o) => !o && setProfile(null)} />
    </div>
  );
}
