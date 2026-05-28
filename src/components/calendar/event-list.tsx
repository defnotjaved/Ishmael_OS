import { ExternalLink } from "lucide-react";
import type { CalendarEvent } from "@/lib/integrations/google-calendar";

function formatTime(iso: string, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(events: CalendarEvent[]): { label: string; events: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const dayKey = event.start.slice(0, 10);
    if (!map.has(dayKey)) map.set(dayKey, []);
    map.get(dayKey)!.push(event);
  }
  return Array.from(map.entries()).map(([key, evts]) => ({
    label: formatDayLabel(key + "T00:00:00"),
    events: evts,
  }));
}

export function EventList({ events }: { events: CalendarEvent[] }) {
  const groups = groupByDay(events);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide py-2">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-line bg-surface p-4 flex items-start gap-3"
              >
                <span className="text-xs text-ink-muted tabular-nums w-28 shrink-0 pt-0.5">
                  {event.isAllDay
                    ? "All day"
                    : `${formatTime(event.start, false)} – ${formatTime(event.end, false)}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{event.title}</p>
                  {event.location && (
                    <p className="text-xs text-ink-muted mt-0.5 truncate">{event.location}</p>
                  )}
                </div>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in Google Calendar"
                    className="shrink-0 text-ink-muted hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
