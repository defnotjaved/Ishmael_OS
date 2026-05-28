import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { statCards } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function StatCards() {
  return (
    <section
      aria-label="Summary"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
    >
      {statCards.map((card) => {
        const positive = card.trend === "up";
        return (
          <Card key={card.id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <span
                className="flex size-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${card.accent} 14%, white)`,
                  color: card.accent,
                }}
              >
                <Icon name={card.icon} className="size-[18px]" />
              </span>
              {card.delta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    positive ? "text-positive" : "text-negative",
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {card.delta}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-ink-soft">
              {card.label}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">
              {card.value}
            </p>
            {card.hint && (
              <p className="mt-1 text-[11px] text-ink-muted">{card.hint}</p>
            )}
          </Card>
        );
      })}
    </section>
  );
}
