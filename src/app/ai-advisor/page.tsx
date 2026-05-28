import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DailyPlanner } from "@/components/ai-advisor/daily-planner";

export default async function AiAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Sparkles className="size-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">AI Advisor</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Personalized planning suggestions — powered by Claude.
          </p>
        </div>
      </div>

      <DailyPlanner />
    </div>
  );
}
