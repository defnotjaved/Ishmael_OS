<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ishmael HQ Agent Instructions

## Product

Ishmael HQ is a personal/family life operating system for:
- finances
- goals
- roadmaps
- tasks
- habits
- achievements
- projects
- documents
- family workspace
- AI planning
- integrations

Core structure:

Goal → Roadmap → Milestones → Tasks/Habits → Evidence → Achievement

---

## ⚠️ Current Build State (read before writing any code)

**Phases 1–11 are fully complete and deployed.** Do NOT re-implement anything below.

### What exists

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Done | Dashboard: stat cards, spending donut, cashflow bars, goal ring, roadmaps, today plan, habits, AI insight, achievements, integrations panel, alerts. Reads real Supabase data. |
| `/finances` | ✅ Done | Accounts grid + last-50 transactions list with delete |
| `/finances/transactions/new` | ✅ Done | Add transaction form (TransactionForm client component) |
| `/goals` | ✅ Done | Goal list with progress bars and status badges |
| `/goals/new` | ✅ Done | Create goal form |
| `/goals/[id]` | ✅ Done | Goal detail: milestones, roadmap |
| `/goals/[id]/edit` | ✅ Done | Edit goal form |
| `/ai-advisor` | ✅ Done | Daily planner: Generate plan button, Accept/Dismiss suggestion cards, calls Claude API |
| `/integrations` | ✅ Done | Connect/disconnect Google (Calendar + Gmail) and GitHub OAuth; shows live calendar events, receipt emails, assigned issues |
| `/api/oauth/google` + `/callback` | ✅ Done | Full Google OAuth flow with AES-256-GCM token encryption |
| `/api/oauth/github` + `/callback` | ✅ Done | Full GitHub OAuth flow |
| `/auth/sign-in`, `/auth/sign-up` | ✅ Done | Supabase auth pages |
| `/[...slug]` | ✅ Done | Coming-soon catch-all for unbuilt routes |

### Supabase tables (all with RLS on `owner_id = auth.uid()`)

```
profiles          — id, workspace_id, name, initials, level, xp, xp_to_next_level, avatar_url
workspaces        — id, name, is_family
workspace_members — id, workspace_id, profile_id, role
goals             — id, owner_id, name, status, target_amount, saved_amount, target_date
roadmaps          — id, goal_id, title, description
milestones        — id, roadmap_id, title, completed, due_date, sort_order, completed_at
tasks             — id, owner_id, goal_id, milestone_id, title, status, priority, scheduled_for, due_date, completed_at
habits            — id, owner_id, goal_id, name, cadence, streak, momentum
habit_completions — id, habit_id, owner_id, completed_on, note
achievements      — id, owner_id, title, description, icon, unlocked, earned_at
categories        — id, name, color, icon, sort_order  (global, public read)
accounts          — id, owner_id, name, type, balance, currency
transactions      — id, owner_id, account_id, category_id, amount, merchant, note, date
integrations      — id, owner_id, provider, access_token (encrypted), refresh_token (encrypted), expires_at, scopes, provider_user_id
```

Types live in `src/lib/supabase/types.ts` — **hand-written**, not generated. Add new rows there when you add tables.

---

## Development Rules

- Build in phases — do not build everything at once
- TypeScript everywhere, strict mode
- Reusable components
- Responsive design (dark sidebar desktop, mobile bottom nav)
- **Run `npx tsc --noEmit && npm run lint && npm run build` before declaring done — all three must be clean**
- After a change set passes verification, commit it and push it to the configured GitHub remote unless the user explicitly says not to push yet
- Do not push unverified changes
- Do not expose private or financial data in logs
- Finance truth comes from stored records, not AI guesses
- AI can suggest, but must not silently change data
- No new backend complexity without approval

---

## Architecture Conventions (follow exactly — do not invent new patterns)

### Auth — always `getUser()`, never `getSession()`
```ts
const supabase = await createClient(); // from @/lib/supabase/server
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/sign-in");
```

### Server actions
```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
// Always call revalidatePath before redirect
```

### Client components that call server actions
```ts
"use client";
import { useTransition } from "react";
// Use startTransition(async () => { await serverAction(...) })
// Never import server-only modules
```

### Nested select type cast pattern
The hand-written `Database` type uses `Relationships: []` so Supabase nested selects
(e.g. `transactions.select("..., categories(id,name,color)")`) return `SelectQueryError`.
Always cast through `unknown`:
```ts
const rows = (rawData ?? []) as unknown as MyType[];
```

