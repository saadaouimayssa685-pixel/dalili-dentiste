import { CheckCircle2, ShieldCheck } from "lucide-react";

import { ChartCard } from "./ChartCard";
import { formatPct, type OverviewData } from "@/lib/overview-data";

export function DataQualityPanel({ data }: { data: OverviewData["quality"] }) {
  const global = data.find((q) => q.label.toLowerCase().includes("globale")) ?? data.at(-1);
  const score = Math.round(global?.value ?? 0);
  const metrics = data.filter((q) => q !== global).slice(0, 4);

  return (
    <ChartCard title="Qualite des donnees" subtitle="Score global et points de controle">
      <div className="grid gap-4">
        <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-4 rounded-3xl bg-gradient-to-br from-turquoise/12 to-primary/5 p-4">
          <div
            className="grid aspect-square place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--turquoise) ${score * 3.6}deg, var(--soft-2) 0deg)`,
            }}
          >
            <div className="grid size-[92px] place-items-center rounded-full bg-card text-center shadow-sm">
              <div>
                <p className="text-3xl font-black text-navy">{score}</p>
                <p className="text-[11px] font-bold text-muted-foreground">/100</p>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-lg font-black text-navy">
              <ShieldCheck className="size-5 text-turquoise" /> Score qualite global
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Plus le score est eleve, plus la base est exploitable pour prospection, analyse et exports.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <CheckCircle2 className="size-3.5" /> Bon niveau
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((q) => (
            <div key={q.label} className="rounded-2xl border border-border bg-soft/45 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-navy">{q.label}</span>
                <span
                  className={`text-sm font-black ${q.tone === "warn" ? "text-destructive" : "text-turquoise"}`}
                >
                  {formatPct(q.value)}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${
                    q.tone === "warn"
                      ? "bg-gradient-to-r from-orange-400 to-destructive"
                      : "bg-gradient-to-r from-turquoise to-primary"
                  }`}
                  style={{ width: `${Math.min(100, q.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
