import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_PROFILE = {
  name: "",
  initials: "?",
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
};

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = FALLBACK_PROFILE;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name, initials, level, xp, xp_to_next_level")
      .eq("id", user.id)
      .single();
    if (data) {
      profile = {
        name: data.name,
        initials: data.initials,
        level: data.level,
        xp: data.xp,
        xpToNextLevel: data.xp_to_next_level,
      };
    }
  }

  const firstName = profile.name ? profile.name.split(" ")[0] : undefined;

  return (
    <div className="flex min-h-full">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar firstName={firstName} initials={profile.initials} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
