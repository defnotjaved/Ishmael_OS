"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav } from "@/config/nav";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {mobileNav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  active ? "text-brand" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon name={item.icon} className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
