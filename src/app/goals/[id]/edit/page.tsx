import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { GoalForm } from "@/components/goals/goal-form";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditGoalPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const { data: goal } = await supabase
    .from("goals")
    .select("id, name, target_amount, target_date")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!goal) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href={`/goals/${id}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ChevronLeft className="size-4" /> {goal.name}
        </Link>
        <h1 className="text-2xl font-bold text-ink">Edit goal</h1>
      </div>
      <GoalForm
        mode="edit"
        goalId={id}
        defaultValues={{
          name: goal.name,
          targetAmount: goal.target_amount,
          targetDate: goal.target_date,
        }}
      />
    </div>
  );
}
