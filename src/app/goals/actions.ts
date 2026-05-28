"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createGoal(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = formData.get("target_amount")
    ? Number(formData.get("target_amount"))
    : null;
  const targetDate = formData.get("target_date")
    ? String(formData.get("target_date"))
    : null;

  if (!name) return { error: "Goal name is required" };

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({ owner_id: user.id, name, target_amount: targetAmount, target_date: targetDate })
    .select("id")
    .single();

  if (goalError || !goal) return { error: goalError?.message ?? "Failed to create goal" };

  // Auto-create a roadmap for this goal
  await supabase.from("roadmaps").insert({ goal_id: goal.id, title: name });

  revalidatePath("/goals");
  redirect(`/goals/${goal.id}`);
}

export async function updateGoal(goalId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = formData.get("target_amount")
    ? Number(formData.get("target_amount"))
    : null;
  const targetDate = formData.get("target_date")
    ? String(formData.get("target_date"))
    : null;

  if (!name) return { error: "Goal name is required" };

  const { error } = await supabase
    .from("goals")
    .update({ name, target_amount: targetAmount, target_date: targetDate })
    .eq("id", goalId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
  redirect(`/goals/${goalId}`);
}

export async function deleteGoal(goalId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  await supabase.from("goals").delete().eq("id", goalId).eq("owner_id", user.id);

  revalidatePath("/goals");
  redirect("/goals");
}

export async function toggleMilestone(milestoneId: string, completed: boolean) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("milestones")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId);

  if (error) return { error: error.message };

  revalidatePath("/goals");
  return { success: true };
}

export async function createMilestone(roadmapId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const title = String(formData.get("title") ?? "").trim();
  const dueDate = formData.get("due_date") ? String(formData.get("due_date")) : null;

  if (!title) return { error: "Milestone title is required" };

  // Determine next sort_order
  const { count } = await supabase
    .from("milestones")
    .select("*", { count: "exact", head: true })
    .eq("roadmap_id", roadmapId);

  const { error } = await supabase.from("milestones").insert({
    roadmap_id: roadmapId,
    title,
    due_date: dueDate,
    sort_order: (count ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/goals");
  return { success: true };
}

export async function deleteMilestone(milestoneId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) return { error: error.message };

  revalidatePath("/goals");
  return { success: true };
}
