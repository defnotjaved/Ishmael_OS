import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectTaskList } from "@/components/projects/project-task-list";

const STATUS_META = {
  active:    { label: "Active",    tone: "neutral" as const },
  paused:    { label: "Paused",    tone: "warning" as const },
  completed: { label: "Completed", tone: "neutral" as const },
  archived:  { label: "Archived",  tone: "neutral" as const },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("project_id", id)
    .eq("owner_id", user.id)
    .order("status")
    .order("created_at");

  const rows = tasks ?? [];
  const done = rows.filter((t) => t.status === "done").length;
  const pct = rows.length > 0 ? Math.round((done / rows.length) * 100) : 0;
  const meta = STATUS_META[project.status as keyof typeof STATUS_META] ?? STATUS_META.active;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: project.color + "22", color: project.color }}
          >
            <Icon name={project.icon} className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{project.name}</h1>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            {project.description && (
              <p className="text-sm text-ink-muted mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <Link
          href={`/projects/${id}/edit`}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-ink hover:border-brand/40 transition-colors"
        >
          <Pencil className="size-3.5" /> Edit
        </Link>
      </div>

      {/* Progress */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{done} / {rows.length} tasks complete</span>
            <span className="tabular-nums font-medium">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: project.color }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {rows.length === 0 ? (
        <EmptyState
          icon="ListChecks"
          title="No tasks yet"
          description="Add tasks to start tracking work on this project."
        />
      ) : null}

      <ProjectTaskList projectId={id} initialTasks={rows} />
    </div>
  );
}
