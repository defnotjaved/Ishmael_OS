import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

export type CategoryBreakdownProps = {
  categories: {
    id: string;
    name: string;
    color: string;
    amount: number;
    percent: number;
  }[];
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Top Spending Categories</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">This month</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {category.name}
                    </p>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-ink">
                      {formatCurrency(category.amount, true)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={category.percent} className="flex-1" />
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                  {Math.round(category.percent)}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-muted">
            No expense categories recorded this month yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
