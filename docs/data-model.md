# Phase 6 — Supabase Data Model Plan

**Status:** Plan only. No migrations, no client code. Phase 7 implements the MVP subset.

---

## Design principles

- All PKs: `uuid DEFAULT gen_random_uuid()`
- Timestamps: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()` where rows mutate
- Enums: `text` columns with `CHECK` constraints (avoids `ALTER TYPE` pain during schema evolution)
- Money: `numeric(15,2)` — no floating point
- Computed fields (progress, streak, momentum) are derived at query time or via triggers; not stored redundantly except where caching is warranted
- Encrypted secrets (`access_token_enc`, `refresh_token_enc`) must use `pgcrypto` or Vault — raw tokens never in plaintext columns
- RLS enforced on every table; no table is publicly readable

---

## Tables

### 1. `workspaces`

Personal workspace (one per user at signup) or family workspace (shared).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `name` | `text NOT NULL` | e.g. "Ishmael's Space", "Javed Family" |
| `is_family` | `boolean DEFAULT false` | gates family-sharing features |
| `created_at` | `timestamptz DEFAULT now()` | |

---

### 2. `profiles`

Extends `auth.users`. One profile per auth user; auto-created on sign-up via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK REFERENCES auth.users(id) ON DELETE CASCADE` | |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | personal workspace |
| `name` | `text NOT NULL` | "Ishmael B." |
| `initials` | `char(2)` | "IB" |
| `level` | `integer DEFAULT 1` | gamification level |
| `xp` | `integer DEFAULT 0` | current XP |
| `xp_to_next_level` | `integer DEFAULT 1000` | threshold for next level |
| `avatar_url` | `text` | storage bucket URL |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 3. `workspace_members`

Junction enabling family sharing. Owner + invited members all appear here.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `workspace_id` | `uuid REFERENCES workspaces(id) ON DELETE CASCADE` | |
| `profile_id` | `uuid REFERENCES profiles(id) ON DELETE CASCADE` | |
| `role` | `text CHECK (role IN ('owner', 'member'))` | |
| `joined_at` | `timestamptz DEFAULT now()` | |

**Unique:** `(workspace_id, profile_id)`

---

### 4. `categories`

Spending categories, shared at the workspace level.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `workspace_id` | `uuid REFERENCES workspaces(id) ON DELETE CASCADE` | |
| `name` | `text NOT NULL` | "Housing", "Food & Dining" |
| `color` | `text` | hex or CSS token |
| `sort_order` | `integer DEFAULT 0` | display order |
| `created_at` | `timestamptz DEFAULT now()` | |

---

### 5. `goals`

Core motivation unit. Personal by default; can be shared with a family workspace.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | null = personal, set = shared |
| `name` | `text NOT NULL` | |
| `status` | `text CHECK (status IN ('on_track', 'at_risk', 'behind', 'completed'))` | |
| `target_amount` | `numeric(15,2)` | null if not financial |
| `saved_amount` | `numeric(15,2) DEFAULT 0` | |
| `target_date` | `date` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

**Computed at query time:** `progress = round(saved_amount / target_amount * 100)`

---

### 6. `roadmaps`

One roadmap per goal. The execution plan.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `goal_id` | `uuid REFERENCES goals(id) ON DELETE CASCADE` | |
| `title` | `text NOT NULL` | |
| `description` | `text` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

**Computed at query time:** `progress = count(completed milestones) / count(all milestones) * 100`

---

### 7. `milestones`

Steps within a roadmap. Completion drives roadmap progress.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `roadmap_id` | `uuid REFERENCES roadmaps(id) ON DELETE CASCADE` | |
| `title` | `text NOT NULL` | |
| `completed` | `boolean DEFAULT false` | |
| `due_date` | `date` | |
| `sort_order` | `integer DEFAULT 0` | ordering within roadmap |
| `completed_at` | `timestamptz` | set when `completed` flips to true |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 8. `tasks`

