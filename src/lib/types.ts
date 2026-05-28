/**
 * Domain types for Ishmael HQ.
 *
 * These mirror the intended Supabase tables. The relationship chain
 * Goal -> Roadmap -> Milestone -> Task/Habit -> Achievement is expressed
 * through id references so the data model is explicit before any DB work.
 * Each `*Id` field becomes a foreign key; `ownerId`/`workspaceId` anticipate
 * per-user and per-family (workspace) isolation with row level security.
 */

export type ID = string;

export type GoalStatus = "on_track" | "at_risk" | "behind" | "completed";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type Cadence = "daily" | "weekly" | "monthly";
export type IntegrationStatus = "connected" | "available" | "error";
export type AlertSeverity = "info" | "warning" | "critical";
export type TrendDirection = "up" | "down";

export interface Workspace {
  id: ID;
  name: string;
  isFamily: boolean;
}

export interface UserProfile {
  id: ID;
  workspaceId: ID;
  name: string;
  initials: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface Category {
  id: ID;
  name: string;
  /** css color token, e.g. var(--color-chart-1) */
  color: string;
}

export interface Transaction {
  id: ID;
  ownerId: ID;
  categoryId: ID;
  amount: number;
  date: string; // ISO
  merchant: string;
}

export interface Bill {
  id: ID;
  ownerId: ID;
  name: string;
  amount: number;
  dueDate: string; // ISO
  recurring: boolean;
}

export interface Goal {
  id: ID;
  ownerId: ID;
  name: string;
  status: GoalStatus;
  targetAmount: number;
  savedAmount: number;
  progress: number; // 0-100
  targetDate?: string;
}

export interface Roadmap {
  id: ID;
  goalId: ID;
  title: string;
  progress: number; // 0-100
}

export interface Milestone {
  id: ID;
  roadmapId: ID;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Task {
  id: ID;
  ownerId: ID;
  goalId?: ID;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  time?: string; // display time, e.g. "09:00"
}

export interface Habit {
  id: ID;
  ownerId: ID;
  goalId?: ID;
  name: string;
  cadence: Cadence;
  streak: number;
  momentum: number; // 0-100 momentum score
  /** completion for the last 7 days, oldest first */
  week: boolean[];
}

export interface Achievement {
  id: ID;
  ownerId: ID;
  title: string;
  description: string;
  icon: string; // lucide icon name
  earnedAt?: string;
  unlocked: boolean;
}

export interface Integration {
  id: ID;
  name: string;
  status: IntegrationStatus;
  description: string;
  icon: string; // lucide icon name
}

export interface Insight {
  id: ID;
  title: string;
  body: string;
  category: "finance" | "goal" | "habit" | "planning";
}

export interface Alert {
  id: ID;
  title: string;
  detail: string;
  severity: AlertSeverity;
  icon: string; // lucide icon name
}

export interface StatCard {
  id: ID;
  label: string;
  value: string;
  delta?: string;
  trend?: TrendDirection;
  hint?: string;
  icon: string; // lucide icon name
  accent: string; // css color token
}
