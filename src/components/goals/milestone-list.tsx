"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleMilestone, createMilestone, deleteMilestone } from "@/app/goals/actions";

type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  sort_order: number;
};

type Props = {
  roadmapId: string;
  milestones: Milestone[];
};

export function MilestoneList({ roadmapId, milestones: initial }: Props) {
  const [milestones, setOptimistic] = useOptimistic(
    initial,
    (state, { id, completed }: { id: string; completed: boolean }) =>
      state.map((m) => (m.id === id ? { ...m, completed } : m)),
  );
  const [, startTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleToggle(milestoneId: string, completed: boolean) {
    startTransition(async () => {
      setOptimistic({ id: milestoneId, completed });
      await toggleMilestone(milestoneId, completed);
    });
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    const formData = new FormData(e.currentTarget);
    const result = await createMilestone(roadmapId, formData);
    if (result && "error" in result) {
      setAddError(result.error ?? null);
    } else {
      formRef.current?.reset();
    }
    setAdding(false);
  }

  async function handleDelete(milestoneId: string) {
    await deleteMilestone(milestoneId);
  }

  return (
    <div className="space-y-3">
      {milestones.length === 0 && (
        <p className="text-sm text-ink-muted py-2">No milestones yet. Add one below.</p>
      )}

      {milestones.map((m) => (
        <div key={m.id} className="flex items-start gap-3 group">
          <input
            type="checkbox"
            id={`ms-${m.id}`}
            checked={m.completed}
            onChange={(e) => handleToggle(m.id, e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
          />
          <label
            htmlFor={`ms-${m.id}`}
            className={`flex-1 cursor-pointer text-sm leading-snug ${
              m.completed ? "line-through text-ink-muted" : "text-ink"
            }`}
          >
            {m.title}
            {m.due_date && (
              <span className="ml-2 text-xs text-ink-muted">
                due {new Date(m.due_date).toLocaleDateString()}
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={() => handleDelete(m.id)}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted hover:text-red-500 focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
            aria-label={`Delete milestone: ${m.title}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}

      {/* Add milestone form */}
      <form ref={formRef} onSubmit={handleAdd} className="flex gap-2 mt-4 pt-4 border-t border-line">
        <input
          name="title"
          type="text"
          required
          placeholder="Add a milestone…"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <input
          name="due_date"
          type="date"
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <Button type="submit" size="sm" disabled={adding}>
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>
      {addError && (
        <p className="text-xs text-red-600">{addError}</p>
      )}
    </div>
  );
}
