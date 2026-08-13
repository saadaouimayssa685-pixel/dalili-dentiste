import { MapPin, TrendingUp } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatNumber } from "@/lib/overview-data";

type LocalityRow = { locality: string; governorate: string | null; dentists: number };

export function TopLocalitiesTable({ data }: { data: LocalityRow[] }) {
  const rows = data.slice(0, 10);
  const max = Math.max(...rows.map((row) => row.dentists), 1);
  const leader = rows[0];

  return (
    <ChartCard
      title="Zones locales prioritaires"
      subtitle="Concentration des cabinets par localite exploitable"
      action={
        leader ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-turquoise/10 px-3 py-1 text-xs font-black text-turquoise">
            <TrendingUp className="size-3.5" /> Leader : {leader.locality}
          </span>
        ) : null
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {rows.map((r, index) => {
          const pct = Math.round((r.dentists / max) * 100);
          const isTop = index === 0;
          return (
            <div
              key={`${r.locality}-${r.governorate}`}
              className={`relative min-h-[128px] overflow-hidden rounded-2xl border p-3.5 ${
                isTop
                  ? "border-turquoise/30 bg-gradient-to-br from-turquoise/12 to-primary/5"
                  : "border-border bg-soft/45"
              }`}
            >
              <span
                className="absolute -right-8 -top-10 size-24 rounded-full bg-white/65"
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black ${
                    isTop ? "bg-turquoise text-white" : "bg-white text-turquoise"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-black text-turquoise shadow-sm">
                  {formatNumber(r.dentists)} dentistes
                </span>
              </div>
              <p className="relative mt-4 line-clamp-1 text-base font-black text-navy" title={r.locality}>
                {r.locality}
              </p>
              <p className="relative mt-1 inline-flex max-w-full items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <MapPin className="size-3 text-turquoise" />
                <span className="truncate" title={r.governorate || "A verifier"}>
                  {r.governorate || "A verifier"}
                </span>
              </p>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-turquoise to-primary"
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
