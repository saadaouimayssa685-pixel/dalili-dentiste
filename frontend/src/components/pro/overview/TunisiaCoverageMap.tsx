import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const POSITIONS: Record<string, { x: number; y: number }> = {
  Bizerte: { x: 47, y: 7 },
  Tunis: { x: 60, y: 15 },
  Ariana: { x: 57, y: 12 },
  "Ben Arous": { x: 61, y: 19 },
  "La Manouba": { x: 52, y: 17 },
  Nabeul: { x: 75, y: 20 },
  Zaghouan: { x: 57, y: 25 },
  "Béja": { x: 38, y: 18 },
  Beja: { x: 38, y: 18 },
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
  "Kébili": { x: 42, y: 82 },
  Kebili: { x: 42, y: 82 },
  "Gabès": { x: 57, y: 77 },
  Gabes: { x: 57, y: 77 },
  "Médenine": { x: 66, y: 88 },
  Medenine: { x: 66, y: 88 },
  Tataouine: { x: 56, y: 96 },
};

export function TunisiaCoverageMap({ data }: { data: OverviewData["coverage"] }) {
  const max = Math.max(...data.map((d) => d.dentists), 1);
  const covered = data.filter((d) => d.dentists > 0).length;
  const top = [...data].sort((a, b) => b.dentists - a.dentists).slice(0, 6);

  return (
    <ChartCard
      title="Cartographie nationale"
      subtitle={`Couverture : ${covered}/24 gouvernorats (${Math.round((covered / 24) * 100)} %)`}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_190px]">
        <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-border bg-[radial-gradient(circle_at_72%_18%,rgba(18,103,216,0.12),transparent_30%),linear-gradient(135deg,#f8fcff,#e9f7fb)]">
          <div
            className="absolute left-[18%] top-[4%] h-[92%] w-[66%] rounded-[48%_52%_60%_40%/18%_20%_80%_82%] border border-turquoise/25 bg-white/80 shadow-inner"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,69,0.04)_1px,transparent_1px),linear-gradient(rgba(7,26,69,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
          {data.map((g) => {
            const pos = POSITIONS[g.name] ?? { x: 50, y: 50 };
            const ratio = g.dentists / max;
            const size = 10 + ratio * 28;
            return (
              <div
                key={g.name}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={`${g.name} - ${formatNumber(g.dentists)} dentistes`}
              >
                <span
                  className="block rounded-full border-2 border-white bg-turquoise shadow-lg ring-4 ring-turquoise/10 transition group-hover:scale-125 group-hover:bg-primary"
                  style={{ width: size, height: size }}
                />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-2 py-1 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                  {g.name} · {formatNumber(g.dentists)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-soft/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Gouvernorats leaders
          </p>
          <div className="mt-3 space-y-3">
            {top.map((g) => {
              const width = `${Math.max(8, (g.dentists / max) * 100)}%`;
              return (
                <div key={g.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-navy">{g.name}</span>
                    <span className="font-bold text-turquoise">{formatNumber(g.dentists)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-turquoise to-primary" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-white/80 p-3 text-xs text-muted-foreground">
            Les points representent les cabinets consolides par gouvernorat. Plus le point est grand,
            plus la zone est dense.
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
