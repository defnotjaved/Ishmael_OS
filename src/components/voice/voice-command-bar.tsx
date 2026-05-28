"use client";

import { useRouter } from "next/navigation";
import { VoiceButton } from "./voice-button";

type CommitPayload =
  | { action: "add_transaction"; amount: number; merchant: string; note: string; categoryHint: string }
  | { action: "add_project"; name: string; description: string }
  | { action: "add_task"; title: string; priority: string; projectName?: string };

export function VoiceCommandBar({ className }: { className?: string }) {
  const router = useRouter();

  async function handleConfirm(result: CommitPayload) {
    const res = await fetch("/api/voice/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });

    if (!res.ok) {
      const { error } = await res.json() as { error?: string };
      throw new Error(error ?? "Commit failed");
    }

    const data = await res.json() as { projectId?: string };

    // Navigate to new project detail page after creating
    if (result.action === "add_project" && data.projectId) {
      router.push(`/projects/${data.projectId}`);
    } else {
      router.refresh();
    }
  }

  return <VoiceButton onConfirm={handleConfirm} className={className} />;
}
