"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, FolderKanban, Rocket, Code2, BookOpen, Lightbulb, Target, Briefcase, Layers, Globe, Music, Camera, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProject, updateProject, deleteProject } from "@/app/projects/actions";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

const ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: "FolderKanban", Icon: FolderKanban },
  { name: "Rocket",       Icon: Rocket },
  { name: "Code2",        Icon: Code2 },
  { name: "BookOpen",     Icon: BookOpen },
  { name: "Lightbulb",    Icon: Lightbulb },
  { name: "Target",       Icon: Target },
  { name: "Briefcase",    Icon: Briefcase },
  { name: "Layers",       Icon: Layers },
  { name: "Globe",        Icon: Globe },
  { name: "Music",        Icon: Music },
  { name: "Camera",       Icon: Camera },
  { name: "Dumbbell",     Icon: Dumbbell },
];

type ProjectData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string;
  icon: string;
};

export function ProjectForm({ project }: { project?: ProjectData }) {
  const router = useRouter();
  const isEdit = !!project;

  const [color, setColor] = useState(project?.color ?? "#6366f1");
  const [icon, setIcon] = useState(project?.icon ?? "FolderKanban");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    fd.set("icon", icon);

    startTransition(async () => {
      const result = isEdit
        ? await updateProject(project.id, fd)
        : await createProject(fd);

      if (result?.error) setFeedback(result.error);
    });
  }

  function handleDelete() {
    if (!project) return;
    startDelete(async () => {
      await deleteProject(project.id);
    });
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
  const labelCls = "text-xs font-medium text-ink-muted mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelCls}>Project name</label>
        <input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={project?.name ?? ""}
          placeholder="e.g. Launch new product"
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelCls}>Description <span className="text-ink-muted/60">(optional)</span></label>
        <textarea
          id="description"
          name="description"
          maxLength={1000}
          rows={3}
          defaultValue={project?.description ?? ""}
          placeholder="What is this project about?"
          className={inputCls + " resize-none"}
        />
      </div>

      {/* Status */}
      {isEdit && (
        <div>
          <label htmlFor="status" className={labelCls}>Status</label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? "active"}
            className={inputCls}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {/* Color */}
      <div>
        <p className={labelCls}>Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? c : "transparent",
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <p className={labelCls}>Icon</p>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(({ name: ic, Icon }) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className="flex size-9 items-center justify-center rounded-lg border transition-colors"
              style={{
                borderColor: icon === ic ? color : "var(--color-line)",
                backgroundColor: icon === ic ? color + "22" : "transparent",
                color: icon === ic ? color : "var(--color-ink-muted)",
              }}
              aria-label={ic}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
          {isEdit ? "Save changes" : "Create project"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        {feedback && <span className="text-xs text-negative">{feedback}</span>}
      </div>

      {/* Danger zone */}
      {isEdit && (
        <div className="rounded-xl border border-red-200 p-4 space-y-2 mt-4">
          <p className="text-xs font-semibold text-red-600">Danger zone</p>
          <p className="text-xs text-ink-muted">Deleting a project removes it permanently. Tasks will be unlinked.</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete project
          </button>
        </div>
      )}
    </form>
  );
}
