import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TasksSummaryProps = {
  completedCount: number;
  recentTasks: { id: string; title: string; completedAt: string }[];
};

function formatCompletedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function TasksSummary({
  completedCount,
  recentTasks,
}: TasksSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Tasks Completed This Month</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">
            {completedCount} task{completedCount === 1 ? "" : "s"} completed
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-semibold tracking-tight text-ink">
          {completedCount}
        </p>

        {recentTasks.length > 0 ? (
          <ul className="space-y-3">
            {recentTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0"
              >
                <p className="truncate text-sm font-medium text-ink">
                  {task.title}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                  {formatCompletedDate(task.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">
            No completed tasks recorded this month yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
