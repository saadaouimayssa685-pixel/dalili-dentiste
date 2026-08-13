import { MapPinned } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const POSITIONS: Record<string, { x: number; y: number }> = {
  Bizerte: { x: 47, y: 7 },
  Tunis: { x: 60, y: 15 },
  Ariana: { x: 57, y: 12 },
  "Ben Arous": { x: 61, y: 19 },
  Manouba: { x: 52, y: 17 },
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

export function TunisiaCoverageMap({ data }: { data: OverviewData["coverage"] }) {
  const max = Math.max(...data.map((d) => d.dentists), 1);
  const covered = Math.min(24, data.filter((d) => d.dentists > 0).length);

  return (
    <ChartCard
      title="Repartition geographique des dentistes par gouvernorat"
      subtitle={`Couverture officielle : ${covered}/24 gouvernorats (${Math.round((covered / 24) * 100)} %)`}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-turquoise/10 px-3 py-1 text-xs font-bold text-turquoise">
          <MapPinned className="size-3.5" /> Points proportionnels
        </span>
      }
    >
      <div className="relative h-[330px] overflow-hidden rounded-[1.7rem] border border-border bg-[radial-gradient(circle_at_78%_18%,rgba(18,103,216,0.14),transparent_28%),linear-gradient(135deg,#fbfdff,#eaf8fb)]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,69,0.035)_1px,transparent_1px),linear-gradient(rgba(7,26,69,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div
            className="absolute left-[23%] top-[7%] h-[86%] w-[50%] rotate-[-8deg] rounded-[40%_60%_54%_46%/18%_20%_80%_82%] border border-turquoise/20 bg-white/78 shadow-[inset_0_0_75px_rgba(20,160,170,0.08)]"
            aria-hidden="true"
          />
          <div className="absolute bottom-5 left-5 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Densite cabinets</p>
            <p className="mt-1 text-2xl font-black text-navy">{formatNumber(data.reduce((s, g) => s + g.dentists, 0))}</p>
          </div>
          {data.map((g) => {
            const pos = POSITIONS[g.name] ?? { x: 50, y: 50 };
            const ratio = g.dentists / max;
            const size = 9 + ratio * 34;
            return (
              <button
                key={g.name}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={`${g.name} - ${formatNumber(g.dentists)} dentistes`}
                type="button"
              >
                <span
                  className="block rounded-full border-[3px] border-white bg-turquoise shadow-lg ring-4 ring-turquoise/12 transition duration-200 group-hover:scale-125 group-hover:bg-primary group-hover:ring-primary/20"
                  style={{ width: size, height: size }}
                />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-[11px] font-bold text-white shadow-lg group-hover:block">
                  {g.name} · {formatNumber(g.dentists)}
                </span>
              </button>
            );
          })}
      </div>
    </ChartCard>
  );
}
