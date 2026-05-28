"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipCard, TooltipRow } from "@/components/dashboard/chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export type CashFlowMonth = {
  month: string;
  income: number;
  expenses: number;
};

export type CashFlowSummary = {
  series: CashFlowMonth[];
  income: number;
  expenses: number;
  net: number;
};

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipCard title={label}>
      {payload.map((p) => (
        <TooltipRow
          key={p.name}
          color={p.color}
          label={p.name}
          value={formatCurrency(p.value)}
        />
      ))}
    </TooltipCard>
  );
}

export function CashflowChart({ series, income, expenses, net }: CashFlowSummary) {
  const summary = [
    { label: "Income", value: income, color: "var(--color-chart-2)" },
    { label: "Expenses", value: expenses, color: "var(--color-chart-4)" },
    { label: "Net Cash Flow", value: net, color: "var(--color-chart-1)" },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {summary.map((s) => (
            <div key={s.label}>
              <p className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </p>
              <p className="mt-0.5 text-base font-semibold tracking-tight text-ink">
                {formatCurrency(s.value)}
              </p>
            </div>
          ))}
        </div>

        <div
          className="h-40 w-full"
          role="img"
          aria-label={`Cash flow over 6 months. Income ${formatCurrency(income)}, expenses ${formatCurrency(expenses)}, net ${formatCurrency(net)} this month.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-line)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-muted)" }}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey="income"
                name="income"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="expenses"
                name="expenses"
                fill="var(--color-chart-4)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
