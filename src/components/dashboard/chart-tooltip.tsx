import type { ReactNode } from "react";

export function TooltipCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      {title && <p className="mb-1 font-medium text-ink">{title}</p>}
      {children}
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2 text-ink-soft">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="capitalize">{label}</span>
      <span className="ml-auto font-medium text-ink">{value}</span>
    </p>
  );
}
