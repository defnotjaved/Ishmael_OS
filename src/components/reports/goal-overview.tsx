import type { GoalStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

export type GoalOverviewProps = {
  goals: {
    id: string;
    name: string;
    status: "on_track" | "at_risk" | "behind" | "completed";
    savedAmount: number;
    targetAmount: number | null;
    targetDate: string | null;
    progress: number;
  }[];
};

const statusMeta: Record<
  GoalStatus,
  { label: string; tone: "positive" | "warning" | "negative" | "neutral" }
> = {
  on_track: { label: "On track", tone: "positive" },
  at_risk: { label: "At risk", tone: "warning" },
  behind: { label: "Behind", tone: "negative" },
  completed: { label: "Completed", tone: "neutral" },
};

function getDeadlineLabel(targetDate: string | null) {
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${targetDate}T00:00:00`);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (deadline.getTime() - today.getTime()) / 86400000,
  );

  if (diffDays === 0) return "Due today";
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} left`;
}

export function GoalOverview({ goals }: GoalOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Goal Progress Overview</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">Active goals</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const meta = statusMeta[goal.status];
            const deadlineLabel = getDeadlineLabel(goal.targetDate);

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-ink">
                    {goal.name}
                  </p>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <Progress value={goal.progress} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                  <span>
                    {goal.targetAmount
                      ? `${formatCurrency(goal.savedAmount, true)} / ${formatCurrency(goal.targetAmount, true)}`
                      : "In progress"}
                  </span>
                  {deadlineLabel ? (
                    <span className="font-medium text-ink-muted">{deadlineLabel}</span>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-ink-muted">
            No active goals to review right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
