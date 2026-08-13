import { AlertTriangle, Bot, RotateCcw, SearchX } from "lucide-react";

import { DentistCard } from "@/components/public/DentistCard";
import { Button } from "@/components/ui/button";
import type { ApiDentist } from "@/lib/dalili-api";

type Props = {
  items: ApiDentist[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
  onAskAssistant: () => void;
  onOpen: (d: ApiDentist) => void;
};

function Skeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex gap-4">
        <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-soft-2" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-2/5 animate-pulse rounded bg-soft-2" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-soft" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-soft" />
          <div className="h-8 w-40 animate-pulse rounded-full bg-soft" />
        </div>
      </div>
    </div>
  );
}

export function DentistResults({
  items,
  loading,
  error,
  onRetry,
  onReset,
  onAskAssistant,
  onOpen,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-soft/60 p-10 text-center">
        <AlertTriangle className="mx-auto size-8 text-turquoise" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-navy">
          Certaines données sont temporairement indisponibles.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" /> Réessayer
        </Button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-soft/60 p-10 text-center">
        <SearchX className="mx-auto size-8 text-turquoise" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-navy">
          Aucun dentiste ne correspond à cette recherche.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onReset}>
            <RotateCcw className="size-4" aria-hidden="true" /> Réinitialiser les filtres
          </Button>
          <Button className="rounded-xl" onClick={onAskAssistant}>
            <Bot className="size-4" aria-hidden="true" /> Demander à Assistant Dalili
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((d) => (
        <DentistCard key={d.id} dentist={d} onOpen={onOpen} />
      ))}
    </div>
  );
}