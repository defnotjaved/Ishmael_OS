"use client";

import { useState, useTransition } from "react";
import { Flame, Trash2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logHabitCompletion, unlogHabitCompletion, createHabit, deleteHabit } from "@/app/habits/actions";

export type HabitEntry = {
  id: string;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  streak: number;
  week: boolean[]; // last 7 days, index 0 = 6 days ago, index 6 = today
  weekDates: string[]; // ISO dates matching week[]
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HabitRow({ habit }: { habit: HabitEntry }) {
  const [week, setWeek] = useState(habit.week);
  const [streak, setStreak] = useState(habit.streak);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleToggle(index: number) {
    const date = habit.weekDates[index];
    const wasComplete = week[index];
    startTransition(async () => {
      setWeek((prev) => prev.map((v, i) => (i === index ? !v : v)));
      if (wasComplete) {
        await unlogHabitCompletion(habit.id, date);
        setStreak((s) => Math.max(0, s - 1));
      } else {
        await logHabitCompletion(habit.id, date);
        // Optimistically bump streak if toggling today
        const today = new Date().toISOString().slice(0, 10);
        if (date === today) setStreak((s) => s + 1);
      }
    });
  }

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      await deleteHabit(habit.id);
    });
  }

  if (deleting) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{habit.name}</p>
            <span className="inline-flex items-center gap-1 text-xs text-warning mt-0.5">
              <Flame className="size-3.5" />
              {streak} day streak
            </span>
          </div>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-ink-muted hover:text-red-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded mt-0.5"
            aria-label="Delete habit"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {week.map((done, i) => (
            <button
              key={i}
              onClick={() => handleToggle(i)}
              disabled={isPending}
              aria-label={`${done ? "Unlog" : "Log"} ${DAY_LABELS[i % 7]}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                done
                  ? "bg-positive/10 hover:bg-positive/20"
                  : "bg-surface-muted hover:bg-brand/10"
              )}
            >
              <span
                className={cn(
                  "size-5 rounded-full",
                  done ? "bg-positive" : "bg-line"
                )}
              />
              <span className={cn("text-[10px]", done ? "text-positive font-medium" : "text-ink-muted")}>
                {DAY_LABELS[i % 7].slice(0, 1)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddHabitForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      await createHabit(fd);
      form.reset();
      setOpen(false);
      onAdded();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Plus className="size-4" /> Add habit
      </button>
    );
  }

  return (
    <Card className="border-brand/40">
      <CardContent className="pt-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            autoFocus
            required
            placeholder="Habit name…"
            maxLength={200}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              name="cadence"
              defaultValue="daily"
              className="text-xs text-ink bg-surface border border-line rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="flex gap-1.5 ml-auto">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function HabitTracker({ initialHabits }: { initialHabits: HabitEntry[] }) {
  const [version, setVersion] = useState(0);

  return (
    <div className="space-y-3">
      {initialHabits.length === 0 && (
        <p className="text-center text-sm text-ink-muted py-6">
          No habits yet. Add your first one below.
        </p>
      )}
      {initialHabits.map((h) => (
        <HabitRow key={`${h.id}-${version}`} habit={h} />
      ))}
      <AddHabitForm onAdded={() => setVersion((v) => v + 1)} />
    </div>
  );
}
