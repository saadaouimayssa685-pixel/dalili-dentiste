import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOUVERNORATS } from "@/lib/dalili-data";
import {
  OVERVIEW_DEFAULT_FILTERS,
  OVERVIEW_SOURCES,
  OVERVIEW_SPECIALITIES,
  type OverviewFilters,
} from "@/lib/overview-data";

export function DashboardFilters({
  filters,
  onChange,
}: {
  filters: OverviewFilters;
  onChange: (f: OverviewFilters) => void;
}) {
  const set = (patch: Partial<OverviewFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <SlidersHorizontal className="size-4 text-turquoise" /> Filtres
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy">Gouvernorat</Label>
          <Select value={filters.gouvernorat} onValueChange={(v) => set({ gouvernorat: v })}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les gouvernorats</SelectItem>
              {GOUVERNORATS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy">Spécialité</Label>
          <Select value={filters.speciality} onValueChange={(v) => set({ speciality: v })}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les spécialités</SelectItem>
              {OVERVIEW_SPECIALITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy">Source</Label>
          <Select value={filters.source} onValueChange={(v) => set({ source: v })}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              {OVERVIEW_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy">Période</Label>
          <div className="grid gap-2">
            <Input
              type="date"
              aria-label="Date de début"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="rounded-xl"
            />
            <Input
              type="date"
              aria-label="Date de fin"
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => onChange(OVERVIEW_DEFAULT_FILTERS)}
        className="mt-4 w-full rounded-xl border-turquoise/40 text-navy hover:bg-soft"
      >
        <RotateCcw className="size-4 text-turquoise" /> Réinitialiser les filtres
      </Button>
    </div>
  );
}