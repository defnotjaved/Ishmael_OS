"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  initials: z.string().min(1).max(4).trim(),
});

export async function updateProfile(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    initials: formData.get("initials"),
  });
  if (!parsed.success) return { error: "Invalid profile data." };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      initials: parsed.data.initials.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to save profile." };

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
