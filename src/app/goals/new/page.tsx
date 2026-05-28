import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GoalForm } from "@/components/goals/goal-form";

export default function NewGoalPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ChevronLeft className="size-4" /> Goals
        </Link>
        <h1 className="text-2xl font-bold text-ink">New goal</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Give your goal a name, an optional financial target, and a deadline.
        </p>
      </div>
      <GoalForm mode="create" />
    </div>
  );
}
