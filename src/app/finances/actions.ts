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

export async function createTransaction(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const amountRaw = Number(formData.get("amount"));
  const type = String(formData.get("type")); // "income" | "expense"
  const categoryId = String(formData.get("category_id") || "").trim() || null;
  const accountId = String(formData.get("account_id") || "").trim() || null;
  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));

  if (!amountRaw || isNaN(amountRaw)) return { error: "Amount is required" };
  const amount = type === "expense" ? -Math.abs(amountRaw) : Math.abs(amountRaw);

  const { error } = await supabase.from("transactions").insert({
    owner_id: user.id,
    account_id: accountId,
    category_id: categoryId,
    amount,
    merchant,
    note,
    date,
  });

  if (error) return { error: error.message };

  revalidatePath("/finances");
  revalidatePath("/");
  redirect("/finances");
}

export async function deleteTransaction(transactionId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("owner_id", user.id);

  revalidatePath("/finances");
  revalidatePath("/");
  return { success: true };
}

export async function createAccount(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/auth/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "checking");
  const type = (["checking", "savings", "credit", "investment", "cash"].includes(typeRaw)
    ? typeRaw
    : "checking") as "checking" | "savings" | "credit" | "investment" | "cash";
  const balance = Number(formData.get("balance") ?? 0);

  if (!name) return { error: "Account name is required" };

  const { error } = await supabase.from("accounts").insert({
    owner_id: user.id,
    name,
    type,
    balance,
  });

  if (error) return { error: error.message };

  revalidatePath("/finances");
  redirect("/finances");
}
