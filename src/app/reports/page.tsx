import { redirect } from "next/navigation";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
import { FinanceSummary } from "@/components/reports/finance-summary";
import { GoalOverview } from "@/components/reports/goal-overview";
import { HabitGrid } from "@/components/reports/habit-grid";
import { TasksSummary } from "@/components/reports/tasks-summary";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type HabitRow = Database["public"]["Tables"]["habits"]["Row"];
type HabitCompletionRow =
  Database["public"]["Tables"]["habit_completions"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

type RawTxMonth = Pick<TransactionRow, "amount" | "category_id"> & {
  categories: {
    id: string;
    name: string;
    color: string;
  } | null;
};

function sectionHeading(id: string, label: string) {
  return (
    <h2
      id={id}
      className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted"
    >
      {label}
    </h2>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [
    { data: rawTxMonth },
    { data: rawTxSix },
    { data: rawGoals },
    { data: rawHabits },
    { data: rawCompletions },
    { data: rawTasksDone, count: tasksDoneCount },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, category_id, categories(id, name, color)")
      .gte("date", monthStart),
    supabase.from("transactions").select("amount, date").gte("date", sixMonthsAgo),
    supabase.from("goals").select("*").eq("owner_id", user.id),
    supabase
      .from("habits")
      .select("*")
      .eq("owner_id", user.id)
      .eq("cadence", "daily"),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_on")
      .eq("owner_id", user.id)
      .gte("completed_on", thirtyDaysAgo),
    supabase
      .from("tasks")
      .select("id, title, completed_at", { count: "exact" })
      .eq("owner_id", user.id)
      .eq("status", "done")
      .gte("completed_at", `${monthStart}T00:00:00Z`)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);

  const txMonth = (rawTxMonth ?? []) as unknown as RawTxMonth[];
  const txSix = (rawTxSix ?? []) as Pick<TransactionRow, "amount" | "date">[];
  const goalsRows = (rawGoals ?? []) as GoalRow[];
  const habitRows = (rawHabits ?? []) as HabitRow[];
  const completionRows = (rawCompletions ?? []) as Pick<
    HabitCompletionRow,
    "habit_id" | "completed_on"
  >[];
  const completedTasksRows = (rawTasksDone ?? []) as Pick<
    TaskRow,
    "id" | "title" | "completed_at"
  >[];

  const incomeThisMonth = txMonth.reduce((sum, tx) => {
    const amount = Number(tx.amount);
    return amount > 0 ? sum + amount : sum;
  }, 0);
  const expensesThisMonth = txMonth.reduce((sum, tx) => {
    const amount = Number(tx.amount);
    return amount < 0 ? sum + Math.abs(amount) : sum;
  }, 0);
  const netThisMonth = incomeThisMonth - expensesThisMonth;

  const monthlyMap = new Map<string, { month: string; net: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, {
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      net: 0,
    });
  }

  for (const tx of txSix) {
    const key = tx.date.slice(0, 7);
    const entry = monthlyMap.get(key);
    if (!entry) continue;
    entry.net += Number(tx.amount);
  }

  const monthlySeries = [...monthlyMap.values()].map((entry) => ({
    month: entry.month,
    net: Math.round(entry.net * 100) / 100,
  }));

  const categoryMap = new Map<
    string,
    { id: string; name: string; color: string; amount: number }
  >();
  for (const tx of txMonth) {
    if (Number(tx.amount) >= 0 || !tx.categories) continue;
    const amount = Math.abs(Number(tx.amount));
    const existing = categoryMap.get(tx.categories.id);

    if (existing) {
      existing.amount += amount;
      continue;
    }

    categoryMap.set(tx.categories.id, {
      id: tx.categories.id,
      name: tx.categories.name,
      color: tx.categories.color,
      amount,
    });
  }

  const totalSpending = [...categoryMap.values()].reduce(
    (sum, category) => sum + category.amount,
    0,
  );
  const categories = [...categoryMap.values()]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8)
    .map((category) => ({
      ...category,
      percent: totalSpending > 0 ? (category.amount / totalSpending) * 100 : 0,
    }));

  const goals = goalsRows
    .filter((goal) => goal.status !== "completed")
    .sort((left, right) => {
      if (!left.target_date) return 1;
      if (!right.target_date) return -1;
      return left.target_date.localeCompare(right.target_date);
    })
    .map((goal) => {
      const savedAmount = Number(goal.saved_amount ?? 0);
      const targetAmount =
        goal.target_amount === null ? null : Number(goal.target_amount);
      const progress =
        targetAmount && targetAmount > 0
          ? Math.min(100, Math.round((savedAmount / targetAmount) * 100))
          : 0;

      return {
        id: goal.id,
        name: goal.name,
        status: goal.status,
        savedAmount,
        targetAmount,
        targetDate: goal.target_date,
        progress,
      };
    });

  const completionMap = new Map<string, Set<string>>();
  for (const completion of completionRows) {
    const current = completionMap.get(completion.habit_id) ?? new Set<string>();
    current.add(completion.completed_on);
    completionMap.set(completion.habit_id, current);
  }

  const habits = habitRows.map((habit) => {
    const completedDays = completionMap.get(habit.id) ?? new Set<string>();
    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      return completedDays.has(date.toISOString().slice(0, 10));
    });

    return {
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      days,
    };
  });

  const recentTasks = completedTasksRows
    .filter((task) => task.completed_at)
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      completedAt: task.completed_at as string,
    }));

  const snapshotLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(today);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Reports
        </h1>
        <p className="text-sm text-ink-soft">
          Monthly snapshot &middot; {snapshotLabel}
        </p>
      </header>

      <section aria-labelledby="reports-finance">
        {sectionHeading("reports-finance", "Finance Summary")}
        <FinanceSummary
          incomeThisMonth={incomeThisMonth}
          expensesThisMonth={expensesThisMonth}
          netThisMonth={netThisMonth}
          monthlySeries={monthlySeries}
        />
      </section>

      <section aria-labelledby="reports-categories">
        {sectionHeading("reports-categories", "Top Spending Categories")}
        <CategoryBreakdown categories={categories} />
      </section>

      <section aria-labelledby="reports-goals">
        {sectionHeading("reports-goals", "Goal Progress Overview")}
        <GoalOverview goals={goals} />
      </section>

      <section aria-labelledby="reports-habits">
        {sectionHeading("reports-habits", "Habit Consistency")}
        <HabitGrid habits={habits} />
      </section>

      <section aria-labelledby="reports-tasks">
        {sectionHeading("reports-tasks", "Tasks Completed This Month")}
        <TasksSummary
          completedCount={tasksDoneCount ?? completedTasksRows.length}
          recentTasks={recentTasks}
        />
      </section>
    </div>
  );
}
