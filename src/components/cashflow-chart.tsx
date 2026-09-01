import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { forEntity, monthlySeries } from "@/lib/fiscal";
import { formatEur, formatXof, toEur } from "@/lib/money";
import { useFinance } from "@/lib/store";

export function CashflowChart() {
  const transactions = useFinance((s) => s.transactions);
  const activeEntityId = useFinance((s) => s.activeEntityId);
  const year = useFinance((s) => s.company.exercice);
  const rate = useFinance((s) => s.company.tauxChange);
  const display = useFinance((s) => s.display);
  const through = year === 2026 ? 8 : 12;
  const data = monthlySeries(
    forEntity(transactions, activeEntityId),
    year,
    rate,
    through,
  );

  return (
    <div className="h-64 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} barCategoryGap="28%">
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              display === "eur"
                ? `${Math.round(toEur(v, rate) / 1000)} k€`
                : `${Math.round(v / 1_000_000)} M`
            }
            width={48}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const rec = Number(payload.find((p) => p.dataKey === "rec")?.value ?? 0);
              const dep = Number(payload.find((p) => p.dataKey === "dep")?.value ?? 0);
              return (
                <div className="rounded-lg bg-ink px-3 py-2 text-xs text-cover-fg shadow-md">
                  <p className="mb-1 font-medium">{label}</p>
                  <p>Recettes {display === "eur" ? formatEur(toEur(rec, rate)) : formatXof(rec)}</p>
                  <p>Dépenses {display === "eur" ? formatEur(toEur(dep, rate)) : formatXof(dep)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="rec" fill="var(--color-cover)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="dep" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
