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

**Phases 1–13 are fully complete and deployed.** Do NOT re-implement anything below.

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
| `/reports` | ✅ Done | Monthly finance summary, category breakdown, goal progress, habit grid (30-day), tasks completed |
| `/tasks` | ✅ Done | Task list with filter tabs (all/todo/in_progress/done), inline add form, optimistic toggle complete, delete |
| `/habits` | ✅ Done | Habit tracker with 7-day weekly grid per habit, log/unlog per day, add/delete habits, streak recalculation |
| `/auth/sign-in`, `/auth/sign-up` | ✅ Done | Supabase auth pages |
| `/settings` | ✅ Done | Profile form (name, initials), sign out, danger zone. Updates `profiles` table. |
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
`src/config/nav.ts` has `sidebarNav` and `mobileNav`. All routes already appear in the nav list. Do not touch `nav.ts`.

---

## Phase 15 — Calendar Page

**This is the task for this session.** Build the `/calendar` page. It shows the user's upcoming Google Calendar events in a clean list layout. The Google OAuth integration already exists — just consume it.

### Goal

A `/calendar` page that fetches and displays the user's upcoming calendar events using the existing `fetchUpcomingEvents` helper from `src/lib/integrations/google-calendar.ts`. If Google is not connected, show a prompt to connect.

### What already exists

- `src/lib/integrations/google-calendar.ts` — `fetchUpcomingEvents(userId, days?)` returns `CalendarEvent[]`
- `CalendarEvent` type: `{ id, title, start, end, location?, htmlLink? }`
- Google OAuth flow at `/api/oauth/google` — already wired
- `src/lib/integrations/token-store.ts` — `getValidGoogleToken` handles refresh automatically

### Sections to build

#### 1. Header
Page header: "Calendar" h1 with `Calendar` icon from lucide-react. Subtitle: "Your upcoming events from Google Calendar."

#### 2. Not connected state
If Google is not connected (no token row for `google`), show an `EmptyState` (from `@/components/ui/empty-state`) with:
- Icon: `Calendar`
- Title: "Google Calendar not connected"
- Description: "Connect your Google account to see upcoming events."
- Action: link to `/integrations` with text "Connect Google"

#### 3. Events list
If connected, call `fetchUpcomingEvents(user.id, 14)` (next 14 days). Display events in a card list:
- Each event row: time range (formatted `h:mm a`), event title (bold), optional location (muted)
- Group by day — show a date header (`"Today"`, `"Tomorrow"`, or `"Mon, Jun 2"` format) above each day's events
- If `fetchUpcomingEvents` throws (token error), catch and show an EmptyState: "Could not load events. Try reconnecting Google."
- If connected but zero events, show EmptyState: "No upcoming events in the next 14 days."

### How to check if Google is connected

```ts
const supabase = await createClient();
const { data: integration } = await supabase
  .from("integrations")
  .select("id")
  .eq("owner_id", user.id)
  .eq("provider", "google")
  .maybeSingle();
const isConnected = !!integration;
```

### Files to create

```
src/app/calendar/page.tsx          — server component, fetches events
src/components/calendar/event-list.tsx — "use client" not needed; pure display component
```

### Visual spec

- Max width `max-w-2xl`
- Day header: `text-xs font-semibold text-ink-muted uppercase tracking-wide py-2`
- Event row: `rounded-xl border border-line bg-surface p-4` with flex layout
  - Left: time range `text-xs text-ink-muted tabular-nums w-28 shrink-0`
  - Center: title `text-sm font-medium text-ink`, location `text-xs text-ink-muted mt-0.5`
  - Right (optional): external link icon linking to `event.htmlLink` (open in new tab, `aria-label="Open in Google Calendar"`)
- Divider between day groups: use spacing only (no `<hr>`)
- The `Calendar` icon is available in lucide-react — verify before use

### Nav entry

`/calendar` is already listed in `src/config/nav.ts` — do not touch `nav.ts`.

---

## Verification checklist (run before declaring done)

```bash
npx tsc --noEmit     # must exit 0
npm run lint         # must exit 0, zero errors (warnings acceptable)
npm run build        # must succeed, /calendar must appear in the route list
```

Then manually verify:
- `/calendar` renders without error (connected or not)
- Not-connected state shows the EmptyState with link to `/integrations`
- Events grouped by day with correct date headers

---

## Preferred Stack

- Next.js (App Router, server components by default)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- lucide-react (check icon names before using)
- Recharts
- Supabase (`@supabase/ssr`, `createClient` from `@/lib/supabase/server` in server components)
