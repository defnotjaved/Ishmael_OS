import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">New project</h1>
        <p className="text-sm text-ink-muted mt-0.5">Give it a name, pick a colour, start building.</p>
      </div>
      <ProjectForm />
    </div>
  );
}
