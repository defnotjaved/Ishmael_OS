import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { alerts } from "@/lib/mock-data";
import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityMeta: Record<
  AlertSeverity,
  { wrap: string; icon: string }
> = {
  critical: { wrap: "bg-negative/10", icon: "text-negative" },
  warning: { wrap: "bg-warning/10", icon: "text-warning" },
  info: { wrap: "bg-brand-soft", icon: "text-brand" },
};

export function AlertsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs Attention</CardTitle>
        <span className="rounded-full bg-negative/10 px-2 py-0.5 text-xs font-semibold text-negative">
          {alerts.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {alerts.map((alert) => {
          const meta = severityMeta[alert.severity];
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-xl border border-line p-3"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  meta.wrap,
                )}
              >
                <Icon name={alert.icon} className={cn("size-4", meta.icon)} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{alert.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{alert.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
