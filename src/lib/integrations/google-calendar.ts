import { getValidGoogleToken } from "@/lib/integrations/token-store";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO date/time
  end: string;
  isAllDay: boolean;
  location: string | null;
  htmlLink: string;
};

type GCalEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
};

export async function fetchUpcomingEvents(userId: string, days = 7): Promise<CalendarEvent[]> {
  const token = await getValidGoogleToken(userId);
  if (!token) return [];

  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", until.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "20");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { items?: GCalEvent[] };

  return (json.items ?? []).map((e) => {
    const isAllDay = !!e.start?.date;
    return {
      id: e.id,
      title: e.summary ?? "(No title)",
      start: e.start?.dateTime ?? e.start?.date ?? now.toISOString(),
      end: e.end?.dateTime ?? e.end?.date ?? now.toISOString(),
      isAllDay,
      location: e.location ?? null,
      htmlLink: e.htmlLink ?? "",
    };
  });
}
