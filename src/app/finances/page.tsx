import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { deleteTransaction } from "@/app/finances/actions";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
  cash: "Cash",
};

export default async function FinancesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const [{ data: rawAccounts }, { data: rawTx }] = await Promise.all([
    supabase.from("accounts").select("*").eq("owner_id", user.id).order("created_at"),
    supabase
      .from("transactions")
      .select("id, amount, merchant, note, date, category_id, categories(id, name, color)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const accounts = rawAccounts ?? [];
  const transactions = (rawTx ?? []) as unknown as {
    id: string;
    amount: number;
    merchant: string | null;
    note: string | null;
    date: string;
    category_id: string | null;
    categories: { id: string; name: string; color: string } | null;
  }[];

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Finances</h1>
          <p className="text-sm text-ink-muted mt-0.5">Accounts and transaction history</p>
        </div>
        <Link href="/finances/transactions/new">
          <Button>
            <Plus className="size-4 mr-1.5" /> Add transaction
          </Button>
        </Link>
      </div>

      {/* Accounts */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Accounts
        </h2>
        {accounts.length === 0 ? (
          <EmptyState
            icon="Wallet"
            title="No accounts yet"
            description="Accounts will be seeded with demo data or added when you create one."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-5">
                  <p className="text-xs text-ink-muted mb-1">
                    {ACCOUNT_TYPE_LABEL[a.type] ?? a.type}
                  </p>
                  <p className="font-semibold text-ink">{a.name}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                    {formatCurrency(Number(a.balance))}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed">
              <CardContent className="pt-5 flex items-center justify-center h-full min-h-[100px]">
                <p className="text-sm text-ink-muted">More accounts coming soon</p>
              </CardContent>
            </Card>
          </div>
        )}
        {accounts.length > 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            Total balance:{" "}
            <span className="font-semibold text-ink">{formatCurrency(totalBalance)}</span>
          </p>
        )}
      </section>

      {/* Transactions */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Recent transactions
        </h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon="Receipt"
            title="No transactions yet"
            description="Add your first transaction to start tracking income and expenses."
            action={
              <Link href="/finances/transactions/new">
                <Button size="sm">Add transaction</Button>
              </Link>
            }
          />
        ) : (
          <Card>
            <CardContent className="pt-0 divide-y divide-line">
              {transactions.map((tx) => {
                const isIncome = Number(tx.amount) > 0;
                const cat = tx.categories;

                async function handleDelete() {
                  "use server";
                  await deleteTransaction(tx.id);
                }

                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 group">
                    {/* Category color dot */}
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat?.color ?? "var(--color-line)" }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {tx.merchant ?? tx.note ?? "Transaction"}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {cat?.name ?? "Uncategorized"} ·{" "}
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome ? "text-green-600" : "text-ink"
                      }`}
                    >
                      {isIncome ? "+" : ""}
                      {formatCurrency(Math.abs(Number(tx.amount)))}
                    </span>

                    <form action={handleDelete}>
                      <button
                        type="submit"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted hover:text-red-500 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
