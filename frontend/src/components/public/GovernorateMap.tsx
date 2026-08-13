import { Map as MapIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchGovernorates, type GovernorateCount } from "@/lib/dalili-api";

const POSITIONS: Record<string, { x: number; y: number }> = {
  Bizerte: { x: 47, y: 7 },
  Tunis: { x: 60, y: 15 },
  Ariana: { x: 57, y: 12 },
  "Ben Arous": { x: 61, y: 19 },
  "La Manouba": { x: 52, y: 17 },
  Nabeul: { x: 75, y: 20 },
  Zaghouan: { x: 57, y: 25 },
  Beja: { x: 38, y: 18 },
  "Béja": { x: 38, y: 18 },
  Jendouba: { x: 27, y: 22 },
  "Le Kef": { x: 30, y: 33 },
  Siliana: { x: 43, y: 34 },
  Sousse: { x: 62, y: 38 },
  Monastir: { x: 68, y: 42 },
  Mahdia: { x: 70, y: 49 },
  Kairouan: { x: 52, y: 45 },
  Kasserine: { x: 33, y: 52 },
  "Sidi Bouzid": { x: 46, y: 58 },
  Sfax: { x: 62, y: 63 },
  Gafsa: { x: 35, y: 70 },
  Tozeur: { x: 24, y: 76 },
  Kebili: { x: 42, y: 82 },
  "Kébili": { x: 42, y: 82 },
  Gabes: { x: 57, y: 77 },
  "Gabès": { x: 57, y: 77 },
  Medenine: { x: 66, y: 88 },
  "Médenine": { x: 66, y: 88 },
  Tataouine: { x: 56, y: 96 },
};

export function GovernorateMap({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (gouvernorat: string) => void;
}) {
  const [items, setItems] = useState<GovernorateCount[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchGovernorates()
      .then((g) => active && setItems(g.sort((a, b) => b.count - a.count)))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  const max = items?.reduce((m, g) => Math.max(m, g.count), 0) ?? 0;
  const top = useMemo(() => (items ?? []).slice(0, 5), [items]);

  return (
    <section
      aria-labelledby="map-title"
      className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MapIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 id="map-title" className="text-lg font-bold text-navy">
            Carte dynamique Tunisie
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Points proportionnels au nombre de dentistes. Cliquez pour filtrer.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl bg-soft/70 p-4 text-sm text-muted-foreground">
          La repartition geographique est temporairement indisponible.
        </p>
      ) : items === null ? (
        <div className="mt-5 h-72 animate-pulse rounded-[2rem] bg-soft-2" aria-hidden="true" />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_150px]">
          <div className="relative h-80 overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_70%_20%,rgba(8,151,157,0.18),transparent_30%),linear-gradient(135deg,#f8fcff,#e9f7fb)]">
            <div
              className="absolute left-[18%] top-[4%] h-[92%] w-[66%] rounded-[48%_52%_60%_40%/18%_20%_80%_82%] border border-turquoise/25 bg-white/80 shadow-inner"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,69,0.04)_1px,transparent_1px),linear-gradient(rgba(7,26,69,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
            {items.map((g) => {
              const pos = POSITIONS[g.name] ?? { x: 50, y: 50 };
              const ratio = max ? g.count / max : 0;
              const size = 10 + ratio * 22;
              const active = selected === g.name;
              return (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => onSelect(active ? "all" : g.name)}
                  aria-label={`${g.name}: ${g.count} dentistes`}
                  aria-pressed={active}
                  className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-lg transition-transform hover:scale-125 ${
                    active
                      ? "border-primary bg-primary text-white ring-4 ring-primary/20"
                      : "border-white bg-turquoise text-white"
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size }}
                  title={`${g.name} - ${g.count} dentistes`}
                >
                  <span className="sr-only">{g.name}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-soft/70 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Top zones
            </p>
            <div className="mt-3 space-y-2">
              {top.map((g, index) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => onSelect(g.name)}
                  className="w-full rounded-xl bg-white/80 p-2 text-left transition hover:bg-white"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="block truncate text-xs font-bold text-navy">{g.name}</span>
                  <span className="text-xs text-turquoise">{g.count} dentistes</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
