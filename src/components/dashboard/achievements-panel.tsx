import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type AchievementRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  unlocked: boolean;
};

export type ProfileSummary = {
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export function AchievementsPanel({
  achievements,
  profile,
}: {
  achievements: AchievementRow[];
  profile: ProfileSummary;
}) {
  const xpPct = Math.round((profile.xp / profile.xpToNextLevel) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
          Level {profile.level}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
            <span>XP to Level {profile.level + 1}</span>
            <span className="tabular-nums">
              {profile.xp.toLocaleString()} /{" "}
              {profile.xpToNextLevel.toLocaleString()}
            </span>
          </div>
          <Progress
            value={xpPct}
            indicatorClassName="bg-gradient-to-r from-brand to-chart-6"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              title={a.description ?? undefined}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center",
                a.unlocked
                  ? "border-line bg-surface"
                  : "border-dashed border-line bg-surface-muted/50 opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  a.unlocked
                    ? "bg-brand-soft text-brand"
                    : "bg-surface-muted text-ink-muted",
                )}
              >
                <Icon name={a.icon} className="size-[18px]" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-ink">
                {a.title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
