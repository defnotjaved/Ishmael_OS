import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function EmptyState({
  title,
  description,
  icon = "LayoutDashboard",
  action,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon name={icon} className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-soft">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
