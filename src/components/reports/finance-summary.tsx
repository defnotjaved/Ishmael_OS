"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TooltipCard, TooltipRow } from "@/components/dashboard/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export type FinanceSummaryProps = {
  incomeThisMonth: number;
  expensesThisMonth: number;
  netThisMonth: number;
  monthlySeries: { month: string; net: number }[];
};

type TooltipDatum = {
  payload: {
    month: string;
    net: number;
  };
  value: number;
};

function formatNetCurrency(value: number) {
  if (value === 0) return formatCurrency(0, true);
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(value), true)}`;
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipDatum[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const color =
    value >= 0 ? "var(--color-positive)" : "var(--color-negative)";

  return (
    <TooltipCard title={label}>
      <TooltipRow color={color} label="Net savings" value={formatNetCurrency(value)} />
    </TooltipCard>
  );
}

export function FinanceSummary({
  incomeThisMonth,
  expensesThisMonth,
  netThisMonth,
  monthlySeries,
}: FinanceSummaryProps) {
  const summaryCards = [
    {
      label: "Income this month",
      value: formatCurrency(incomeThisMonth, true),
      valueClassName: "text-ink",
    },
    {
      label: "Expenses this month",
      value: formatCurrency(expensesThisMonth, true),
      valueClassName: "text-ink",
    },
    {
      label: "Net savings",
      value: formatNetCurrency(netThisMonth),
      valueClassName: netThisMonth >= 0 ? "text-positive" : "text-negative",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                {card.label}
              </p>
              <p className={`text-2xl font-semibold tracking-tight ${card.valueClassName}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Monthly Net Savings Trend</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">Last 6 months</p>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="h-[180px] w-full"
            role="img"
            aria-label={`Monthly net savings trend for the last 6 months. Current net savings ${formatNetCurrency(netThisMonth)}.`}
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={monthlySeries}
                margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-muted)" }}
                  content={<TrendTooltip />}
                />
                <Bar dataKey="net" radius={4} maxBarSize={28}>
                  {monthlySeries.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={
                        entry.net >= 0
                          ? "var(--color-positive)"
                          : "var(--color-negative)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
