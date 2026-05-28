import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/tasks/task-list";
import type { TaskItem } from "@/components/tasks/task-list";

type FilterValue = "all" | "todo" | "in_progress" | "done";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "todo",        label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done",        label: "Done" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { filter: rawFilter } = await searchParams;
  const filter: FilterValue =
    rawFilter === "todo" || rawFilter === "in_progress" || rawFilter === "done"
      ? rawFilter
      : "all";

  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, scheduled_for, due_date")
    .eq("owner_id", user.id)
    .order("status")
    .order("priority")
    .order("created_at", { ascending: false });

  const tasks: TaskItem[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskItem["status"],
    priority: t.priority as TaskItem["priority"],
    scheduledFor: t.scheduled_for ?? null,
    dueDate: t.due_date ?? null,
  }));

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <ListChecks className="size-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Tasks &amp; Plan</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {counts.todo} to do · {counts.in_progress} in progress · {counts.done} done
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-line">
        {FILTERS.map((f) => (
          <a
            key={f.value}
            href={f.value === "all" ? "/tasks" : `/tasks?filter=${f.value}`}
            className={
              filter === f.value
                ? "px-3 py-2 text-sm font-medium text-brand border-b-2 border-brand -mb-px"
                : "px-3 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
            }
          >
            {f.label}
            <span className="ml-1.5 text-xs text-ink-muted">
              {counts[f.value]}
            </span>
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="pt-2 pb-3">
          <TaskList initialTasks={tasks} filter={filter} />
        </CardContent>
      </Card>
    </div>
  );
}
