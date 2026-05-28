// Hand-written DB types for Phase 7 tables.
// Run `supabase gen types` in Phase 8 once schema stabilises.

type WorkspaceRow = {
  id: string;
  name: string;
  is_family: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  workspace_id: string | null;
  name: string;
  initials: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  profile_id: string;
  role: "owner" | "member";
  joined_at: string;
};

type GoalRow = {
  id: string;
  owner_id: string;
  workspace_id: string | null;
  name: string;
  status: "on_track" | "at_risk" | "behind" | "completed";
  target_amount: number | null;
  saved_amount: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

type RoadmapRow = {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type MilestoneRow = {
  id: string;
  roadmap_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  owner_id: string;
  goal_id: string | null;
  milestone_id: string | null;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  scheduled_for: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type HabitRow = {
  id: string;
  owner_id: string;
  goal_id: string | null;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  streak: number;
  momentum: number;
  created_at: string;
  updated_at: string;
};

type HabitCompletionRow = {
  id: string;
  habit_id: string;
  owner_id: string;
  completed_on: string;
  note: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
};

type AccountRow = {
  id: string;
  owner_id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "cash";
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  owner_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  note: string | null;
  merchant: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

type IntegrationRow = {
  id: string;
  owner_id: string;
  provider: "google" | "github";
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | null;
  provider_user_id: string | null;
  connected_at: string;
  updated_at: string;
};

type AchievementRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  icon: string;
  unlocked: boolean;
  earned_at: string | null;
  created_at: string;
};

type TableDef<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      workspaces:        TableDef<WorkspaceRow>;
      profiles:          TableDef<ProfileRow>;
      workspace_members: TableDef<WorkspaceMemberRow>;
      goals:             TableDef<GoalRow>;
      roadmaps:          TableDef<RoadmapRow>;
      milestones:        TableDef<MilestoneRow>;
      tasks:             TableDef<TaskRow>;
      habits:            TableDef<HabitRow>;
      habit_completions: TableDef<HabitCompletionRow>;
      achievements:      TableDef<AchievementRow>;
      categories:        TableDef<CategoryRow>;
      accounts:          TableDef<AccountRow>;
      transactions:      TableDef<TransactionRow>;
      integrations:      TableDef<IntegrationRow>;
    };
    Views: Record<string, never>;
    Functions: {
      seed_demo_data: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