### No `lucide-react` icons named `Github` — use `GitBranch` instead
Check `node_modules/lucide-react/dist/esm/icons/` for exact names before using any icon.

### Tailwind design tokens (use these, never raw colors)
```
text-ink / text-ink-soft / text-ink-muted
bg-surface / bg-surface-muted / bg-canvas
border-line
text-positive / text-negative / text-warning
text-brand / bg-brand / bg-brand/10
bg-sidebar / text-sidebar-ink
```

### Component primitives available
```
@/components/ui/card        — Card, CardContent, CardHeader, CardTitle
@/components/ui/button      — Button (size="sm"|"default", variant="outline"|"default")
@/components/ui/badge       — Badge
@/components/ui/progress    — Progress
@/components/ui/empty-state — EmptyState (icon, title, description, action?)
@/components/ui/icon        — Icon (name: lucide icon string)
```

### Charts — Recharts + shared tooltip
```
@/components/dashboard/chart-tooltip — TooltipCard, TooltipRow
Use ResponsiveContainer + the existing chart patterns in cashflow-chart.tsx / spending-donut.tsx
```

### Nav — already wired
`src/config/nav.ts` has `sidebarNav` and `mobileNav`. The `/reports` route is already in the list as `{ label: "Reports", href: "/reports", icon: "BarChart3" }`. Do not touch `nav.ts`.

---

## Phase 12 — Reports & Analytics

**This is the task for this session.** Build the `/reports` page. It must read real data from Supabase (no mock data). No new tables needed.

### Goal

A single `/reports` page that gives the user a consolidated view of their financial health, goal progress, and habit consistency over time. Think "monthly review dashboard."

### Sections to build

#### 1. Finance summary (top)

Three stat cards in a row:
- **Income this month** — sum of positive transactions this month
- **Expenses this month** — sum of negative transactions (absolute value) this month
- **Net savings** — income minus expenses (green if positive, red if negative)

Below that, a **monthly net savings trend** bar chart (last 6 months): bars showing net = income − expenses per month. Use `var(--color-positive)` for positive bars and `var(--color-negative)` for negative bars. Each bar should show the month name (Jan, Feb…) on x-axis and net amount on y-axis. Use Recharts `BarChart`.

#### 2. Top spending categories (this month)

A horizontal bar list (not a chart — simpler): for each category with expenses this month, show:
- Color dot
- Category name
- A `<Progress>` bar (0–100 based on share of total spending)
- Amount on the right

Show max 8 categories, sorted by amount descending.

#### 3. Goal progress overview

A list of all active goals (status ≠ "completed") showing:
- Goal name
- Status badge (`on_track` → positive, `at_risk` → warning, `behind` → negative, `completed` → neutral)
- Progress bar (saved_amount / target_amount × 100, capped at 100)
- `$saved / $target` label if target_amount is set, else just `In progress`
- Days until target_date if set

#### 4. Habit consistency (last 30 days)

For each daily habit, show:
- Habit name
- Streak (🔥 N days — but no emoji unless user requests it, use `Flame` icon instead)
- A 30-dot grid (5 columns × 6 rows) where each dot = one day, filled = completed that day, empty = missed

To get completion data: query `habit_completions` for the last 30 days for all the user's habits.

#### 5. Tasks completed this month

A simple stat: "X tasks completed this month" + a small list of the last 5 completed tasks (title, completed_at date). Query `tasks` where `status = 'done'` and `completed_at >= first of this month`.

### Data fetching strategy

All data fetched in one server component (`src/app/reports/page.tsx`) using `Promise.all`. No client components needed except for charts (which must be `"use client"`).

### Files to create

```
src/app/reports/page.tsx                     — server component, fetches all data
src/components/reports/finance-summary.tsx   — "use client" (contains BarChart)
src/components/reports/category-breakdown.tsx — server-renderable (Progress bars, no chart lib)
src/components/reports/goal-overview.tsx     — server-renderable
src/components/reports/habit-grid.tsx        — server-renderable (30-dot grid via CSS)
src/components/reports/tasks-summary.tsx     — server-renderable
```

### Files to modify

```
src/lib/utils.ts                 — formatCurrency already exists, use it
src/lib/supabase/types.ts        — no changes needed (all tables already typed)
```

Do NOT modify `src/config/nav.ts`, `src/app/page.tsx`, or any existing component.

### Props shape for each component

