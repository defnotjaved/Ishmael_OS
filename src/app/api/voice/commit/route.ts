import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TransactionPayload = z.object({
  action: z.literal("add_transaction"),
  amount: z.number().positive(),
  merchant: z.string().max(200),
  note: z.string().max(500),
  categoryHint: z.string().max(100),
  type: z.enum(["income", "expense"]).default("income"),
  accountId: z.string().uuid().optional(),
});

const ProjectPayload = z.object({
  action: z.literal("add_project"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
});

const TaskPayload = z.object({
  action: z.literal("add_task"),
  title: z.string().min(1).max(300),
  priority: z.enum(["high", "medium", "low"]),
  projectName: z.string().max(200).optional(),
});

const CommitPayload = z.discriminatedUnion("action", [
  TransactionPayload,
  ProjectPayload,
  TaskPayload,
]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CommitPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "add_transaction") {
    // Look up category by name (case-insensitive)
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .ilike("name", data.categoryHint);

    const categoryId = categories?.[0]?.id ?? null;
    const signedAmount = data.type === "expense"
      ? -Math.abs(data.amount)
      : Math.abs(data.amount);

    const { error } = await supabase.from("transactions").insert({
      owner_id: user.id,
      amount: signedAmount,
      merchant: data.merchant || null,
      note: data.note || null,
      category_id: categoryId,
      account_id: data.accountId ?? null,
      date: new Date().toISOString().slice(0, 10),
    });

    if (error) return NextResponse.json({ error: "Failed to save transaction." }, { status: 500 });

    revalidatePath("/finances");
    revalidatePath("/");
    return NextResponse.json({ success: true, categoryFound: !!categoryId });
  }

  if (data.action === "add_project") {
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: data.name,
        description: data.description || null,
      })
      .select("id")
      .single();

    if (error || !project) return NextResponse.json({ error: "Failed to create project." }, { status: 500 });

    revalidatePath("/projects");
    return NextResponse.json({ success: true, projectId: project.id });
  }

  if (data.action === "add_task") {
    let projectId: string | null = null;

    if (data.projectName) {
      const { data: proj } = await supabase
        .from("projects")
        .select("id")
        .eq("owner_id", user.id)
        .ilike("name", `%${data.projectName}%`)
        .limit(1)
        .maybeSingle();
      projectId = proj?.id ?? null;
    }

    const { error } = await supabase.from("tasks").insert({
      owner_id: user.id,
      title: data.title,
      priority: data.priority,
      status: "todo",
      project_id: projectId,
    });

    if (error) return NextResponse.json({ error: "Failed to create task." }, { status: 500 });

    revalidatePath("/tasks");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  }
}
