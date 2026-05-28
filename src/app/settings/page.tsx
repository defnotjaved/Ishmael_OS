import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, initials")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
          <Settings className="size-5 text-ink-soft" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Settings</h1>
          <p className="text-sm text-ink-muted mt-0.5">Manage your profile and account.</p>
        </div>
      </div>

      <ProfileForm
        name={profile?.name ?? ""}
        initials={profile?.initials ?? ""}
        email={user.email ?? ""}
      />
    </div>
  );
}
