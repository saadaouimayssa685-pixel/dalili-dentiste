import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { DentistCard } from "@/components/site/DentistCard";
import { SearchEngine, type Filters } from "@/components/site/SearchEngine";
import { DENTISTS } from "@/lib/dalili-data";

export const Route = createFileRoute("/public/recherche")({
  head: () => ({
    meta: [
      { title: "Tous les dentistes — Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Parcourez tous les dentistes référencés en Tunisie et filtrez par gouvernorat, ville et spécialité.",
      },
      { property: "og:title", content: "Tous les dentistes — Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Recherche complète des cabinets dentaires tunisiens vérifiés.",
      },
    ],
  }),
  component: RecherchePage,
});

function RecherchePage() {
  const [filters, setFilters] = useState<Filters>({
    gouvernorat: "all",
    ville: "all",
    speciality: "all",
  });

  const results = useMemo(
    () =>
      DENTISTS.filter(
        (d) =>
          (filters.gouvernorat === "all" || d.gouvernorat === filters.gouvernorat) &&
          (filters.ville === "all" || d.ville === filters.ville) &&
          (filters.speciality === "all" || d.speciality === filters.speciality),
      ),
    [filters],
  );

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-b from-soft to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Tous les dentistes
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Affinez votre recherche parmi les cabinets référencés dans les 24 gouvernorats.
          </p>
          <div className="mt-8">
            <SearchEngine filters={filters} onChange={setFilters} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold text-navy">{results.length} résultat(s)</p>
        {results.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((d) => (
              <DentistCard key={d.id} dentist={d} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-soft/60 p-10 text-center text-sm text-muted-foreground">
            Aucun cabinet ne correspond à ces critères.
          </div>
        )}
      </section>
    </div>
  );
}