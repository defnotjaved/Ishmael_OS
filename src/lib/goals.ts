import type { GoalStatus } from "@/lib/types";

export function computeProgress(total: number, completed: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function deriveStatus(progress: number, targetDate: string | null): GoalStatus {
  if (progress >= 100) return "completed";
  if (!targetDate) return "on_track";
  const today = new Date();
  const target = new Date(targetDate);
  if (target < today) return "behind";
  const daysLeft = Math.floor((target.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft <= 30 && progress < 75) return "at_risk";
  return "on_track";
}
