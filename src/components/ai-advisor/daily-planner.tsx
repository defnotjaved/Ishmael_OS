"use client";

import { useState, useTransition } from "react";
import { Sparkles, Clock, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateDailyPlan, acceptSuggestion } from "@/app/ai-advisor/actions";
import type { DailySuggestion } from "@/app/ai-advisor/actions";

const PRIORITY_COLORS: Record<DailySuggestion["priority"], string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type SuggestionState = DailySuggestion & {
  _key: string;
  _accepting: boolean;
  _done: boolean;
};

function SuggestionCard({
  s,
  onAccept,
  onDismiss,
}: {
  s: SuggestionState;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (s._done) return null;

  return (
    <Card className="transition-all">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[s.priority]}`}>
                {s.priority}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <Clock className="size-3" />
                {s.estimatedMinutes}m
              </span>
            </div>
            <p className="text-sm font-medium text-ink">{s.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">{s.reason}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <button
              onClick={onAccept}
              disabled={s._accepting}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={`Accept: ${s.title}`}
            >
              {s._accepting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              Accept
            </button>
            <button
              onClick={onDismiss}
              disabled={s._accepting}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={`Dismiss: ${s.title}`}
            >
              <X className="size-3" />
              Dismiss
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyPlanner() {
  const [suggestions, setSuggestions] = useState<SuggestionState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateDailyPlan();
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuggestions(
        (result.suggestions ?? []).map((s, i) => ({
          ...s,
          _key: `${Date.now()}-${i}`,
          _accepting: false,
          _done: false,
        }))
      );
      setGenerated(true);
    });
  }

  function handleAccept(key: string, s: DailySuggestion) {
    setSuggestions((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, _accepting: true } : item
      )
    );
    startTransition(async () => {
      const result = await acceptSuggestion(s);
      if (result.error) {
        setSuggestions((prev) =>
          prev.map((item) =>
            item._key === key ? { ...item, _accepting: false } : item
          )
        );
        setError(result.error);
        return;
      }
      setSuggestions((prev) =>
        prev.map((item) =>
          item._key === key ? { ...item, _accepting: false, _done: true } : item
        )
      );
    });
  }

  function handleDismiss(key: string) {
    setSuggestions((prev) =>
      prev.map((item) => (item._key === key ? { ...item, _done: true } : item))
    );
  }

  const visible = suggestions.filter((s) => !s._done);

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Daily Plan</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            AI-suggested priorities for today, based on your goals, tasks, and habits.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {generated ? "Regenerate" : "Generate plan"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Suggestions */}
      {visible.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s._key}
              s={s}
              onAccept={() => handleAccept(s._key, s)}
              onDismiss={() => handleDismiss(s._key)}
            />
          ))}
        </div>
      )}

      {/* Empty state after all dismissed/accepted */}
      {generated && visible.length === 0 && !isPending && (
        <div className="rounded-lg border border-dashed border-line py-10 text-center">
          <p className="text-sm text-ink-muted">
            All suggestions handled. Regenerate to get a fresh plan.
          </p>
        </div>
      )}

      {/* Idle state */}
      {!generated && !isPending && !error && (
        <div className="rounded-lg border border-dashed border-line py-10 text-center">
          <Sparkles className="mx-auto size-8 text-ink-muted mb-2" />
          <p className="text-sm font-medium text-ink">Ready to plan your day</p>
          <p className="text-xs text-ink-muted mt-1">
            Click &ldquo;Generate plan&rdquo; to get AI-powered suggestions.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-ink-muted">
        Suggestions are based on your tasks, habits, and goals. Accepting a suggestion adds it as a scheduled task.
        AI cannot modify or delete existing data.
      </p>
    </div>
  );
}
