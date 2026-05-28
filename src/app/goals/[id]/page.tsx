import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MilestoneList } from "@/components/goals/milestone-list";
import { createClient } from "@/lib/supabase/server";
import { computeProgress, deriveStatus } from "@/lib/goals";
import { formatCurrency } from "@/lib/utils";
import { deleteGoal } from "@/app/goals/actions";

const statusMeta = {
  on_track: { label: "On track", tone: "positive" as const },
  at_risk: { label: "At risk", tone: "warning" as const },
  behind: { label: "Behind", tone: "negative" as const },
  completed: { label: "Completed", tone: "neutral" as const },
};

type Props = { params: Promise<{ id: string }> };

export default async function GoalDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const { data: goal } = await supabase
    .from("goals")
    .select(
      `id, name, target_amount, saved_amount, target_date, created_at,
       roadmaps(id, title, milestones(id, title, completed, due_date, sort_order, completed_at))`,
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!goal) notFound();

  type RoadmapWithMilestones = {
    id: string;
    title: string;
    milestones: {
      id: string;
      title: string;
      completed: boolean;
      due_date: string | null;
      sort_order: number;
      completed_at: string | null;
    }[];
  };

  const roadmap = (goal.roadmaps as unknown as RoadmapWithMilestones[])?.[0] ?? null;
  const milestones = roadmap
    ? [...roadmap.milestones].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const progress = computeProgress(
    milestones.length,
    milestones.filter((m) => m.completed).length,
  );
  const status = deriveStatus(progress, goal.target_date);
  const meta = statusMeta[status];

  async function handleDelete() {
    "use server";
    await deleteGoal(id);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ChevronLeft className="size-4" /> Goals
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-ink">{goal.name}</h1>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/goals/${id}/edit`}>
              <Button variant="outline" size="icon" aria-label="Edit goal">
                <Pencil className="size-4" />
              </Button>
            </Link>
            <form action={handleDelete}>
              <Button
                variant="outline"
                size="icon"
                type="submit"
                aria-label="Delete goal"
                className="text-red-500 hover:text-red-600 hover:border-red-300"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Progress card */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Overall progress</span>
            <span className="font-semibold text-ink text-lg">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span>
              <span className="font-medium text-ink">{milestones.filter((m) => m.completed).length}</span> of{" "}
              <span className="font-medium text-ink">{milestones.length}</span> milestones complete
            </span>
            {goal.target_amount && (
              <span>
                Target:{" "}
                <span className="font-medium text-ink">{formatCurrency(goal.target_amount)}</span>
              </span>
            )}
            {goal.target_date && (
              <span>
                Due:{" "}
                <span className="font-medium text-ink">
                  {new Date(goal.target_date).toLocaleDateString()}
                </span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones card */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {roadmap ? (
            <MilestoneList roadmapId={roadmap.id} milestones={milestones} />
          ) : (
            <p className="text-sm text-ink-muted">No roadmap found for this goal.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