Discrete actionable items. Optional links to goal and/or milestone.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `goal_id` | `uuid REFERENCES goals(id) ON DELETE SET NULL` | nullable |
| `milestone_id` | `uuid REFERENCES milestones(id) ON DELETE SET NULL` | nullable |
| `title` | `text NOT NULL` | |
| `status` | `text CHECK (status IN ('todo', 'in_progress', 'done'))` | |
| `priority` | `text CHECK (priority IN ('high', 'medium', 'low'))` | |
| `scheduled_for` | `timestamptz` | replaces the string `time` field from mock data |
| `due_date` | `date` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 9. `habits`

Recurring behaviors. Optional goal linkage.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `goal_id` | `uuid REFERENCES goals(id) ON DELETE SET NULL` | nullable |
| `name` | `text NOT NULL` | |
| `cadence` | `text CHECK (cadence IN ('daily', 'weekly', 'monthly'))` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

**Computed from `habit_completions`:**
- `streak` — consecutive days/periods with a completion log
- `momentum` — rolling 30-day completion rate (0–100)
- `week[]` — last 7 days' completion booleans

---

### 10. `habit_completions`

One row per habit per completion date. The source of truth for streak/momentum.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `habit_id` | `uuid REFERENCES habits(id) ON DELETE CASCADE` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor (denormalised for fast filter) |
| `completed_on` | `date NOT NULL` | date only, no time |
| `note` | `text` | optional log note |
| `created_at` | `timestamptz DEFAULT now()` | |

**Unique:** `(habit_id, completed_on)`

---

### 11. `accounts`

Bank, savings, investment, credit accounts. Manual-entry first; sync added in Phase 11.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | null = personal; set = joint/family account |
| `name` | `text NOT NULL` | "Chase Checking" |
| `type` | `text CHECK (type IN ('checking', 'savings', 'investment', 'credit', 'loan'))` | |
| `balance` | `numeric(15,2) DEFAULT 0` | current balance |
| `institution` | `text` | "Chase", "Vanguard" |
| `currency` | `char(3) DEFAULT 'USD'` | ISO 4217 |
| `is_manual` | `boolean DEFAULT true` | false when API-synced (Phase 11) |
| `last_synced_at` | `timestamptz` | null if manual |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 12. `transactions`

Financial transactions. Positive = income, negative = expense.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `account_id` | `uuid REFERENCES accounts(id) ON DELETE CASCADE` | |
| `category_id` | `uuid REFERENCES categories(id) ON DELETE SET NULL` | nullable |
| `amount` | `numeric(15,2) NOT NULL` | positive = income, negative = expense |
| `date` | `date NOT NULL` | |
| `merchant` | `text` | |
| `note` | `text` | |
| `is_recurring` | `boolean DEFAULT false` | links to a bill if true |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 13. `bills`

Recurring bills and subscriptions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | for household bills |
| `name` | `text NOT NULL` | "Mortgage", "Internet" |
| `amount` | `numeric(15,2) NOT NULL` | |
| `due_date` | `date NOT NULL` | next due date |
| `recurring` | `boolean DEFAULT true` | |
| `cadence` | `text CHECK (cadence IN ('weekly', 'monthly', 'quarterly', 'annual'))` | |
| `category_id` | `uuid REFERENCES categories(id) ON DELETE SET NULL` | |
| `paid` | `boolean DEFAULT false` | reset each period |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

---

### 14. `achievements`

Unlockable badges. Seeded with the achievement catalog; rows unlocked by triggers or server functions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `title` | `text NOT NULL` | |
| `description` | `text` | |
| `icon` | `text` | lucide icon name |
| `unlocked` | `boolean DEFAULT false` | |
| `earned_at` | `timestamptz` | null until unlocked |
| `created_at` | `timestamptz DEFAULT now()` | |

---

### 15. `integrations`

Per-workspace OAuth connections. Tokens encrypted at rest.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `workspace_id` | `uuid REFERENCES workspaces(id) ON DELETE CASCADE` | |
| `provider` | `text NOT NULL` | 'gmail', 'gcal', 'github', 'relay', 'notion' |
| `status` | `text CHECK (status IN ('connected', 'available', 'error'))` | |
| `description` | `text` | |
| `icon` | `text` | lucide icon name |
| `access_token_enc` | `text` | pgcrypto/Vault encrypted — never plaintext |
| `refresh_token_enc` | `text` | |
| `token_expires_at` | `timestamptz` | |
| `config` | `jsonb DEFAULT '{}'` | provider-specific settings (scopes, webhook IDs, etc.) |
| `last_synced_at` | `timestamptz` | |
| `created_at` | `timestamptz DEFAULT now()` | |
| `updated_at` | `timestamptz DEFAULT now()` | |

