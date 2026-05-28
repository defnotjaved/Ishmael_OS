import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GoalStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const statusMeta: Record<
  GoalStatus,
  { label: string; tone: "positive" | "warning" | "negative" | "neutral" }
> = {
  on_track: { label: "On track", tone: "positive" },
  at_risk: { label: "At risk", tone: "warning" },
  behind: { label: "Behind", tone: "negative" },
  completed: { label: "Completed", tone: "neutral" },
};

export type GoalRow = {
  id: string;
  name: string;
  status: GoalStatus;
  savedAmount: number;
  targetAmount: number;
  progress: number;
};

export function GoalRoadmapsPanel({ goals }: { goals: GoalRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Roadmaps</CardTitle>
        <button className="inline-flex items-center gap-0.5 rounded text-xs font-medium text-brand hover:underline outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
          View all <ChevronRight className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const meta = statusMeta[goal.status];
          return (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink">
                  {goal.name}
                </p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <Progress value={goal.progress} className="mb-1.5" />
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>
                  {formatCurrency(goal.savedAmount)} of{" "}
                  {formatCurrency(goal.targetAmount)}
                </span>
                <span className="font-medium text-ink">{goal.progress}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
