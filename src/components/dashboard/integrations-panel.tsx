import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Provider } from "@/lib/integrations/token-store";

type IntegrationDef = {
  id: string;
  name: string;
  icon: string;
  provider: Provider | null; // null = coming soon
};

const INTEGRATIONS: IntegrationDef[] = [
  { id: "google", name: "Google", icon: "CalendarDays", provider: "google" },
  { id: "github", name: "GitHub", icon: "GitBranch", provider: "github" },
  { id: "notion", name: "Notion", icon: "FileText", provider: null },
  { id: "slack", name: "Slack", icon: "MessageSquare", provider: null },
  { id: "linear", name: "Linear", icon: "Layers", provider: null },
  { id: "relay", name: "Relay", icon: "Zap", provider: null },
];

type Props = {
  connectedProviders: Provider[];
};

export function IntegrationsPanel({ connectedProviders }: Props) {
  const connectedCount = INTEGRATIONS.filter(
    (i) => i.provider && connectedProviders.includes(i.provider)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <span className="text-xs text-ink-soft">{connectedCount} connected</span>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INTEGRATIONS.map((int) => {
          const isConnected = int.provider !== null && connectedProviders.includes(int.provider);
          const isAvailable = int.provider !== null;

          return (
            <Link
              key={int.id}
              href="/integrations"
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
                <Icon name={int.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {int.name}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    isConnected
                      ? "text-positive"
                      : isAvailable
                      ? "text-ink-muted"
                      : "text-ink-muted opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isConnected
                        ? "bg-positive"
                        : isAvailable
                        ? "bg-ink-muted"
                        : "bg-ink-muted opacity-60"
                    )}
                  />
                  {isConnected ? "Connected" : isAvailable ? "Connect" : "Coming soon"}
                </span>
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
