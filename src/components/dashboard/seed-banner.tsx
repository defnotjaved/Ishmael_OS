"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SeedBanner({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDemoData() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("seed_demo_data", {
      p_user_id: userId,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-brand/20 bg-brand-soft px-4 py-3">
      <div className="flex items-center gap-3">
        <Sparkles className="size-4 shrink-0 text-brand" />
        <p className="text-sm text-ink">
          Your dashboard is empty.{" "}
          <span className="text-ink-soft">
            Load demo data to see Ishmael HQ in action.
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button size="sm" onClick={loadDemoData} disabled={loading}>
          {loading ? "Loading…" : "Load demo data"}
        </Button>
      </div>
    </div>
  );
}
