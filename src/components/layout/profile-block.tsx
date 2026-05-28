import { Progress } from "@/components/ui/progress";

type ProfileBlockProps = {
  name: string;
  initials: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export function ProfileBlock({
  name,
  initials,
  level,
  xp,
  xpToNextLevel,
}: ProfileBlockProps) {
  const pct = xpToNextLevel > 0 ? Math.round((xp / xpToNextLevel) * 100) : 0;

  return (
    <div className="rounded-xl bg-sidebar-soft/60 p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-sidebar-muted">Level {level}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-sidebar-muted">
          <span>XP</span>
          <span>
            {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()}
          </span>
        </div>
        <Progress
          value={pct}
          trackClassName="bg-sidebar h-1.5"
          indicatorClassName="bg-gradient-to-r from-brand to-chart-6"
        />
      </div>
    </div>
  );
}
