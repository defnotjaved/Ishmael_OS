"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type DailySuggestion = {
  title: string;
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  reason: string;
  type: "task" | "habit" | "goal_action";
};

// Zod schemas for validation
const SuggestionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  priority: z.enum(["high", "medium", "low"]),
  estimatedMinutes: z.number().int().min(1).max(480),
  reason: z.string().min(1).max(500).trim(),
  type: z.enum(["task", "habit", "goal_action"]),
});

const AiResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema).max(6),
});

async function buildContext(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: goals }, { data: tasks }, { data: habits }] =
    await Promise.all([
      supabase
        .from("goals")
        .select("name, status")
        .eq("owner_id", userId)
        .neq("status", "completed")
        .limit(10),
      supabase
        .from("tasks")
        .select("title, priority, status")
        .eq("owner_id", userId)
        .neq("status", "done")
        .or(`scheduled_for.eq.${today},scheduled_for.is.null`)
        .limit(20),
      supabase
        .from("habits")
        .select("name, cadence, streak")
        .eq("owner_id", userId)
        .eq("cadence", "daily")
        .limit(10),
    ]);

  return {
    today,
    goals: goals ?? [],
    tasks: tasks ?? [],
    habits: habits ?? [],
  };
}

const SYSTEM_PROMPT = `You are a personal productivity AI for Ishmael HQ.
Given the user's active goals, pending tasks, and daily habits, suggest a focused daily plan.
Respond ONLY with valid JSON matching this schema:
{
  "suggestions": [
    {
      "title": string,
      "priority": "high" | "medium" | "low",
      "estimatedMinutes": number,
      "reason": string,
      "type": "task" | "habit" | "goal_action"
    }
  ]
}
Rules:
- Return 3–6 suggestions maximum.
- Each title should be a concrete, actionable item (verb + object), max 200 characters.
- estimatedMinutes should be a realistic integer (1–480).
- reason should be one short sentence explaining why this matters today, max 500 characters.
- Do not reference financial data or amounts.
- Prioritize habits with active streaks and tasks that are overdue or high priority.`;

function buildUserMessage(ctx: Awaited<ReturnType<typeof buildContext>>): string {
  const cap = (s: string, max: number) => s.slice(0, max);

  const goalLines = ctx.goals.length
    ? ctx.goals.map((g) => `- ${cap(JSON.stringify(g.name), 200)} [${g.status}]`).join("\n")
    : "None";

  const taskLines = ctx.tasks.length
    ? ctx.tasks.map((t) => `- ${cap(JSON.stringify(t.title), 200)} [priority: ${t.priority}, status: ${t.status}]`).join("\n")
    : "None";

  const habitLines = ctx.habits.length
    ? ctx.habits.map((h) => `- ${cap(JSON.stringify(h.name), 200)} [streak: ${h.streak} days]`).join("\n")
    : "None";

  return `Today is ${ctx.today}.

Active goals (${ctx.goals.length}):
${goalLines}

Pending tasks (${ctx.tasks.length}):
${taskLines}

Daily habits (${ctx.habits.length}):
${habitLines}

Generate my prioritized daily plan.`;
}

export async function generateDailyPlan(): Promise<{
  suggestions?: DailySuggestion[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "AI service not configured." };

  const ctx = await buildContext(user.id);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(ctx) }],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") {
      return { error: "Unexpected response from AI." };
    }

    // Strip potential markdown fences before parsing
    const raw = block.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "AI returned an unreadable response. Please try again." };
    }

    const validated = AiResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return { error: "AI response did not match expected format. Please try again." };
    }

    return { suggestions: validated.data.suggestions };
  } catch (err) {
    // Log message only — no user data, no context payload
    console.error("[ai-advisor] generateDailyPlan failed:", err instanceof Error ? err.message : "unknown error");
    return { error: "Failed to generate plan. Please try again." };
  }
}

export async function acceptSuggestion(suggestion: unknown): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Validate incoming payload — never trust client-supplied data
  const validated = SuggestionSchema.safeParse(suggestion);
  if (!validated.success) return { error: "Invalid suggestion data." };

  const { title, priority } = validated.data;
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("tasks").insert({
    owner_id: user.id,
    title,
    priority,
    status: "todo",
    scheduled_for: today,
  });

  if (error) {
    console.error("[ai-advisor] acceptSuggestion insert failed:", error.code);
    return { error: "Failed to add task. Please try again." };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}
