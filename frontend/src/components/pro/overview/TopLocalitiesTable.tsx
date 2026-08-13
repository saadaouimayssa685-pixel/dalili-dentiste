import { MapPin } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatNumber } from "@/lib/overview-data";

type LocalityRow = { locality: string; governorate: string | null; dentists: number };

export function TopLocalitiesTable({ data }: { data: LocalityRow[] }) {
  const rows = data.slice(0, 10);
  const max = Math.max(...rows.map((row) => row.dentists), 1);

  return (
    <ChartCard title="Zones locales prioritaires" subtitle="Localites exploitables avec forte concentration">
      <div className="space-y-3">
        {rows.map((r, index) => {
          const width = `${Math.max(6, (r.dentists / max) * 100)}%`;
          return (
            <div key={`${r.locality}-${r.governorate}`} className="rounded-2xl border border-border bg-soft/45 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-turquoise/10 text-xs font-black text-turquoise">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-black text-navy">{r.locality}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <MapPin className="size-3.5 text-turquoise" /> {r.governorate || "Gouvernorat a verifier"}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-sm font-black text-turquoise">
                  {formatNumber(r.dentists)}
                  <span className="block text-[10px] font-semibold text-muted-foreground">dentistes</span>
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-turquoise to-primary" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
