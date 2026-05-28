import Link from "next/link";
import { redirect } from "next/navigation";
import { Blocks, CalendarDays, GitBranch, Mail, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listConnectedProviders } from "@/lib/integrations/token-store";
import { fetchUpcomingEvents } from "@/lib/integrations/google-calendar";
import { fetchRecentReceipts } from "@/lib/integrations/gmail";
import { fetchAssignedIssues } from "@/lib/integrations/github";
import { DisconnectButton } from "@/components/integrations/disconnect-button";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const { connected: justConnected, error: oauthError } = await searchParams;

  const connected = await listConnectedProviders(user.id);
  const googleConnected = connected.includes("google");
  const githubConnected = connected.includes("github");

  // Fetch live data only for connected providers
  const [calendarEvents, gmailReceipts, githubIssues] = await Promise.all([
    googleConnected ? fetchUpcomingEvents(user.id) : Promise.resolve([]),
    googleConnected ? fetchRecentReceipts(user.id) : Promise.resolve([]),
    githubConnected ? fetchAssignedIssues(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Blocks className="size-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Integrations</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Connect external services to bring your data into Ishmael HQ.
          </p>
        </div>
      </div>

      {/* Flash messages */}
      {justConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="size-4 shrink-0" />
          {justConnected === "google" ? "Google" : "GitHub"} connected successfully.
        </div>
      )}
      {oauthError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {decodeURIComponent(oauthError)}
        </div>
      )}

      {/* Integration cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Available integrations
        </h2>

        {/* Google */}
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
              <CalendarDays className="size-5 text-ink-soft" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">Google (Calendar + Gmail)</p>
              <p className="text-xs text-ink-muted">
                Read upcoming events and scan for receipt emails.
              </p>
              {googleConnected && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-positive font-medium">
                  <CheckCircle2 className="size-3" /> Connected
                </span>
              )}
            </div>
            {googleConnected ? (
              <DisconnectButton provider="google" />
            ) : (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/api/oauth/google">
                <Button size="sm" variant="outline">Connect</Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
              <GitBranch className="size-5 text-ink-soft" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">GitHub</p>
              <p className="text-xs text-ink-muted">
                See open issues assigned to you alongside your tasks.
              </p>
              {githubConnected && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-positive font-medium">
                  <CheckCircle2 className="size-3" /> Connected
                </span>
              )}
            </div>
            {githubConnected ? (
              <DisconnectButton provider="github" />
            ) : (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/api/oauth/github">
                <Button size="sm" variant="outline">Connect</Button>
              </a>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Google Calendar events */}
      {googleConnected && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Upcoming events — next 7 days
          </h2>
          {calendarEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">No upcoming events.</p>
          ) : (
            <Card>
              <CardContent className="pt-0 divide-y divide-line">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center gap-3">
                    <CalendarDays className="size-4 shrink-0 text-ink-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{ev.title}</p>
                      <p className="text-xs text-ink-muted">
                        {ev.isAllDay
                          ? new Date(ev.start).toLocaleDateString()
                          : new Date(ev.start).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-ink transition-colors"
                      aria-label="Open in Google Calendar"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Gmail receipts */}
      {googleConnected && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Recent receipt emails
          </h2>
          <p className="text-xs text-ink-muted -mt-1">
            Found via Gmail search. Import as a transaction from the{" "}
            <Link href="/finances/transactions/new" className="underline">
              add transaction
            </Link>{" "}
            page.
          </p>
          {gmailReceipts.length === 0 ? (
            <p className="text-sm text-ink-muted">No recent receipts found.</p>
          ) : (
            <Card>
              <CardContent className="pt-0 divide-y divide-line">
                {gmailReceipts.map((r) => (
                  <div key={r.id} className="py-3 flex items-start gap-3">
                    <Mail className="size-4 shrink-0 text-ink-muted mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{r.subject}</p>
                      <p className="text-xs text-ink-muted truncate">{r.from}</p>
                    </div>
                    <p className="text-xs text-ink-muted shrink-0">
                      {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* GitHub issues */}
      {githubConnected && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Open issues assigned to you
          </h2>
          {githubIssues.length === 0 ? (
            <p className="text-sm text-ink-muted">No open issues assigned to you.</p>
          ) : (
            <Card>
              <CardContent className="pt-0 divide-y divide-line">
                {githubIssues.map((issue) => (
                  <div key={issue.id} className="py-3 flex items-start gap-3">
                    <GitBranch className="size-4 shrink-0 text-ink-muted mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-ink hover:text-brand transition-colors truncate block"
                      >
                        {issue.title}
                      </a>
                      <p className="text-xs text-ink-muted">
                        {issue.repoName} · #{issue.number}
                      </p>
                      {issue.labels.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {issue.labels.slice(0, 3).map((l) => (
                            <span
                              key={l}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-muted text-ink-muted"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-ink transition-colors shrink-0"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
