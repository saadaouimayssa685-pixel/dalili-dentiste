import type { PublicFilterState } from "@/lib/public-search";

export type QuickSearch = { label: string; patch: Partial<PublicFilterState> };

export const QUICK_SEARCHES: QuickSearch[] = [
  { label: "Dentiste à Tunis", patch: { gouvernorat: "Tunis", q: "" } },
  { label: "Orthodontiste à Sousse", patch: { gouvernorat: "Sousse", speciality: "Orthodontie" } },
  { label: "Dentiste à Sfax", patch: { gouvernorat: "Sfax", q: "" } },
  { label: "Dentiste pour enfant", patch: { speciality: "Pédodontie" } },
  { label: "Implantologie", patch: { speciality: "Implantologie" } },
  { label: "Parodontologie", patch: { speciality: "Parodontologie" } },
];

export function PublicQuickSearches({ onPick }: { onPick: (q: QuickSearch) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Recherches rapides :</span>
      {QUICK_SEARCHES.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}