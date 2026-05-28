"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ProjectSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  icon: z.string().min(1).max(50).default("FolderKanban"),
});

export async function createProject(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = ProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "active",
    color: formData.get("color") || "#6366f1",
    icon: formData.get("icon") || "FolderKanban",
  });
  if (!parsed.success) return { error: "Invalid project data." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: "Failed to create project." };

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = ProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "active",
    color: formData.get("color") || "#6366f1",
    icon: formData.get("icon") || "FolderKanban",
  });
  if (!parsed.success) return { error: "Invalid project data." };

  const { error } = await supabase
    .from("projects")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: "Failed to update project." };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: "Failed to delete project." };

  revalidatePath("/projects");
  redirect("/projects");
}

export async function addTaskToProject(
  projectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = z.string().min(1).max(300).trim().safeParse(formData.get("title"));
  if (!title.success) return { error: "Invalid task title." };

  const { error } = await supabase.from("tasks").insert({
    owner_id: user.id,
    project_id: projectId,
    title: title.data,
    status: "todo",
    priority: ((formData.get("priority") as string) || "medium") as "high" | "medium" | "low",
  });

  if (error) return { error: "Failed to add task." };

  revalidatePath(`/projects/${projectId}`);
  return {};
}
