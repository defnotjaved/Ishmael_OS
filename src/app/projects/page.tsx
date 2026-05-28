import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

const STATUS_META = {
  active:    { label: "Active",    tone: "neutral" as const },
  paused:    { label: "Paused",    tone: "warning" as const },
  completed: { label: "Completed", tone: "neutral" as const },
  archived:  { label: "Archived",  tone: "neutral" as const },
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, status, color, icon")
    .eq("owner_id", user.id)
    .order("sort_order")
    .order("created_at");

  const rows = projects ?? [];

  // Task counts per project
  const { data: taskCounts } = await supabase
    .from("tasks")
    .select("project_id, status")
    .eq("owner_id", user.id)
    .not("project_id", "is", null);

  const countMap = new Map<string, { total: number; done: number }>();
  for (const t of taskCounts ?? []) {
    if (!t.project_id) continue;
    const cur = countMap.get(t.project_id) ?? { total: 0, done: 0 };
    cur.total++;
    if (t.status === "done") cur.done++;
    countMap.set(t.project_id, cur);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
            <FolderKanban className="size-5 text-ink-soft" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Projects</h1>
            <p className="text-sm text-ink-muted mt-0.5">{rows.length} project{rows.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-4" /> New project
        </Link>
      </div>

      {rows.length === 0 && (
        <EmptyState
          icon="FolderKanban"
          title="No projects yet"
          description="Create a project to organise tasks and track progress."
          action={
            <Link
              href="/projects/new"
              className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              New project
            </Link>
          }
        />
      )}

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((p) => {
            const counts = countMap.get(p.id) ?? { total: 0, done: 0 };
            const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
            const meta = STATUS_META[p.status as keyof typeof STATUS_META] ?? STATUS_META.active;

            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-xl border border-line bg-surface p-5 hover:border-brand/40 hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: p.color + "22", color: p.color }}
                    >
                      <Icon name={p.icon} className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="text-xs text-ink-muted truncate mt-0.5">{p.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge tone={meta.tone} className="shrink-0 text-[11px]">{meta.label}</Badge>
                </div>

                {counts.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{counts.done} / {counts.total} tasks</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                )}
                {counts.total === 0 && (
                  <p className="text-xs text-ink-muted">No tasks yet</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
