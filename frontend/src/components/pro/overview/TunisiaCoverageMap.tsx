import { MapPinned } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatNumber, type OverviewData } from "@/lib/overview-data";

const POSITIONS: Record<string, { x: number; y: number }> = {
  Bizerte: { x: 46, y: 8 },
  Tunis: { x: 60, y: 16 },
  Ariana: { x: 57, y: 12 },
  "Ben Arous": { x: 62, y: 20 },
  Manouba: { x: 52, y: 17 },
  "La Manouba": { x: 52, y: 17 },
  Nabeul: { x: 75, y: 20 },
  Zaghouan: { x: 56, y: 27 },
  Beja: { x: 39, y: 19 },
  "BÃ©ja": { x: 39, y: 19 },
  Jendouba: { x: 28, y: 23 },
  "Le Kef": { x: 31, y: 35 },
  Siliana: { x: 43, y: 34 },
  Sousse: { x: 62, y: 39 },
  Monastir: { x: 68, y: 43 },
  Mahdia: { x: 70, y: 50 },
  Kairouan: { x: 52, y: 47 },
  Kasserine: { x: 34, y: 55 },
  "Sidi Bouzid": { x: 47, y: 60 },
  Sfax: { x: 62, y: 66 },
  Gafsa: { x: 36, y: 73 },
  Tozeur: { x: 25, y: 80 },
  Kebili: { x: 43, y: 86 },
  "KÃ©bili": { x: 43, y: 86 },
  Gabes: { x: 57, y: 80 },
  "GabÃ¨s": { x: 57, y: 80 },
  Medenine: { x: 66, y: 90 },
  "MÃ©denine": { x: 66, y: 90 },
  Tataouine: { x: 57, y: 97 },
};

const LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  Bizerte: { x: -52, y: 14 },
  Tunis: { x: 12, y: 18 },
  Ariana: { x: -74, y: -6 },
  "Ben Arous": { x: 12, y: 14 },
  Manouba: { x: -88, y: 10 },
  "La Manouba": { x: -88, y: 10 },
  Nabeul: { x: 16, y: 14 },
  Zaghouan: { x: -82, y: 10 },
  Beja: { x: -58, y: -6 },
  "BÃ©ja": { x: -58, y: -6 },
  Jendouba: { x: -92, y: -2 },
  "Le Kef": { x: -82, y: 2 },
  Siliana: { x: -72, y: 2 },
  Sousse: { x: -62, y: 12 },
  Monastir: { x: 12, y: 14 },
  Mahdia: { x: 12, y: 14 },
  Kairouan: { x: -76, y: -2 },
  Kasserine: { x: -92, y: 0 },
  "Sidi Bouzid": { x: -92, y: 0 },
  Sfax: { x: 10, y: 12 },
  Gafsa: { x: -76, y: 4 },
  Tozeur: { x: -82, y: 0 },
  Kebili: { x: -62, y: 8 },
  "KÃ©bili": { x: -62, y: 8 },
  Gabes: { x: -76, y: 4 },
  "GabÃ¨s": { x: -76, y: 4 },
  Medenine: { x: 10, y: 8 },
  "MÃ©denine": { x: 10, y: 8 },
  Tataouine: { x: -76, y: -22 },
};

const cleanGovernorateName = (name: string) =>
  name
    .replace("BÃ©ja", "Beja")
    .replace("KÃ©bili", "Kebili")
    .replace("GabÃ¨s", "Gabes")
    .replace("MÃ©denine", "Medenine");

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
      <div className="relative h-[350px] overflow-hidden rounded-[1.7rem] border border-border bg-[radial-gradient(circle_at_78%_18%,rgba(18,103,216,0.14),transparent_28%),linear-gradient(135deg,#fbfdff,#eaf8fb)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,69,0.035)_1px,transparent_1px),linear-gradient(rgba(7,26,69,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <svg
          className="absolute left-[19%] top-[4%] h-[92%] w-[57%] drop-shadow-[0_18px_45px_rgba(7,26,69,0.08)]"
          viewBox="0 0 420 700"
          aria-hidden="true"
        >
          <path
            d="M205 12c38 5 72 24 99 53 32 35 55 86 67 147 13 65 8 127-12 183-16 45-44 82-78 113-33 30-49 60-51 99-2 35-17 59-45 70-27-11-42-35-44-70-2-39-18-69-51-99-35-31-62-68-78-113-20-56-25-118-12-183C12 151 35 100 67 65c27-29 61-48 99-53 16 14 25 31 39 31s23-17 40-31Z"
            fill="rgba(255,255,255,0.82)"
            stroke="rgba(20,160,170,0.22)"
            strokeWidth="2"
          />
          <path
            d="M202 44c26 18 52 21 83 26 37 42 56 93 63 153 8 68-7 131-41 184-26 41-67 71-86 118-7 19-10 42-14 69-5 24-13 41-25 50-12-9-20-26-25-50-4-27-7-50-14-69-19-47-60-77-86-118-34-53-49-116-41-184 7-60 26-111 63-153 31-5 57-8 83-26 11 12 21 20 40 20Z"
            fill="rgba(20,160,170,0.04)"
            stroke="rgba(18,103,216,0.08)"
            strokeWidth="1.5"
          />
        </svg>
        <div className="absolute bottom-5 left-5 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Densite cabinets</p>
          <p className="mt-1 text-2xl font-black text-navy">{formatNumber(data.reduce((s, g) => s + g.dentists, 0))}</p>
        </div>
        {data.map((g) => {
          const pos = POSITIONS[g.name] ?? { x: 50, y: 50 };
          const labelOffset = LABEL_OFFSETS[g.name] ?? { x: 12, y: 12 };
          const displayName = cleanGovernorateName(g.name);
          const ratio = g.dentists / max;
          const size = 10 + ratio * 30;

          return (
            <button
              key={g.name}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={`${displayName} - ${formatNumber(g.dentists)} dentistes`}
              type="button"
            >
              <span
                className="block rounded-full border-[4px] border-white bg-primary shadow-lg ring-[7px] ring-primary/18 transition duration-200 group-hover:scale-125 group-hover:bg-turquoise group-hover:ring-turquoise/25"
                style={{ width: size, height: size }}
              />
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 z-20 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(7,26,69,0.22)] transition duration-200 group-hover:scale-105 group-hover:bg-primary"
                style={{ transform: `translate(${labelOffset.x}px, ${labelOffset.y}px)` }}
              >
                {displayName} · {formatNumber(g.dentists)}
              </span>
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
}
