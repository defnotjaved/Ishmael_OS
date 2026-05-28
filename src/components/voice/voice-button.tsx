"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Mic, MicOff, Loader2, X, Check, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceIntent } from "@/app/api/voice/parse/route";

type Account = { id: string; name: string; type: string };

type Stage =
  | { type: "idle" }
  | { type: "recording" }
  | { type: "processing" }
  | { type: "confirm"; intent: VoiceIntent; transcript: string }
  | { type: "error"; message: string };

type CommitPayload =
  | { action: "add_transaction"; amount: number; merchant: string; note: string; categoryHint: string; type: "income" | "expense"; accountId?: string }
  | { action: "add_project"; name: string; description: string }
  | { action: "add_task"; title: string; priority: string; projectName?: string };

type Props = {
  onConfirm: (result: CommitPayload) => Promise<void>;
  className?: string;
};

export function VoiceButton({ onConfirm, className }: Props) {
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isCommitting, startCommit] = useTransition();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/voice/context")
      .then((r) => r.json())
      .then((d: { accounts?: Account[] }) => setAccounts(d.accounts ?? []))
      .catch(() => {});
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();
      mediaRef.current = recorder;
      setStage({ type: "recording" });
    } catch {
      setStage({ type: "error", message: "Microphone access denied." });
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setStage({ type: "processing" });
  }

  async function processAudio(blob: Blob) {
    setStage({ type: "processing" });
    try {
      const fd = new FormData();
      fd.append("audio", blob);
      const transcribeRes = await fetch("/api/voice/transcribe", { method: "POST", body: fd });
      if (!transcribeRes.ok) throw new Error("Transcription failed");
      const { transcript } = await transcribeRes.json() as { transcript: string };

      if (!transcript?.trim()) {
        setStage({ type: "error", message: "Couldn't hear anything. Try again." });
        return;
      }

      const parseRes = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!parseRes.ok) throw new Error("Parsing failed");
      const { intent } = await parseRes.json() as { intent: VoiceIntent };

      setStage({ type: "confirm", intent, transcript });
    } catch (err) {
      setStage({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function handleConfirm(payload: CommitPayload) {
    startCommit(async () => {
      await onConfirm(payload);
      setStage({ type: "idle" });
    });
  }

  const isRecording = stage.type === "recording";
  const isProcessing = stage.type === "processing" || isCommitting;

  return (
    <div className={cn("relative", className)}>
      {(stage.type === "idle" || stage.type === "recording" || stage.type === "processing") && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : isProcessing
              ? "bg-surface-muted text-ink-muted cursor-not-allowed"
              : "bg-brand text-white hover:bg-brand/90"
          )}
          aria-label={isRecording ? "Stop recording" : "Start voice command"}
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
          {isRecording ? "Stop" : isProcessing ? "Processing…" : "Voice command"}
        </button>
      )}

      {stage.type === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/5 px-4 py-2.5 text-sm text-negative">
          <AlertCircle className="size-4 shrink-0" />
          <span>{stage.message}</span>
          <button onClick={() => setStage({ type: "idle" })} className="ml-auto">
            <X className="size-4" />
          </button>
        </div>
      )}

      {stage.type === "confirm" && (
        <ConfirmCard
          intent={stage.intent}
          transcript={stage.transcript}
          accounts={accounts}
          onConfirm={handleConfirm}
          onDismiss={() => setStage({ type: "idle" })}
          isLoading={isCommitting}
        />
      )}
    </div>
  );
}

function ConfirmCard({
  intent,
  transcript,
  accounts,
  onConfirm,
  onDismiss,
  isLoading,
}: {
  intent: VoiceIntent;
  transcript: string;
  accounts: Account[];
  onConfirm: (payload: CommitPayload) => void;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  const [txType, setTxType] = useState<"income" | "expense">(
    intent.type === "add_transaction"
      ? (transcript.toLowerCase().includes("spent") || transcript.toLowerCase().includes("paid") || transcript.toLowerCase().includes("bought")
          ? "expense"
          : "income")
      : "income"
  );
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");

  function buildPayload(): CommitPayload {
    if (intent.type === "add_transaction") {
      return {
        action: "add_transaction",
        amount: intent.amount,
        merchant: intent.merchant,
        note: intent.note,
        categoryHint: intent.categoryHint,
        type: txType,
        accountId: accountId || undefined,
      };
    }
    if (intent.type === "add_project") {
      return { action: "add_project", name: intent.name, description: intent.description };
    }
    return {
      action: "add_task",
      title: (intent as Extract<VoiceIntent, { type: "add_task" }>).title,
      priority: (intent as Extract<VoiceIntent, { type: "add_task" }>).priority,
      projectName: (intent as Extract<VoiceIntent, { type: "add_task" }>).projectName,
    };
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-surface shadow-sm p-4 space-y-3 min-w-72 max-w-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Heard you say</p>
          <p className="text-sm text-ink-soft italic">&ldquo;{transcript}&rdquo;</p>
        </div>
        <button onClick={onDismiss} className="text-ink-muted hover:text-ink shrink-0">
          <X className="size-4" />
        </button>
      </div>

      <div className="rounded-lg bg-surface-muted p-3 space-y-2.5">
        {intent.type === "add_transaction" && (
          <>
            {/* Income / expense toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTxType("income")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors border",
                  txType === "income"
                    ? "bg-positive/10 border-positive/30 text-positive"
                    : "border-line text-ink-muted hover:text-ink"
                )}
              >
                <TrendingUp className="size-3.5" /> Income
              </button>
              <button
                onClick={() => setTxType("expense")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors border",
                  txType === "expense"
                    ? "bg-negative/10 border-negative/30 text-negative"
                    : "border-line text-ink-muted hover:text-ink"
                )}
              >
                <TrendingDown className="size-3.5" /> Expense
              </button>
            </div>

            <Row label="Amount" value={`$${intent.amount.toLocaleString()}`} highlight />
            {intent.merchant && <Row label="Merchant" value={intent.merchant} />}
            {intent.note && <Row label="Note" value={intent.note} />}
            <Row label="Category" value={intent.categoryHint} />

            {/* Account selector */}
            {accounts.length > 0 && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-ink-muted shrink-0">Account</span>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="text-xs text-ink bg-surface border border-line rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 max-w-[140px]"
                >
                  <option value="">No account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {intent.type === "add_project" && (
          <>
            <Row label="Action" value="Create project" />
            <Row label="Name" value={intent.name} highlight />
            {intent.description && <Row label="Description" value={intent.description} />}
          </>
        )}

        {intent.type === "add_task" && (
          <>
            <Row label="Action" value="Add task" />
            <Row label="Title" value={intent.title} highlight />
            <Row label="Priority" value={intent.priority} />
            {intent.projectName && <Row label="Project" value={intent.projectName} />}
          </>
        )}

        {intent.type === "unknown" && (
          <p className="text-xs text-ink-muted">Couldn&apos;t understand the command. Try again.</p>
        )}
      </div>

      {intent.type !== "unknown" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onConfirm(buildPayload())}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Confirm
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Discard
          </button>
        </div>
      ) : (
        <button onClick={onDismiss} className="text-xs text-brand underline">
          Try again
        </button>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-ink-muted shrink-0">{label}</span>
      <span className={cn("font-medium truncate", highlight ? "text-brand" : "text-ink")}>{value}</span>
    </div>
  );
}