**Unique:** `(workspace_id, provider)`

---

### 16. `ai_insights`

AI-generated suggestions. Users approve or dismiss; AI cannot silently modify data.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | |
| `title` | `text NOT NULL` | |
| `body` | `text NOT NULL` | |
| `category` | `text CHECK (category IN ('finance', 'goal', 'habit', 'planning'))` | |
| `approved` | `boolean` | null = pending, true = accepted, false = dismissed |
| `generated_at` | `timestamptz DEFAULT now()` | |
| `expires_at` | `timestamptz` | stale insights auto-hidden |
| `created_at` | `timestamptz DEFAULT now()` | |

---

### 17. `alerts`

System-generated alerts (overdue bills, blocked tasks, habit drops, integration errors).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PK` | |
| `owner_id` | `uuid REFERENCES profiles(id)` | RLS anchor |
| `workspace_id` | `uuid REFERENCES workspaces(id)` | |
| `title` | `text NOT NULL` | |
| `detail` | `text` | |
| `severity` | `text CHECK (severity IN ('info', 'warning', 'critical'))` | |
| `icon` | `text` | lucide icon name |
| `dismissed` | `boolean DEFAULT false` | |
| `dismissed_at` | `timestamptz` | |
| `created_at` | `timestamptz DEFAULT now()` | |

---

## Indexes

```sql
-- Goals
CREATE INDEX ON goals (owner_id);
CREATE INDEX ON goals (workspace_id);
CREATE INDEX ON goals (status);

-- Roadmaps / Milestones
CREATE INDEX ON roadmaps (goal_id);
CREATE INDEX ON milestones (roadmap_id);
CREATE INDEX ON milestones (roadmap_id, completed);

-- Tasks
CREATE INDEX ON tasks (owner_id);
CREATE INDEX ON tasks (owner_id, status);
CREATE INDEX ON tasks (goal_id);
CREATE INDEX ON tasks (scheduled_for);

-- Habits + Completions
CREATE INDEX ON habits (owner_id);
CREATE INDEX ON habit_completions (habit_id, completed_on);
CREATE INDEX ON habit_completions (owner_id, completed_on);

-- Finance
CREATE INDEX ON transactions (owner_id, date DESC);
CREATE INDEX ON transactions (account_id);
CREATE INDEX ON transactions (category_id);
CREATE INDEX ON accounts (owner_id);
CREATE INDEX ON bills (owner_id, due_date);

-- Alerts (partial: only undismissed rows)
CREATE INDEX ON alerts (owner_id) WHERE dismissed = false;

-- Insights (partial: only unresolved rows)
CREATE INDEX ON ai_insights (owner_id) WHERE approved IS NULL;

-- Workspace membership
CREATE INDEX ON workspace_members (profile_id);
```

---

## Row Level Security strategy

### Personal data (owner_id = auth.uid())

These tables contain data that is never shared across users, even within a family workspace:

- `tasks`, `habit_completions`, `achievements`, `transactions`, `ai_insights`

Policy pattern:
```sql
CREATE POLICY "owner only" ON tasks
  USING (owner_id = auth.uid());
```

### Optionally shared data (personal by default, shareable by workspace)

- `goals` — personal unless `workspace_id` is a family workspace the user belongs to
- `habits` — personal; streak data is private
- `accounts` — personal unless flagged as a joint account within a family workspace
- `bills`, `alerts` — personal or household

Policy pattern for goals:
```sql
CREATE POLICY "owner or workspace member" ON goals
  USING (
    owner_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()
    )
  );
```

### Workspace-level data (any member can read)

- `categories`, `integrations`

Policy pattern:
```sql
CREATE POLICY "workspace members" ON categories
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()
    )
  );
