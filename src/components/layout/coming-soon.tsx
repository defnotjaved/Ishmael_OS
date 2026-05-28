import { EmptyState } from "@/components/ui/empty-state";

export function ComingSoon({
  title,
  icon = "LayoutDashboard",
}: {
  title: string;
  icon?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 items-center justify-center py-16">
      <EmptyState
        title={title}
        icon={icon}
        description="This module is coming in a future phase. The dashboard is the first piece of Ishmael HQ — finances, goals, tasks, habits and AI planning will connect here next."
      />
    </div>
  );
}