```ts
// finance-summary.tsx
type FinanceSummaryProps = {
  incomeThisMonth: number;
  expensesThisMonth: number; // positive value
  netThisMonth: number;
  monthlySeries: { month: string; net: number }[]; // last 6 months
};

// category-breakdown.tsx
type CategoryBreakdownProps = {
  categories: { id: string; name: string; color: string; amount: number; percent: number }[];
};

// goal-overview.tsx
type GoalOverviewProps = {
  goals: {
    id: string;
    name: string;
    status: "on_track" | "at_risk" | "behind" | "completed";
    savedAmount: number;
    targetAmount: number | null;
    targetDate: string | null;
    progress: number; // 0–100
  }[];
};

// habit-grid.tsx
type HabitGridProps = {
  habits: {
    id: string;
    name: string;
    streak: number;
    days: boolean[]; // length 30, index 0 = 30 days ago, index 29 = today
  }[];
};

// tasks-summary.tsx
type TasksSummaryProps = {
  completedCount: number;
  recentTasks: { id: string; title: string; completedAt: string }[];
};
```

### Data queries to write in `page.tsx`

```ts
const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);

const [
  { data: rawTxMonth },      // transactions this month with category join
  { data: rawTxSix },        // transactions last 6 months (amount + date only)
  { data: rawGoals },        // all goals
  { data: rawHabits },       // all daily habits
  { data: rawCompletions },  // habit_completions last 30 days
  { data: rawTasksDone },    // tasks done this month
] = await Promise.all([
  supabase.from("transactions")
    .select("amount, category_id, categories(id, name, color)")
    .gte("date", monthStart),
  supabase.from("transactions")
    .select("amount, date")
    .gte("date", sixMonthsAgo),
  supabase.from("goals").select("*").eq("owner_id", user.id),
  supabase.from("habits").select("*").eq("owner_id", user.id).eq("cadence", "daily"),
  supabase.from("habit_completions")
    .select("habit_id, completed_on")
    .eq("owner_id", user.id)
    .gte("completed_on", thirtyDaysAgo),
  supabase.from("tasks")
    .select("id, title, completed_at")
    .eq("owner_id", user.id)
    .eq("status", "done")
    .gte("completed_at", monthStart + "T00:00:00Z")
    .order("completed_at", { ascending: false })
    .limit(20),
]);
```

Use the same `as unknown as RawType[]` cast for `rawTxMonth` due to nested select.

### Visual spec

- Page header: "Reports" h1, subtitle "Monthly snapshot · [Month Year]"
- Sections separated by `<section>` with a small uppercase heading (same `SectionHeading` pattern as dashboard — just do it inline with a `<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">`)
- Cards use `<Card><CardContent>` from `@/components/ui/card`
- Max width `max-w-4xl` on the outer wrapper
- Responsive: stat cards in a `grid grid-cols-1 sm:grid-cols-3 gap-4`, everything else full-width
- Habit grid dots: `size-2 rounded-full` — `bg-brand` for completed, `bg-line` for missed, laid out in a `grid grid-cols-[repeat(30,_minmax(0,_1fr))] gap-1`

### Finance bar chart spec

Use Recharts `BarChart` with `ResponsiveContainer width="100%" height={180}`. The bar fill should be dynamic per bar value: positive → `var(--color-positive)`, negative → `var(--color-negative)`. Use a Recharts `Cell` on each bar to apply per-bar color. Add a `Tooltip` using the existing `TooltipCard` / `TooltipRow` pattern from `@/components/dashboard/chart-tooltip`.

### `formatCurrency` usage

```ts
import { formatCurrency } from "@/lib/utils";
formatCurrency(1234.56) // → "$1,234.56"
formatCurrency(-50)    // → "-$50.00"  — for net display, pass Math.abs() and add sign manually
```

---

## Verification checklist (run before declaring done)

```bash
npx tsc --noEmit     # must exit 0
npm run lint         # must exit 0, zero errors (warnings acceptable)
npm run build        # must succeed, /reports must appear in the route list
```

Then manually verify:
- `/reports` loads without error when logged in
- Redirects to `/auth/sign-in` when not logged in
- Finance stat cards show correct values (positive income, positive expenses amount, colored net)
- Monthly net bar chart renders with correct colors per bar
- Category breakdown shows at least one category with a filled progress bar
- Habit grid shows 30 dots per habit, filled/empty correctly
- Goal list shows all active goals with progress bars
- Tasks summary shows the completed count

---

## Preferred Stack

- Next.js (App Router, server components by default)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- lucide-react (check icon names before using)
- Recharts
- Supabase (`@supabase/ssr`, `createClient` from `@/lib/supabase/server` in server components)
