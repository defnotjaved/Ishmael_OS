import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TransactionForm } from "@/components/finances/transaction-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const [{ data: rawCategories }, { data: rawAccounts }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("accounts").select("id, name").eq("owner_id", user.id).order("created_at"),
  ]);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link
          href="/finances"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ChevronLeft className="size-4" /> Finances
        </Link>
        <h1 className="text-2xl font-bold text-ink">Add transaction</h1>
        <p className="text-sm text-ink-muted mt-0.5">Log an expense or income manually.</p>
      </div>
      <TransactionForm
        categories={rawCategories ?? []}
        accounts={rawAccounts ?? []}
      />
    </div>
  );
}
