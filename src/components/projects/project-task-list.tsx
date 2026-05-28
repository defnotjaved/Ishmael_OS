"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Check, Trash2, Circle, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateTaskStatus, deleteTask } from "@/app/tasks/actions";
import { addTaskToProject } from "@/app/projects/actions";
import type { TaskPriority, TaskStatus } from "@/lib/types";

type ProjectTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
};

const PRIORITY_META: Record<TaskPriority, { tone: "negative" | "warning" | "neutral"; label: string }> = {
  high:   { tone: "negative", label: "High" },
  medium: { tone: "warning",  label: "Med" },
  low:    { tone: "neutral",  label: "Low" },
};

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: ProjectTask;
  onToggle: (id: string, current: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "done";
  return (
    <div className="flex items-center gap-3 py-3 group">
      <button
        onClick={() => onToggle(task.id, task.status)}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          done ? "border-positive bg-positive text-white" : "border-line hover:border-brand"
        )}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done && <Check className="size-3.5" />}
        {!done && task.status === "in_progress" && <Circle className="size-2.5 fill-brand text-brand" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", done ? "text-ink-muted line-through" : "text-ink")}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-ink-muted mt-0.5">
            Due {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <Badge tone={PRIORITY_META[task.priority].tone} className="shrink-0">
        {PRIORITY_META[task.priority].label}
      </Badge>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted hover:text-red-500 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
        aria-label="Delete task"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function AddTaskForm({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      await addTaskToProject(projectId, fd);
      form.reset();
      setOpen(false);
      onAdded();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Plus className="size-4" /> Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-brand/40 bg-brand/5 p-3 space-y-2">
      <input
        name="title"
        autoFocus
        required
        placeholder="Task title…"
        maxLength={300}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted outline-none"
      />
      <div className="flex items-center gap-2">
        <select
          name="priority"
          defaultValue="medium"
          className="text-xs text-ink bg-surface border border-line rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <div className="flex gap-1.5 ml-auto">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function ProjectTaskList({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: ProjectTask[];
}) {
  const [tasks, setTasks] = useOptimistic(initialTasks);
  const [, startTransition] = useTransition();
  const [version, setVersion] = useState(0);

  function handleToggle(id: string, current: TaskStatus) {
    const next: TaskStatus = current === "done" ? "todo" : "done";
    startTransition(async () => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
      await updateTaskStatus(id, next);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await deleteTask(id);
    });
  }

  const todo = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface divide-y divide-line">
        {tasks.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">No tasks yet.</p>
        )}
        {todo.map((task) => (
          <div key={task.id} className="px-4">
            <TaskRow task={task} onToggle={handleToggle} onDelete={handleDelete} />
          </div>
        ))}
        {done.length > 0 && (
          <>
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-ink-muted">Completed · {done.length}</p>
            </div>
            {done.map((task) => (
              <div key={task.id} className="px-4">
                <TaskRow task={task} onToggle={handleToggle} onDelete={handleDelete} />
              </div>
            ))}
          </>
        )}
      </div>
      <AddTaskForm projectId={projectId} onAdded={() => setVersion((v) => v + 1)} key={version} />
    </div>
  );
}
