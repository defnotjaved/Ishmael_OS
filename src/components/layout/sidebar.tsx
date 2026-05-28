"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarNav } from "@/config/nav";
import { Icon } from "@/components/ui/icon";
import { ProfileBlock } from "@/components/layout/profile-block";
import { cn } from "@/lib/utils";

type SidebarProfile = {
  name: string;
  initials: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
};

export function Sidebar({ profile }: { profile: SidebarProfile }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col bg-sidebar text-sidebar-ink">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
          <Icon name="LayoutDashboard" className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Ishmael HQ</p>
          <p className="text-[11px] text-sidebar-muted">Life operating system</p>
        </div>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {sidebarNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    active
                      ? "bg-brand text-white"
                      : "text-sidebar-ink hover:bg-sidebar-soft hover:text-white",
                  )}
                >
                  <Icon name={item.icon} className="size-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <ProfileBlock
          name={profile.name}
          initials={profile.initials}
          level={profile.level}
          xp={profile.xp}
          xpToNextLevel={profile.xpToNextLevel}
        />
      </div>
    </aside>
  );
}
