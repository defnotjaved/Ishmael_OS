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

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300).trim(),
  priority: z.enum(["high", "medium", "low"]),
  scheduled_for: z.string().optional(),
  due_date: z.string().optional(),
});

export async function createTask(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const parsed = CreateTaskSchema.safeParse({
    title: formData.get("title"),
    priority: formData.get("priority"),
    scheduled_for: formData.get("scheduled_for") || undefined,
    due_date: formData.get("due_date") || undefined,
  });
  if (!parsed.success) return { error: "Invalid task data." };

  const { error } = await supabase.from("tasks").insert({
    owner_id: user.id,
    title: parsed.data.title,
    priority: parsed.data.priority,
    status: "todo",
    scheduled_for: parsed.data.scheduled_for ?? null,
    due_date: parsed.data.due_date ?? null,
  });

  if (error) return { error: "Failed to create task." };

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: "todo" | "in_progress" | "done") {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const validStatuses = ["todo", "in_progress", "done"] as const;
  if (!validStatuses.includes(status)) return { error: "Invalid status." };

  const completedAt = status === "done" ? new Date().toISOString() : null;

  await supabase
    .from("tasks")
    .update({ status, completed_at: completedAt, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", user.id);

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  await supabase.from("tasks").delete().eq("id", taskId).eq("owner_id", user.id);

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}
