import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartCard } from "./ChartCard";
import { type OverviewData } from "@/lib/overview-data";

const SPECIALITY_REFERENCE = [
  { name: "Dentisterie generale", value: 49.2, color: "var(--brandblue)" },
  { name: "Orthodontie", value: 14.6, color: "var(--turquoise)" },
  { name: "Chirurgie orale", value: 10.6, color: "oklch(0.62 0.14 145)" },
  { name: "Parodontologie", value: 7.8, color: "oklch(0.78 0.15 78)" },
  { name: "Prothese dentaire", value: 6.1, color: "oklch(0.62 0.18 310)" },
  { name: "Endodontie", value: 5.0, color: "oklch(0.68 0.16 355)" },
  { name: "Autres specialites", value: 6.7, color: "oklch(0.86 0.02 255)" },
];

export function SpecialityDonutChart(_props: { data: OverviewData["specialities"] }) {
  return (
    <ChartCard title="Specialites en Tunisie">
      <div className="grid min-h-[220px] gap-4 lg:grid-cols-[220px_minmax(220px,1fr)] lg:items-center">
        <div className="relative h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SPECIALITY_REFERENCE}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="86%"
                paddingAngle={1}
                stroke="var(--card)"
                strokeWidth={3}
              >
                {SPECIALITY_REFERENCE.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name) => [`${value.toFixed(1)}%`, name as string]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-2xl font-black text-navy">3 653</p>
              <p className="text-xs font-semibold text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {SPECIALITY_REFERENCE.map((item) => (
            <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="text-[11px] font-semibold leading-4 text-navy">{item.name}</span>
              </div>
              <span className="text-right text-xs font-black text-muted-foreground">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
