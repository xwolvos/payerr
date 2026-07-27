import { queryAll } from "@/lib/db";
import { CostItem } from "@/lib/types";
import { monthlyEquivalent } from "@/lib/split";
import { addCostItem, toggleCostItem, deleteCostItem } from "./actions";

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const items = queryAll<CostItem>(
    "SELECT * FROM cost_items ORDER BY active DESC, created_at DESC"
  );

  const monthlyTotal = items
    .filter((i) => i.active)
    .reduce((sum, i) => sum + monthlyEquivalent(i), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cost Items</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Recurring server expenses: hosting, storage, indexers, VPN, domains, etc.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Active items</h2>
          <span className="text-sm font-medium text-emerald-600">
            ${monthlyTotal.toFixed(2)} / mo total
          </span>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.length === 0 && (
            <li className="px-4 py-6 text-sm text-zinc-500">No cost items yet.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className={item.active ? "" : "opacity-40"}>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  ${item.amount.toFixed(2)} / {item.interval === "yearly" ? "yr" : "mo"}
                  {item.interval === "yearly" && (
                    <> &middot; ${monthlyEquivalent(item).toFixed(2)}/mo equivalent</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <form action={toggleCostItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    {item.active ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteCostItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Add cost item</h2>
        <form action={addCostItem} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Name
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Unraid hosting"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Amount
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Interval
            </label>
            <select
              name="interval"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
