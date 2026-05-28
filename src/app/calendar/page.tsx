import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingEvents } from "@/lib/integrations/google-calendar";
import { EventList } from "@/components/calendar/event-list";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: integration } = await supabase
    .from("integrations")
    .select("id")
    .eq("owner_id", user.id)
    .eq("provider", "google")
    .maybeSingle();

  const isConnected = !!integration;

  let events = null;
  let fetchError = false;

  if (isConnected) {
    try {
      events = await fetchUpcomingEvents(user.id, 14);
    } catch {
      fetchError = true;
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
          <Calendar className="size-5 text-ink-soft" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendar</h1>
          <p className="text-sm text-ink-muted mt-0.5">Your upcoming events from Google Calendar.</p>
        </div>
      </div>

      {!isConnected && (
        <EmptyState
          icon="Calendar"
          title="Google Calendar not connected"
          description="Connect your Google account to see upcoming events."
          action={
            <Link
              href="/integrations"
              className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Connect Google
            </Link>
          }
        />
      )}

      {isConnected && fetchError && (
        <EmptyState
          icon="Calendar"
          title="Could not load events"
          description="Try reconnecting Google."
          action={
            <Link
              href="/integrations"
              className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Reconnect Google
            </Link>
          }
        />
      )}

      {isConnected && !fetchError && events !== null && events.length === 0 && (
        <EmptyState
          icon="Calendar"
          title="No upcoming events"
          description="No upcoming events in the next 14 days."
        />
      )}

      {isConnected && !fetchError && events && events.length > 0 && (
        <EventList events={events} />
      )}
    </div>
  );
}
