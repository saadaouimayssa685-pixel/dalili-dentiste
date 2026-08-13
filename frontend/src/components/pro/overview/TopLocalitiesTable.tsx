import { MapPin, TrendingUp } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatNumber } from "@/lib/overview-data";

type LocalityRow = { locality: string; governorate: string | null; dentists: number };

export function TopLocalitiesTable({ data }: { data: LocalityRow[] }) {
  const rows = data.slice(0, 8);
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
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r, index) => {
          const pct = Math.round((r.dentists / max) * 100);
          const isTop = index === 0;
          return (
            <div
              key={`${r.locality}-${r.governorate}`}
              className={`relative overflow-hidden rounded-2xl border p-4 ${
                isTop
                  ? "border-turquoise/30 bg-gradient-to-br from-turquoise/12 to-primary/5"
                  : "border-border bg-soft/45"
              }`}
            >
              <span
                className="absolute -right-8 -top-10 size-28 rounded-full bg-white/70"
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-black ${
                      isTop ? "bg-turquoise text-white" : "bg-white text-turquoise"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-navy">{r.locality}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <MapPin className="size-3.5 text-turquoise" />
                      {r.governorate || "Gouvernorat a verifier"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black text-turquoise">{formatNumber(r.dentists)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">dentistes</p>
                </div>
              </div>
              <div className="relative mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-turquoise to-primary"
                    style={{ width: `${Math.max(8, pct)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-black text-navy">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
