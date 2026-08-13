import { ChartCard } from "./ChartCard";
import { formatNumber } from "@/lib/overview-data";

type LocalityRow = { locality: string; governorate: string | null; dentists: number };

export function TopLocalitiesTable({ data }: { data: LocalityRow[] }) {
  const rows = data.slice(0, 12);
  const total = rows.reduce((s, r) => s + r.dentists, 0);

  return (
    <ChartCard title="Top localités" subtitle="Concentration des cabinets par localité">
      <div className="max-h-80 overflow-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="sticky top-0 bg-soft text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Localité</th>
              <th className="px-4 py-2.5 font-semibold">Gouvernorat</th>
              <th className="px-4 py-2.5 text-right font-semibold">Dentistes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.locality} className="border-t border-border hover:bg-soft/60">
                <td className="px-4 py-2.5 font-semibold text-navy">{r.locality}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.governorate}</td>
                <td className="px-4 py-2.5 text-right font-bold text-navy">
                  {formatNumber(r.dentists)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-soft-2/60">
              <td className="px-4 py-2.5 font-bold text-navy" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-2.5 text-right font-extrabold text-turquoise">
                {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
