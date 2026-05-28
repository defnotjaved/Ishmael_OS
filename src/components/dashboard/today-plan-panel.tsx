import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorityTone: Record<TaskPriority, "negative" | "warning" | "neutral"> =
  {
    high: "negative",
    medium: "warning",
    low: "neutral",
  };

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  time?: string;
};

export function TodayPlanPanel({ tasks }: { tasks: TaskRow[] }) {
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Today&apos;s Plan</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">
            {done} of {tasks.length} completed
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task) => {
          const completed = task.status === "done";
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface-muted"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border",
                  completed
                    ? "border-positive bg-positive text-white"
                    : "border-line",
                )}
              >
                {completed && <Check className="size-3.5" />}
              </span>
              <span className="w-12 shrink-0 text-xs tabular-nums text-ink-muted">
                {task.time}
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-sm",
                  completed ? "text-ink-muted line-through" : "text-ink",
                )}
              >
                {task.title}
              </span>
              <Badge tone={priorityTone[task.priority]} className="capitalize">
                {task.priority}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
