import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HabitTracker } from "@/components/habits/habit-tracker";
import type { HabitEntry } from "@/components/habits/habit-tracker";

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  // Build last-7-days date array (index 0 = 6 days ago, index 6 = today)
  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const [{ data: rawHabits }, { data: rawCompletions }] = await Promise.all([
    supabase.from("habits").select("id, name, cadence, streak, momentum").eq("owner_id", user.id).order("created_at"),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_on")
      .eq("owner_id", user.id)
      .gte("completed_on", weekDates[0]),
  ]);

  const completionSet = new Set(
    (rawCompletions ?? []).map((c) => `${c.habit_id}:${c.completed_on}`)
  );

  const habits: HabitEntry[] = (rawHabits ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    cadence: h.cadence as HabitEntry["cadence"],
    streak: h.streak,
    week: weekDates.map((d) => completionSet.has(`${h.id}:${d}`)),
    weekDates,
  }));

  const streakLeaders = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 3);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
          <Flame className="size-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Habits</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {habits.length} habit{habits.length !== 1 ? "s" : ""} tracked
            {streakLeaders[0]?.streak > 0 && ` · top streak: ${streakLeaders[0].streak} days`}
          </p>
        </div>
      </div>

      <HabitTracker initialHabits={habits} />
    </div>
  );
}
