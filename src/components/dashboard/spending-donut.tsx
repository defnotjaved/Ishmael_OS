"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipCard, TooltipRow } from "@/components/dashboard/chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export type SpendingCategory = {
  id: string;
  name: string;
  color: string;
  percent: number;
  amount: number;
};

type DonutDatum = SpendingCategory;

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DonutDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipCard title={d.name}>
      <TooltipRow
        color={d.color}
        label={`${d.percent}%`}
        value={formatCurrency(d.amount)}
      />
    </TooltipCard>
  );
}

type Props = {
  categories: SpendingCategory[];
  total: number;
};

export function SpendingDonut({ categories, total }: Props) {
  const ariaLabel =
    categories.length === 0
      ? "Spending by category — no transactions this month"
      : `Spending by category, total ${formatCurrency(total)}. ${categories.map((c) => `${c.name} ${c.percent}%`).join(", ")}.`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Spending by Category</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">This month</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="relative mx-auto h-44 w-44 shrink-0"
          role="img"
          aria-label={ariaLabel}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<DonutTooltip />} />
              <Pie
                data={
                  categories.length > 0
                    ? categories
                    : [{ id: "empty", name: "No data", color: "var(--color-line)", percent: 100, amount: 0 }]
                }
                dataKey="percent"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={categories.length > 1 ? 2 : 0}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {(categories.length > 0 ? categories : [{ id: "empty", color: "var(--color-line)" }]).map((c) => (
                  <Cell key={c.id} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-ink-muted">Total</span>
            <span className="text-xl font-semibold text-ink">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {categories.length > 0 ? (
          <ul className="flex-1 space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 truncate text-ink-soft">{c.name}</span>
                <span className="tabular-nums text-ink-muted">{c.percent}%</span>
                <span className="w-16 text-right tabular-nums font-medium text-ink">
                  {formatCurrency(c.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex-1 text-sm text-ink-muted text-center">
            No transactions recorded this month yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
