"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipCard, TooltipRow } from "@/components/dashboard/chart-tooltip";
import type { GoalRow } from "@/components/dashboard/goal-roadmaps-panel";

const ringPalette = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-6)",
];

function RingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length || payload[0].name !== "progress") return null;
  return (
    <TooltipCard title="Average progress">
      <TooltipRow
        color="var(--color-brand)"
        label="Across goals"
        value={`${payload[0].value}%`}
      />
    </TooltipCard>
  );
}

export function GoalProgressRing({
  goals,
  averageProgress,
}: {
  goals: GoalRow[];
  averageProgress: number;
}) {
  const ringData = [
    { name: "progress", value: averageProgress },
    { name: "remaining", value: 100 - averageProgress },
  ];

  const ringLabel = `Goal progress overview, average ${averageProgress}%. ${goals
    .map((g) => `${g.name} ${g.progress}%`)
    .join(", ")}.`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Goal Progress Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="relative mx-auto h-44 w-44 shrink-0"
          role="img"
          aria-label={ringLabel}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<RingTooltip />} />
              <Pie
                data={ringData}
                dataKey="value"
                innerRadius={62}
                outerRadius={84}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill="var(--color-brand)" />
                <Cell fill="var(--color-surface-muted)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-ink-muted">Avg Progress</span>
            <span className="text-2xl font-semibold text-ink">
              {averageProgress}%
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {goals.map((g, i) => (
            <li key={g.id} className="text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-ink-soft">{g.name}</span>
                <span className="tabular-nums font-medium text-ink">
                  {g.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${g.progress}%`,
                    backgroundColor: ringPalette[i % ringPalette.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
