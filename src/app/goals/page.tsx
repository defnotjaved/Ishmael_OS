import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { computeProgress, deriveStatus } from "@/lib/goals";
import { formatCurrency } from "@/lib/utils";

const statusMeta = {
  on_track: { label: "On track", tone: "positive" as const },
  at_risk: { label: "At risk", tone: "warning" as const },
  behind: { label: "Behind", tone: "negative" as const },
  completed: { label: "Completed", tone: "neutral" as const },
};

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const { data: rawGoals } = await supabase
    .from("goals")
    .select(
      `id, name, target_amount, saved_amount, target_date, created_at,
       roadmaps(id, milestones(id, completed))`,
    )
    .order("created_at", { ascending: false });

  const goals = (rawGoals ?? []).map((g) => {
    const ms = (g.roadmaps as unknown as { id: string; milestones: { id: string; completed: boolean }[] }[])?.[0]?.milestones ?? [];
    const progress = computeProgress(ms.length, ms.filter((m) => m.completed).length);
    return {
      id: g.id,
      name: g.name,
      targetAmount: g.target_amount,
      savedAmount: g.saved_amount,
      targetDate: g.target_date,
      milestoneTotal: ms.length,
      milestoneCompleted: ms.filter((m) => m.completed).length,
      progress,
      status: deriveStatus(progress, g.target_date),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Goals</h1>
          <p className="text-sm text-ink-muted mt-0.5">Track your progress toward what matters most</p>
        </div>
        <Link href="/goals/new">
          <Button>New goal</Button>
        </Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon="Target"
          title="No goals yet"
          description="Create your first goal and break it down into milestones."
          action={
            <Link href="/goals/new">
              <Button>Create goal</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const meta = statusMeta[goal.status];
            return (
              <Link key={goal.id} href={`/goals/${goal.id}`} className="block group outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-xl">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink leading-snug">{goal.name}</p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>

                    <div>
                      <Progress value={goal.progress} className="mb-1.5" />
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <span>
                          {goal.milestoneCompleted} / {goal.milestoneTotal} milestones
                        </span>
                        <span className="font-medium text-ink">{goal.progress}%</span>
                      </div>
                    </div>

                    {(goal.targetAmount || goal.targetDate) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                        {goal.targetAmount && (
                          <span>
                            Target: <span className="text-ink font-medium">{formatCurrency(goal.targetAmount)}</span>
                          </span>
                        )}
                        {goal.targetDate && (
                          <span>
                            By:{" "}
                            <span className="text-ink font-medium">
                              {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
