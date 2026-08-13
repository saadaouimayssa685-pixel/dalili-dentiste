import { ChevronLeft, ChevronRight } from "lucide-react";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination des résultats"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-input px-3 text-sm font-semibold text-navy transition-colors hover:bg-soft disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Précédent
      </button>

      {pages(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`size-9 rounded-full text-sm font-semibold transition-colors ${
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-input text-navy hover:bg-soft"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-input px-3 text-sm font-semibold text-navy transition-colors hover:bg-soft disabled:opacity-40"
      >
        Suivant <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}