"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createGoal, updateGoal } from "@/app/goals/actions";

type GoalFormProps = {
  mode: "create" | "edit";
  goalId?: string;
  defaultValues?: {
    name?: string;
    targetAmount?: number | null;
    targetDate?: string | null;
  };
};

export function GoalForm({ mode, goalId, defaultValues }: GoalFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);

    const result =
      mode === "create"
        ? await createGoal(formData)
        : await updateGoal(goalId!, formData);

    // redirect() throws inside server actions — non-redirect errors return { error }
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    }
  }

  const cancelHref = mode === "edit" && goalId ? `/goals/${goalId}` : "/goals";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="name">
          Goal name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="e.g. Emergency fund, Buy a house"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="target_amount">
          Target amount <span className="text-xs font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="target_amount"
          name="target_amount"
          type="number"
          min={0}
          step={0.01}
          defaultValue={defaultValues?.targetAmount ?? ""}
          placeholder="e.g. 10000"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="target_date">
          Target date <span className="text-xs font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="target_date"
          name="target_date"
          type="date"
          defaultValue={defaultValues?.targetDate ?? ""}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create goal"
              : "Save changes"}
        </Button>
        <Button variant="outline" type="button" onClick={() => router.push(cancelHref)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
