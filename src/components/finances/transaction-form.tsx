"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTransaction } from "@/app/finances/actions";

type Category = { id: string; name: string };
type Account = { id: string; name: string };

type Props = {
  categories: Category[];
  accounts: Account[];
};

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function TransactionForm({ categories, accounts }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTransaction(formData);
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink">Type</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="expense" defaultChecked className="accent-brand" />
            <span className="text-sm text-ink">Expense</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="income" className="accent-brand" />
            <span className="text-sm text-ink">Income</span>
          </label>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="amount">
          Amount <span className="text-red-500">*</span>
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          required
          min={0.01}
          step={0.01}
          placeholder="0.00"
          className={inputClass}
        />
      </div>

      {/* Merchant / description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="merchant">
          Merchant / description <span className="text-xs font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="merchant"
          name="merchant"
          type="text"
          placeholder="e.g. Whole Foods, Netflix"
          className={inputClass}
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="category_id">
          Category <span className="text-xs font-normal text-ink-muted">(optional)</span>
        </label>
        <select id="category_id" name="category_id" className={inputClass}>
          <option value="">— select category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Account */}
      {accounts.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="account_id">
            Account <span className="text-xs font-normal text-ink-muted">(optional)</span>
          </label>
          <select id="account_id" name="account_id" className={inputClass}>
            <option value="">— select account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink" htmlFor="note">
          Note <span className="text-xs font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="Optional note"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add transaction"}
        </Button>
        <Button variant="outline" type="button" onClick={() => router.push("/finances")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
