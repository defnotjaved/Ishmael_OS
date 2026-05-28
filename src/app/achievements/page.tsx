import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const [{ data: achievements }, { data: profile }] = await Promise.all([
    supabase
      .from("achievements")
      .select("id, title, description, icon, unlocked, earned_at")
      .eq("owner_id", user.id)
      .order("unlocked", { ascending: false })
      .order("title"),
    supabase
      .from("profiles")
      .select("level, xp, xp_to_next_level, name")
      .eq("id", user.id)
      .single(),
  ]);

  const rows = achievements ?? [];
  const unlocked = rows.filter((a) => a.unlocked);
  const locked = rows.filter((a) => !a.unlocked);
  const xpPct = profile
    ? Math.min(Math.round((profile.xp / profile.xp_to_next_level) * 100), 100)
    : 0;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
          <Trophy className="size-5 text-ink-soft" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Achievements</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {unlocked.length} of {rows.length} unlocked
          </p>
        </div>
      </div>

      {/* XP / Level card */}
      {profile && (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted font-medium">Current level</p>
              <p className="text-2xl font-bold text-ink">{profile.level}</p>
            </div>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
              Level {profile.level}
            </span>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-ink-muted">
              <span>XP to Level {profile.level + 1}</span>
              <span className="tabular-nums">
                {profile.xp.toLocaleString()} / {profile.xp_to_next_level.toLocaleString()}
              </span>
            </div>
            <Progress value={xpPct} indicatorClassName="bg-gradient-to-r from-brand to-violet-500" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <EmptyState
          icon="Trophy"
          title="No achievements yet"
          description="Complete goals, build habits, and log activity to earn achievements."
        />
      )}

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Unlocked · {unlocked.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {unlocked.map((a) => (
              <div
                key={a.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon name={a.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-ink-muted mt-0.5 leading-snug">{a.description}</p>
                  )}
                  {a.earned_at && (
                    <p className="text-[11px] text-ink-muted mt-1.5 tabular-nums">
                      {new Date(a.earned_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Locked · {locked.length}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {locked.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-surface-muted/40 p-4 text-center opacity-60",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                  <Icon name={a.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-ink-muted mt-0.5 leading-snug">{a.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
