import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOUVERNORATS, SPECIALITES, VILLES } from "@/lib/dalili-data";

export type Filters = { gouvernorat: string; ville: string; speciality: string };

export function SearchEngine({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const villes = filters.gouvernorat === "all" ? [] : (VILLES[filters.gouvernorat] ?? []);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy">
            Gouvernorat
          </span>
          <Select
            value={filters.gouvernorat}
            onValueChange={(v) => onChange({ ...filters, gouvernorat: v, ville: "all" })}
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Choisir un gouvernorat" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Tous les gouvernorats</SelectItem>
              {GOUVERNORATS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy">
            Ville / Localité
          </span>
          <Select
            value={filters.ville}
            onValueChange={(v) => onChange({ ...filters, ville: v })}
            disabled={filters.gouvernorat === "all"}
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Toutes les villes</SelectItem>
              {villes.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy">
            Spécialité
          </span>
          <Select
            value={filters.speciality}
            onValueChange={(v) => onChange({ ...filters, speciality: v })}
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Toutes les spécialités" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Toutes les spécialités</SelectItem>
              {SPECIALITES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Recherche disponible sur les 24 gouvernorats tunisiens.
        </p>
        <Button className="rounded-full">
          <Search className="size-4" /> Rechercher
        </Button>
      </div>
    </div>
  );
}