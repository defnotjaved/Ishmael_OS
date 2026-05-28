"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const CreateHabitSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  cadence: z.enum(["daily", "weekly", "monthly"]),
});

export async function createHabit(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const parsed = CreateHabitSchema.safeParse({
    name: formData.get("name"),
    cadence: formData.get("cadence"),
  });
  if (!parsed.success) return { error: "Invalid habit data." };

  const { error } = await supabase.from("habits").insert({
    owner_id: user.id,
    name: parsed.data.name,
    cadence: parsed.data.cadence,
    streak: 0,
    momentum: 0,
  });

  if (error) return { error: "Failed to create habit." };

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function logHabitCompletion(habitId: string, date: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  // Upsert — idempotent
  const { error } = await supabase.from("habit_completions").upsert(
    { habit_id: habitId, owner_id: user.id, completed_on: date },
    { onConflict: "habit_id,completed_on" }
  );

  if (error) return { error: "Failed to log completion." };

  // Recalculate streak: count consecutive days ending today
  const today = new Date().toISOString().slice(0, 10);
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("completed_on")
    .eq("habit_id", habitId)
    .eq("owner_id", user.id)
    .order("completed_on", { ascending: false })
    .limit(365);

  const doneSet = new Set((completions ?? []).map((c) => c.completed_on));
  let streak = 0;
  const cursor = new Date(today);
  while (doneSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  await supabase
    .from("habits")
    .update({ streak, momentum: Math.min(streak * 5, 100), updated_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("owner_id", user.id);

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function unlogHabitCompletion(habitId: string, date: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  await supabase
    .from("habit_completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("owner_id", user.id)
    .eq("completed_on", date);

  // Recalculate streak after removal
  const today = new Date().toISOString().slice(0, 10);
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("completed_on")
    .eq("habit_id", habitId)
    .eq("owner_id", user.id)
    .order("completed_on", { ascending: false })
    .limit(365);

  const doneSet = new Set((completions ?? []).map((c) => c.completed_on));
  let streak = 0;
  const cursor = new Date(today);
  while (doneSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  await supabase
    .from("habits")
    .update({ streak, momentum: Math.min(streak * 5, 100), updated_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("owner_id", user.id);

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function deleteHabit(habitId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.from("habits").delete().eq("id", habitId).eq("owner_id", user.id);

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}
