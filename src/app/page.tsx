import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCards } from "@/components/dashboard/stat-cards";
import { SpendingDonut, type SpendingCategory } from "@/components/dashboard/spending-donut";
import { CashflowChart, type CashFlowSummary } from "@/components/dashboard/cashflow-chart";
import { GoalProgressRing } from "@/components/dashboard/goal-progress-ring";
import { GoalRoadmapsPanel } from "@/components/dashboard/goal-roadmaps-panel";
import { TodayPlanPanel } from "@/components/dashboard/today-plan-panel";
import { HabitsPanel } from "@/components/dashboard/habits-panel";
import { AiInsightPanel } from "@/components/dashboard/ai-insight-panel";
import { AchievementsPanel } from "@/components/dashboard/achievements-panel";
import { IntegrationsPanel } from "@/components/dashboard/integrations-panel";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { listConnectedProviders } from "@/lib/integrations/token-store";
import { SeedBanner } from "@/components/dashboard/seed-banner";
import type { GoalRow } from "@/components/dashboard/goal-roadmaps-panel";
import type { TaskRow } from "@/components/dashboard/today-plan-panel";
import type { HabitRow } from "@/components/dashboard/habits-panel";
import type {
  AchievementRow,
  ProfileSummary,
} from "@/components/dashboard/achievements-panel";

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted"
    >
      {children}
    </h2>
  );
}

function scheduledForToTime(scheduledFor: string | null): string | undefined {
  if (!scheduledFor) return undefined;
  // ISO string: "2026-05-27T09:00:00+00:00" → "09:00"
  const match = scheduledFor.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : undefined;
}

function buildWeekArray(
  habitId: string,
  completions: { habit_id: string; completed_on: string }[],
): boolean[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return completions.some(
      (c) => c.habit_id === habitId && c.completed_on === iso,
    );
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Seven days ago for habit completions query
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString().slice(0, 10);

  // Finance: current month boundaries + 6-month window
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const [
    { data: rawGoals },
    { data: rawTasks },
    { data: rawHabits },
    { data: rawCompletions },
    { data: rawAchievements },
    { data: profile },
    { data: rawTxThisMonth },
    { data: rawTxSixMonths },
    connectedProviders,
  ] = await Promise.all([
    supabase.from("goals").select("*").order("created_at"),
    supabase
      .from("tasks")
      .select("*")
      .order("scheduled_for", { nullsFirst: false }),
    supabase.from("habits").select("*"),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_on")
      .gte("completed_on", sevenDaysAgoIso),
    supabase.from("achievements").select("*").order("created_at"),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // This month's expenses for donut chart
    supabase
      .from("transactions")
      .select("amount, category_id, categories(id, name, color)")
      .lt("amount", 0)
      .gte("date", monthStart),
    // Last 6 months for cashflow chart
    supabase
      .from("transactions")
      .select("amount, date")
      .gte("date", sixMonthsAgo),
    listConnectedProviders(user.id),
  ]);

  const hasData = (rawGoals ?? []).length > 0;

  // Transform goals for panels
  const goals: GoalRow[] = (rawGoals ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    status: g.status,
    savedAmount: Number(g.saved_amount),
    targetAmount: Number(g.target_amount ?? 0),
    progress:
      g.target_amount && Number(g.target_amount) > 0
        ? Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100)
        : 0,
  }));

  // Weighted average progress (saved / target across all goals)
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const averageProgress =
    totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Transform tasks
  const tasks: TaskRow[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    time: scheduledForToTime(t.scheduled_for),
  }));

  // Transform habits with week array from completions
  const completions = rawCompletions ?? [];
  const habits: HabitRow[] = (rawHabits ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    streak: h.streak,
    momentum: h.momentum,
    week: buildWeekArray(h.id, completions),
  }));

  // Transform achievements
  const achievements: AchievementRow[] = (rawAchievements ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: a.unlocked,
  }));

  // ── Finance: spending donut ────────────────────────────────────────────────
  type RawTx = { amount: number; category_id: string | null; categories: { id: string; name: string; color: string } | null };
  const txThisMonth = (rawTxThisMonth ?? []) as unknown as RawTx[];

  const catMap = new Map<string, { name: string; color: string; total: number }>();
  for (const tx of txThisMonth) {
    const cat = tx.categories;
    if (!cat) continue;
    const existing = catMap.get(cat.id);
    if (existing) {
      existing.total += Math.abs(Number(tx.amount));
    } else {
      catMap.set(cat.id, { name: cat.name, color: cat.color, total: Math.abs(Number(tx.amount)) });
    }
  }
  const spendingTotal = [...catMap.values()].reduce((s, c) => s + c.total, 0);
  const spendingCategories: SpendingCategory[] = [...catMap.entries()]
    .map(([id, c]) => ({
      id,
      name: c.name,
      color: c.color,
      amount: Math.round(c.total * 100) / 100,
      percent: spendingTotal > 0 ? Math.round((c.total / spendingTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── Finance: cashflow chart ────────────────────────────────────────────────
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cfMap = new Map<string, { month: string; income: number; expenses: number }>();

  // Pre-fill the last 6 months (inclusive) so even empty months appear
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    cfMap.set(key, { month: monthNames[d.getMonth()], income: 0, expenses: 0 });
  }

  for (const tx of rawTxSixMonths ?? []) {
    const key = String(tx.date).slice(0, 7); // "YYYY-MM"
    const entry = cfMap.get(key);
    if (!entry) continue;
    const amt = Number(tx.amount);
    if (amt > 0) entry.income += amt;
    else entry.expenses += Math.abs(amt);
  }

  const cfSeries = [...cfMap.values()].map((e) => ({
    month: e.month,
    income: Math.round(e.income),
    expenses: Math.round(e.expenses),
  }));

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = cfMap.get(currentMonthKey) ?? { income: 0, expenses: 0 };
  const cashFlow: CashFlowSummary = {
    series: cfSeries,
    income: Math.round(currentMonth.income),
    expenses: Math.round(currentMonth.expenses),
    net: Math.round(currentMonth.income - currentMonth.expenses),
  };

  // Profile summary for AchievementsPanel
  const profileSummary: ProfileSummary = {
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    xpToNextLevel: profile?.xp_to_next_level ?? 1000,
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {!hasData && <SeedBanner userId={user.id} />}

      <section aria-labelledby="overview-heading">
        <SectionHeading id="overview-heading">Overview</SectionHeading>
        <StatCards />
      </section>

      <section aria-labelledby="analytics-heading">
        <SectionHeading id="analytics-heading">Analytics</SectionHeading>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SpendingDonut categories={spendingCategories} total={spendingTotal} />
          <CashflowChart {...cashFlow} />
          <GoalProgressRing goals={goals} averageProgress={averageProgress} />
        </div>
      </section>

      <section aria-labelledby="plan-heading">
        <SectionHeading id="plan-heading">Goals &amp; Plan</SectionHeading>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GoalRoadmapsPanel goals={goals} />
          <TodayPlanPanel tasks={tasks} />
          <HabitsPanel habits={habits} />
        </div>
      </section>

      <section aria-labelledby="progress-heading">
        <SectionHeading id="progress-heading">
          Progress &amp; Attention
        </SectionHeading>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AiInsightPanel />
          <AchievementsPanel
            achievements={achievements}
            profile={profileSummary}
          />
          <AlertsPanel />
        </div>
      </section>

      <IntegrationsPanel connectedProviders={connectedProviders} />
    </div>
  );
}
