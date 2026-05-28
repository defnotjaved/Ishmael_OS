import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value: number;
  indicatorClassName?: string;
  trackClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  trackClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-muted",
        trackClassName,
        className,
      )}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-brand transition-all", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
