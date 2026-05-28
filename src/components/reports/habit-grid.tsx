import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type HabitGridProps = {
  habits: {
    id: string;
    name: string;
    streak: number;
    days: boolean[];
  }[];
};

export function HabitGrid({ habits }: HabitGridProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Habit Consistency</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">Last 30 days</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {habits.length > 0 ? (
          habits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-ink">
                  {habit.name}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-warning">
                  <Flame className="size-3.5" />
                  {habit.streak} day{habit.streak === 1 ? "" : "s"}
                </span>
              </div>
              <div
                className="grid grid-cols-[repeat(30,_minmax(0,_1fr))] gap-1"
                aria-label={`${habit.name} completion for the last 30 days`}
              >
                {habit.days.map((complete, index) => (
                  <span
                    key={`${habit.id}-${index}`}
                    className={cn(
                      "size-2 rounded-full",
                      complete ? "bg-brand" : "bg-line",
                    )}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-muted">
            No daily habits found for the last 30 days.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