```

### Profiles

Readable by workspace members (for family name display). Writable only by self.

```sql
CREATE POLICY "read own or workspace member profiles" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
```

### Critical isolation rule

Family members must never see each other's:
- `transactions` (financial privacy)
- `habits` / `habit_completions` (personal behavior)
- `ai_insights` (AI analysis of personal data)
- `achievements` (personal progress)

These are enforced by `owner_id = auth.uid()` policies only — no workspace passthrough.

---

## Computed fields

These are **not stored** as columns; computed at query time or in server functions:

| Field | Source | Computation |
|-------|--------|-------------|
| `goals.progress` | `goals` | `ROUND(saved_amount / NULLIF(target_amount, 0) * 100)` |
| `roadmaps.progress` | `milestones` | `COUNT(*) FILTER (WHERE completed) / NULLIF(COUNT(*), 0) * 100` |
| `habits.streak` | `habit_completions` | consecutive days counting back from today |
| `habits.momentum` | `habit_completions` | completions in last 30 days / 30 × 100 |
| `habits.week` | `habit_completions` | last 7 `completed_on` dates vs today's week |
| Net worth | `accounts` | `SUM(balance)` across all accounts |
| Cash available | `accounts` | `SUM(balance)` WHERE type IN ('checking', 'savings') |
| Goal funding % | `goals` | weighted: `SUM(saved_amount) / SUM(target_amount) * 100` |

---

## Private vs shared data summary

| Table | Isolation | Shared with family? |
|-------|-----------|---------------------|
| `profiles` | workspace members (read), self (write) | Name/level only |
| `goals` | owner or workspace members | Yes (opt-in) |
| `roadmaps` / `milestones` | via goal RLS | Follows goal |
| `tasks` | owner only | Never |
| `habits` | owner only | Never |
| `habit_completions` | owner only | Never |
| `accounts` | owner or workspace members | Yes (joint accounts) |
| `transactions` | owner only | Never |
| `bills` | owner or workspace members | Yes (household) |
| `categories` | workspace members | Yes |
| `achievements` | owner only | Never |
| `integrations` | workspace members | Yes (shared OAuth) |
| `ai_insights` | owner only | Never |
| `alerts` | owner or workspace members | Depends on source |

---

## Migration order

Dependencies listed; each phase must land before the next:

**Tier 1 — Identity & workspace**
1. `workspaces`
2. `profiles` (requires auth.users + workspaces)
3. `workspace_members` (requires workspaces + profiles)

**Tier 2 — Goals spine (Phase 7 MVP)**
4. `goals`
5. `roadmaps`
6. `milestones`
7. `tasks`
8. `habits`
9. `habit_completions`

**Tier 3 — Finance (Phase 9)**
10. `categories`
11. `accounts`
12. `transactions`
13. `bills`

**Tier 4 — Engagement layer**
14. `achievements` (can land with Tier 2, seeded with catalog)

**Tier 5 — AI + Integrations (Phase 10–11)**
15. `ai_insights`
16. `alerts`
17. `integrations`

---

## Phase 7 MVP scope

Implement only Tier 1 + Tier 2 + achievements seed:

- Supabase Auth (email/password)
- Auto-create `workspaces` + `profiles` + `workspace_members` on sign-up via trigger
- CRUD: goals, roadmaps, milestones, tasks, habits, habit_completions
- Seed data mirroring mock-data.ts for Ishmael B.
- RLS on all Phase 7 tables
- Loading states for all dashboard panels that read live data
- Run `security-reviewer` before merge

Finance, AI, integrations, and family sharing all deferred.

---

## Deferred decisions

- **Account sync (Plaid/Teller):** Phase 11. Until then, all account data is manual entry.
- **Token encryption:** Vault vs `pgcrypto`. Evaluate at Phase 11 when integrations land.
- **Full-text search on transactions/tasks:** `pg_trgm` index if needed; defer until usage data shows it's worth it.
- **Audit log:** add `audit_log` table in Phase 9 before any finance mutations touch prod.
- **Multi-currency:** `currency` column is reserved; conversion logic deferred.
- **Family invitation flow:** `workspace_members` table is ready; invite email flow is Phase 7+.
- **XP/level triggers:** seed with current values; auto-increment via Postgres trigger in Phase 8.
