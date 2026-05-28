"use client";

import { Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { formatDate } from "@/lib/utils";

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Topbar({
  firstName,
  initials,
}: {
  firstName?: string;
  initials?: string;
}) {
  const now = new Date();
  const displayName = firstName ?? "there";
  const displayInitials = initials ?? "?";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white lg:hidden">
            {displayInitials}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {greeting(now)}, {displayName}
            </h1>
            <p className="text-xs text-ink-soft">{formatDate(now)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              placeholder="Search or quick capture…"
              aria-label="Search or quick capture"
              className="h-9 w-full min-w-[220px] rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          </div>
          <Button size="sm" className="shrink-0">
            <Plus />
            <span className="hidden sm:inline">Quick Capture</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="relative shrink-0"
          >
            <Bell />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-negative" />
          </Button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
