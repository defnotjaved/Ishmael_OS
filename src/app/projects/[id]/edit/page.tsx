import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
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
    .select("id, name, description, status, color, icon")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!project) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Edit project</h1>
        <p className="text-sm text-ink-muted mt-0.5">Update details for {project.name}.</p>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
