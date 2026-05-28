import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiInsight } from "@/lib/mock-data";

export function AiInsightPanel() {
  return (
    <Card className="bg-gradient-to-br from-sidebar to-sidebar-soft text-white">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
            <Sparkles className="size-4 text-white" />
          </span>
          <div>
            <p className="text-sm font-semibold">AI Insight</p>
            <p className="text-[11px] capitalize text-white/60">
              {aiInsight.category} recommendation
            </p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-white">{aiInsight.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            {aiInsight.body}
          </p>
        </div>

        <Button variant="secondary" className="w-full border-0 bg-white text-sidebar hover:bg-white/90">
          <Sparkles />
          Ask AI Advisor
        </Button>
      </CardContent>
    </Card>
  );
}
