import type {
  Achievement,
  Alert,
  Category,
  Goal,
  Habit,
  Insight,
  Integration,
  Roadmap,
  StatCard,
  Task,
  UserProfile,
} from "@/lib/types";

export const currentUser: UserProfile = {
  id: "user-ishmael",
  workspaceId: "ws-ishmael",
  name: "Ishmael B.",
  initials: "IB",
  level: 28,
  xp: 7400,
  xpToNextLevel: 10000,
};

export const statCards: StatCard[] = [
  {
    id: "net-worth",
    label: "Net Worth",
    value: "$487,206",
    delta: "+4.7%",
    trend: "up",
    hint: "vs last month",
    icon: "TrendingUp",
    accent: "var(--color-chart-1)",
  },
  {
    id: "cash-available",
    label: "Cash Available",
    value: "$18,642",
    delta: "+8.3%",
    trend: "up",
    hint: "vs last month",
    icon: "Wallet",
    accent: "var(--color-chart-2)",
  },
  {
    id: "bills-due",
    label: "Bills Due",
    value: "$1,248",
    hint: "2 bills due this week",
    icon: "Receipt",
    accent: "var(--color-chart-3)",
  },
  {
    id: "goal-funding",
    label: "Goal Funding",
    value: "72%",
    delta: "+6%",
    trend: "up",
    hint: "across 5 goals",
    icon: "Target",
    accent: "var(--color-chart-6)",
  },
];

export const spendingTotal = 4385;

export const spendingCategories: (Category & { percent: number; amount: number })[] = [
  { id: "cat-housing", name: "Housing", color: "var(--color-chart-1)", percent: 31, amount: 1359 },
  { id: "cat-food", name: "Food & Dining", color: "var(--color-chart-2)", percent: 16, amount: 702 },
  { id: "cat-transport", name: "Transportation", color: "var(--color-chart-3)", percent: 13, amount: 570 },
  { id: "cat-lifestyle", name: "Lifestyle", color: "var(--color-chart-4)", percent: 12, amount: 526 },
  { id: "cat-utilities", name: "Utilities", color: "var(--color-chart-5)", percent: 8, amount: 351 },
  { id: "cat-health", name: "Health", color: "var(--color-chart-6)", percent: 6, amount: 263 },
  { id: "cat-other", name: "Other", color: "var(--color-chart-7)", percent: 14, amount: 614 },
];

export const cashFlow = {
  income: 7250,
  expenses: 4385,
  net: 2865,
  series: [
    { month: "Dec", income: 6800, expenses: 4600 },
    { month: "Jan", income: 6950, expenses: 4200 },
    { month: "Feb", income: 7100, expenses: 4750 },
    { month: "Mar", income: 6900, expenses: 4100 },
    { month: "Apr", income: 7300, expenses: 4500 },
    { month: "May", income: 7250, expenses: 4385 },
  ],
};

export const goals: Goal[] = [
  {
    id: "goal-emergency",
    ownerId: currentUser.id,
    name: "Emergency Fund",
    status: "on_track",
    targetAmount: 30000,
    savedAmount: 27000,
    progress: 90,
    targetDate: "2025-08-01",
  },
  {
    id: "goal-home",
    ownerId: currentUser.id,
    name: "Dream Home Down Payment",
    status: "on_track",
    targetAmount: 120000,
    savedAmount: 81600,
    progress: 68,
    targetDate: "2026-06-01",
  },
  {
    id: "goal-vacation",
    ownerId: currentUser.id,
    name: "Family Vacation 2025",
    status: "at_risk",
    targetAmount: 12000,
    savedAmount: 7200,
    progress: 60,
    targetDate: "2025-12-01",
  },
  {
    id: "goal-investments",
    ownerId: currentUser.id,
    name: "Investments Portfolio",
    status: "on_track",
    targetAmount: 100000,
    savedAmount: 55000,
    progress: 55,
    targetDate: "2027-01-01",
  },
  {
    id: "goal-business",
    ownerId: currentUser.id,
    name: "Business Launch Fund",
    status: "behind",
    targetAmount: 50000,
    savedAmount: 22500,
    progress: 45,
    targetDate: "2026-09-01",
  },
];

// Headline goal-funding figure. Matches the "Goal Funding 72%" stat card.
// This is amount-weighted funding, not the simple mean of the progress bars.
export const averageGoalProgress = 72;

export const roadmaps: Roadmap[] = goals.map((goal) => ({
  id: `roadmap-${goal.id}`,
  goalId: goal.id,
  title: goal.name,
  progress: goal.progress,
}));

