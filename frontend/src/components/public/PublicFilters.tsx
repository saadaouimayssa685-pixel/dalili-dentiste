import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicFilterState } from "@/lib/public-search";

type Props = {
  draft: PublicFilterState;
  onChange: (next: PublicFilterState) => void;
  onApply: () => void;
  onReset: () => void;
  gouvernorats: string[];
  localites: string[];
  specialites: string[];
  sources: string[];
};

export function PublicFilters({
  draft,
  onChange,
  onApply,
  onReset,
  gouvernorats,
  localites,
  specialites,
  sources,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-navy">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" /> Filtres
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Réinitialiser
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-navy">Gouvernorat</span>
        <Select
          value={draft.gouvernorat}
          onValueChange={(v) => onChange({ ...draft, gouvernorat: v, localite: "all" })}
        >
          <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Gouvernorat">
            <SelectValue placeholder="Tous les gouvernorats" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Tous les gouvernorats</SelectItem>
            {gouvernorats.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-navy">Localité</span>
        <Select
          value={draft.localite}
          onValueChange={(v) => onChange({ ...draft, localite: v })}
          disabled={draft.gouvernorat === "all" || localites.length === 0}
        >
          <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Localité">
            <SelectValue placeholder="Toutes les localités" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Toutes les localités</SelectItem>
            {localites.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-navy">Spécialité</span>
        <Select
          value={draft.speciality}
          onValueChange={(v) => onChange({ ...draft, speciality: v })}
        >
          <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Spécialité">
            <SelectValue placeholder="Toutes les spécialités" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Toutes les spécialités</SelectItem>
            {specialites.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-navy">Source</span>
        <Select value={draft.source} onValueChange={(v) => onChange({ ...draft, source: v })}>
          <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Source">
            <SelectValue placeholder="Toutes les sources" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Toutes les sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-navy">Nom du dentiste</span>
        <Input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Ex. : Ben Salah"
          className="h-11 rounded-xl"
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
        <Checkbox
          checked={draft.withPhone}
          onCheckedChange={(c) => onChange({ ...draft, withPhone: c === true })}
          aria-label="Téléphone disponible"
        />
        Téléphone disponible
      </label>

      <Button className="w-full rounded-xl" onClick={onApply}>
        Appliquer les filtres
      </Button>
    </div>
  );
}