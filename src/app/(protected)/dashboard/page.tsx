import { queryAll, queryOne, getSettings } from "@/lib/db";
import { BillingPeriod, Invoice } from "@/lib/types";
import { buildPaymentLinks, PaymentHandles } from "@/lib/integrations";
import { formatMoney } from "@/lib/format";
import {
  generatePeriod,
  deletePeriod,
  markPaid,
  markUnpaid,
  sendReminders,
} from "./actions";

interface InvoiceRow extends Invoice {
  user_name: string;
  user_email: string | null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reminded?: string }>;
}) {
  const { error, reminded } = await searchParams;

  const periods = queryAll<BillingPeriod>(
    "SELECT * FROM billing_periods ORDER BY created_at DESC"
  );

  const activeUserCount =
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM users WHERE active = 1")?.c ?? 0;

  const settings = getSettings(["server_name", "currency_symbol", "venmo", "paypal", "cashapp"]);
  const handles: PaymentHandles = {
    venmo: settings.venmo,
    paypal: settings.paypal,
    cashapp: settings.cashapp,
  };
  const hasHandles = Boolean(handles.venmo || handles.paypal || handles.cashapp);
  const senderName = settings.server_name || "Payerr";
  const currency = settings.currency_symbol || "$";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Generate a billing period and split costs across your users.
          </p>
        </div>
        <form action={generatePeriod} className="flex gap-2">
          <input
            name="label"
            placeholder={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
          >
            Generate period
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {reminded && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {reminded}
        </div>
      )}
      {!hasHandles && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Add your Venmo/PayPal/Cash App handles in Settings to generate payment links.
        </div>
      )}
      {activeUserCount === 0 && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          No active users yet &mdash; add some on the Users page before generating a period.
        </div>
      )}

      {periods.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500">
          No billing periods yet. Generate one above once your cost items and users are set up.
        </div>
      )}

      {periods.map((period) => {
        const invoices = queryAll<InvoiceRow>(
          `SELECT invoices.*, users.name as user_name, users.email as user_email
           FROM invoices JOIN users ON users.id = invoices.user_id
           WHERE invoices.period_id = ?
           ORDER BY users.name ASC`,
          [period.id]
        );

        const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;

        return (
          <div
            key={period.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{period.label}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMoney(period.total_cost, currency)} total &middot;{" "}
                  {unpaidCount === 0 ? "all paid" : `${unpaidCount} unpaid`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {unpaidCount > 0 && (
                  <form action={sendReminders}>
                    <input type="hidden" name="period_id" value={period.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Send reminders
                    </button>
                  </form>
                )}
                <form action={deletePeriod}>
                  <input type="hidden" name="id" value={period.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {invoices.map((inv) => {
                const links = hasHandles
                  ? buildPaymentLinks(
                      handles,
                      inv.amount_due,
                      `${senderName} - ${inv.user_name} - ${period.label}`
                    )
                  : [];
                return (
                  <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {inv.user_name}{" "}
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatMoney(inv.amount_due, currency)}
                        {inv.status === "paid" && inv.paid_at && (
                          <> &middot; paid {new Date(inv.paid_at).toLocaleDateString()}</>
                        )}
                      </p>
                      {inv.status === "unpaid" && links.length > 0 && (
                        <div className="mt-1 flex gap-3">
                          {links.map((l) => (
                            <a
                              key={l.label}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Request via {l.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {inv.status === "unpaid" ? (
                      <form action={markPaid}>
                        <input type="hidden" name="id" value={inv.id} />
                        <input type="hidden" name="method" value="manual" />
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          Mark paid
                        </button>
                      </form>
                    ) : (
                      <form action={markUnpaid}>
                        <input type="hidden" name="id" value={inv.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Undo
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
