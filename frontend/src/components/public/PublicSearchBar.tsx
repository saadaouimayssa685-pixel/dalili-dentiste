import { Loader2, MapPin, Phone, Search, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  onSubmit: () => void;
  gouvernorats: string[];
  localites: string[];
  specialites: string[];
  loading: boolean;
};

export function PublicSearchBar({
  draft,
  onChange,
  onSubmit,
  gouvernorats,
  localites,
  specialites,
  loading,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4"
      role="search"
      aria-label="Recherche de dentistes"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="public-search" className="sr-only">
            Nom du dentiste, spécialité, localité
          </label>
          <Input
            id="public-search"
            value={draft.q}
            onChange={(e) => onChange({ ...draft, q: e.target.value })}
            placeholder="Nom du dentiste, spécialité, localité…"
            className="h-12 rounded-2xl pl-11"
          />
        </div>
        <Button type="submit" className="h-12 rounded-2xl px-7" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          Rechercher
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="min-w-0">
          <span className="sr-only">Spécialité</span>
          <Select
            value={draft.speciality}
            onValueChange={(v) => onChange({ ...draft, speciality: v })}
          >
            <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Spécialité">
              <Stethoscope className="size-4 text-primary" aria-hidden="true" />
              <SelectValue placeholder="Spécialité" />
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

        <label className="min-w-0">
          <span className="sr-only">Gouvernorat</span>
          <Select
            value={draft.gouvernorat}
            onValueChange={(v) => onChange({ ...draft, gouvernorat: v, localite: "all" })}
          >
            <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Gouvernorat">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              <SelectValue placeholder="Gouvernorat" />
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

        <label className="min-w-0">
          <span className="sr-only">Localité</span>
          <Select
            value={draft.localite}
            onValueChange={(v) => onChange({ ...draft, localite: v })}
            disabled={draft.gouvernorat === "all" || localites.length === 0}
          >
            <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Localité">
              <MapPin className="size-4 text-turquoise" aria-hidden="true" />
              <SelectValue placeholder="Localité" />
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

        <button
          type="button"
          onClick={() => onChange({ ...draft, withPhone: !draft.withPhone })}
          aria-pressed={draft.withPhone}
          className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
            draft.withPhone
              ? "border-turquoise bg-turquoise text-turquoise-foreground"
              : "border-input bg-background text-muted-foreground hover:border-turquoise/50 hover:text-navy"
          }`}
        >
          <Phone className="size-4" aria-hidden="true" /> Avec téléphone
        </button>
      </div>
    </form>
  );
}