import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type VoiceIntent =
  | { type: "add_transaction"; amount: number; merchant: string; note: string; categoryHint: string }
  | { type: "add_project"; name: string; description: string }
  | { type: "add_task"; title: string; priority: "high" | "medium" | "low"; projectName?: string }
  | { type: "unknown"; raw: string };

const TOOL_SCHEMA: Anthropic.Tool = {
  name: "parse_voice_command",
  description:
    "Parse the user's voice command into a structured intent. Choose the best matching type. " +
    "For financial statements like 'I made $X' or 'I spent $X', use add_transaction. " +
    "For project creation like 'let's plan X' or 'add X to projects', use add_project. " +
    "For task creation like 'add task X', use add_task. " +
    "If unsure, use unknown.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["add_transaction", "add_project", "add_task", "unknown"],
        description: "The type of intent",
      },
      amount: { type: "number", description: "Dollar amount (for add_transaction)" },
      merchant: { type: "string", description: "Merchant or source name (for add_transaction)" },
      note: { type: "string", description: "Short note describing the transaction" },
      categoryHint: {
        type: "string",
        description: "Best guess category: Sales, Food, Transport, Shopping, Bills, Health, Entertainment, Other",
      },
      name: { type: "string", description: "Project name (for add_project)" },
      description: { type: "string", description: "Project description (for add_project)" },
      title: { type: "string", description: "Task title (for add_task)" },
      priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority" },
      projectName: { type: "string", description: "Project name to attach task to (for add_task, optional)" },
      raw: { type: "string", description: "Original transcript (for unknown)" },
    },
    required: ["type"],
  },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { transcript?: string };
  if (!body.transcript || typeof body.transcript !== "string") {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const transcript = body.transcript.slice(0, 500);

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 512,
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `Parse this voice command into a structured intent: "${transcript}"`,
      },
    ],
  });

  const toolUse = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    return NextResponse.json({ intent: { type: "unknown", raw: transcript } });
  }

  const input = toolUse.input as Record<string, unknown>;
  let intent: VoiceIntent;

  if (input.type === "add_transaction") {
    intent = {
      type: "add_transaction",
      amount: typeof input.amount === "number" ? input.amount : 0,
      merchant: typeof input.merchant === "string" ? input.merchant : "",
      note: typeof input.note === "string" ? input.note : transcript,
      categoryHint: typeof input.categoryHint === "string" ? input.categoryHint : "Other",
    };
  } else if (input.type === "add_project") {
    intent = {
      type: "add_project",
      name: typeof input.name === "string" ? input.name : transcript,
      description: typeof input.description === "string" ? input.description : "",
    };
  } else if (input.type === "add_task") {
    intent = {
      type: "add_task",
      title: typeof input.title === "string" ? input.title : transcript,
      priority: (input.priority as "high" | "medium" | "low") ?? "medium",
      projectName: typeof input.projectName === "string" ? input.projectName : undefined,
    };
  } else {
    intent = { type: "unknown", raw: transcript };
  }

  return NextResponse.json({ intent });
}
