import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export type HabitRow = {
  id: string;
  name: string;
  streak: number;
  momentum: number;
  week: boolean[];
};

export function HabitsPanel({ habits }: { habits: HabitRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Habits</CardTitle>
        <span className="text-xs text-ink-soft">This week</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-ink">
                  {habit.name}
                </p>
                <span className="inline-flex items-center gap-0.5 text-xs text-warning">
                  <Flame className="size-3.5" />
                  {habit.streak}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                Momentum {habit.momentum}%
              </p>
            </div>
            <div
              className="flex shrink-0 gap-1"
              aria-label={`${habit.name} weekly completion`}
            >
              {habit.week.map((complete, i) => (
                <span
                  key={i}
                  title={dayLabels[i]}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md text-[9px] font-medium",
                    complete
                      ? "bg-positive text-white"
                      : "bg-surface-muted text-ink-muted",
                  )}
                >
                  {dayLabels[i]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
