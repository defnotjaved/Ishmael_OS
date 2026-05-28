"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, signOut } from "@/app/settings/actions";

type Props = {
  name: string;
  initials: string;
  email: string;
};

function autoInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function ProfileForm({ name, initials, email }: Props) {
  const [nameVal, setNameVal] = useState(name);
  const [initialsVal, setInitialsVal] = useState(initials);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signingOut, startSignOut] = useTransition();
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);

  // Clear success feedback after 3s
  useEffect(() => {
    if (feedback?.type === "success") {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        setFeedback({ type: "error", msg: result.error });
      } else {
        setFeedback({ type: "success", msg: "Saved." });
      }
    });
  }

  function handleSignOut() {
    startSignOut(async () => {
      await signOut();
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          <p className="text-xs text-ink-muted mt-0.5">How you appear across Ishmael HQ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-xs font-medium text-ink-muted mb-1 block">
              Display name
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={100}
              value={nameVal}
              onChange={(e) => {
                const newName = e.target.value;
                setNameVal(newName);
                const auto = autoInitials(newName);
                if (auto) setInitialsVal(auto);
              }}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>

          <div>
            <label htmlFor="initials" className="text-xs font-medium text-ink-muted mb-1 block">
              Initials
            </label>
            <input
              id="initials"
              name="initials"
              required
              maxLength={4}
              value={initialsVal}
              onChange={(e) => setInitialsVal(e.target.value.toUpperCase())}
              className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40 uppercase"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Save changes
            </Button>
            {feedback && (
              <span className={`text-xs ${feedback.type === "success" ? "text-positive" : "text-negative"}`}>
                {feedback.msg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account section */}
      <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <p className="text-xs text-ink-muted mt-0.5">Manage your account and session.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Email</p>
          <p className="text-sm text-ink-soft">{email}</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Sign out
        </Button>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-surface p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Permanent actions that cannot be undone.
          </p>
        </div>

        {!showDangerConfirm ? (
          <button
            onClick={() => setShowDangerConfirm(true)}
            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            Delete account
          </button>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm text-red-700">
              To permanently delete your account and all data, contact support at{" "}
              <a
                href="mailto:support@ishmaelhq.com"
                className="underline font-medium"
              >
                support@ishmaelhq.com
              </a>
              . We&apos;ll process your request within 48 hours.
            </p>
            <button
              onClick={() => setShowDangerConfirm(false)}
              className="text-xs text-red-600 underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