export const todayTasks: Task[] = [
  {
    id: "task-1",
    ownerId: currentUser.id,
    goalId: "goal-investments",
    title: "Review investment rebalancing plan",
    status: "todo",
    priority: "high",
    time: "09:00",
  },
  {
    id: "task-2",
    ownerId: currentUser.id,
    goalId: "goal-home",
    title: "Call mortgage advisor about pre-approval",
    status: "todo",
    priority: "high",
    time: "11:30",
  },
  {
    id: "task-3",
    ownerId: currentUser.id,
    title: "Approve Relay project milestone",
    status: "in_progress",
    priority: "medium",
    time: "14:00",
  },
  {
    id: "task-4",
    ownerId: currentUser.id,
    goalId: "goal-vacation",
    title: "Compare flight prices for family trip",
    status: "todo",
    priority: "low",
    time: "16:30",
  },
  {
    id: "task-5",
    ownerId: currentUser.id,
    title: "Log daily expenses & receipts",
    status: "done",
    priority: "medium",
    time: "20:00",
  },
];

export const habits: Habit[] = [
  {
    id: "habit-1",
    ownerId: currentUser.id,
    name: "Morning workout",
    cadence: "daily",
    streak: 24,
    momentum: 92,
    week: [true, true, true, true, true, false, true],
  },
  {
    id: "habit-2",
    ownerId: currentUser.id,
    goalId: "goal-investments",
    name: "Review finances",
    cadence: "daily",
    streak: 12,
    momentum: 78,
    week: [true, true, false, true, true, true, true],
  },
  {
    id: "habit-3",
    ownerId: currentUser.id,
    name: "Read 20 minutes",
    cadence: "daily",
    streak: 8,
    momentum: 64,
    week: [true, false, true, true, false, true, true],
  },
  {
    id: "habit-4",
    ownerId: currentUser.id,
    name: "No takeout spending",
    cadence: "daily",
    streak: 3,
    momentum: 41,
    week: [false, false, true, true, false, true, true],
  },
];

export const aiInsight: Insight = {
  id: "insight-1",
  title: "Redirect $420/mo to hit Dream Home faster",
  body: "Your dining and lifestyle spend is $1,228 this month — about $420 above your 3-month average. Redirecting that surplus to your Dream Home Down Payment would close the gap ~2 months early without touching your Emergency Fund, which is already 90% funded.",
  category: "finance",
};

export const achievements: Achievement[] = [
  {
    id: "ach-1",
    ownerId: currentUser.id,
    title: "Emergency Ready",
    description: "Funded 90% of your emergency goal",
    icon: "ShieldCheck",
    earnedAt: "2025-05-18",
    unlocked: true,
  },
  {
    id: "ach-2",
    ownerId: currentUser.id,
    title: "Streak Master",
    description: "30-day habit streak",
    icon: "Flame",
    earnedAt: "2025-05-10",
    unlocked: true,
  },
  {
    id: "ach-3",
    ownerId: currentUser.id,
    title: "Budget Boss",
    description: "Stayed under budget 3 months",
    icon: "PiggyBank",
    earnedAt: "2025-04-30",
    unlocked: true,
  },
  {
    id: "ach-4",
    ownerId: currentUser.id,
    title: "Investor",
    description: "Reach $100k invested",
    icon: "LineChart",
    unlocked: false,
  },
];

export const integrations: Integration[] = [
  { id: "int-gmail", name: "Gmail", status: "connected", description: "Receipt scanning", icon: "Mail" },
  { id: "int-gcal", name: "Google Calendar", status: "connected", description: "Plan sync", icon: "Calendar" },
  { id: "int-github", name: "GitHub", status: "connected", description: "Project progress", icon: "GitBranch" },
  { id: "int-relay", name: "Relay", status: "error", description: "Project status", icon: "Workflow" },
  { id: "int-notion", name: "Notion", status: "available", description: "Docs import", icon: "FileText" },
  { id: "int-supabase", name: "Supabase", status: "available", description: "Database", icon: "Database" },
];

export const alerts: Alert[] = [
  {
    id: "alert-1",
    title: "2 bills due this week",
    detail: "Mortgage ($980) and internet ($268) due in 3 days",
    severity: "warning",
    icon: "Receipt",
  },
  {
    id: "alert-2",
    title: "Relay tasks blocked",
    detail: "3 tasks waiting on your approval in Business Launch project",
    severity: "critical",
    icon: "AlertTriangle",
  },
  {
    id: "alert-3",
    title: "Habit momentum dropping",
    detail: "\"No takeout spending\" momentum fell to 41% this week",
    severity: "info",
    icon: "TrendingDown",
  },
];
