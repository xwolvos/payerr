import Link from "next/link";
import { getSettings } from "@/lib/db";
import {
  saveGeneral,
  savePaymentHandles,
  saveIntegrations,
  saveSmtp,
  saveAutomation,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

const TABS = [
  { key: "general", label: "General" },
  { key: "payments", label: "Payments" },
  { key: "integrations", label: "Integrations" },
  { key: "smtp", label: "SMTP" },
  { key: "automation", label: "Automation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tab?: string }>;
}) {
  const { saved, tab } = await searchParams;
  const activeTab: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : "general";

  const s = getSettings([
    "server_name",
    "currency_symbol",
    "plex_url",
    "plex_token",
    "jellyfin_url",
    "jellyfin_api_key",
    "overseerr_url",
    "overseerr_api_key",
    "discord_webhook_url",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from",
    "venmo",
    "paypal",
    "cashapp",
    "auto_generate_period_enabled",
    "auto_generate_day",
    "auto_reminder_enabled",
    "auto_reminder_interval_days",
    "auto_sync_enabled",
    "auto_sync_interval_hours",
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Integrations and where payments should land.
        </p>
      </div>

      {saved && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Settings saved.
        </div>
      )}

      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/settings?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "general" && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">General</h2>
          <form action={saveGeneral} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Sender name{" "}
                  <span className="normal-case font-normal text-zinc-400">
                    (shown in reminders and payment requests)
                  </span>
                </label>
                <input
                  name="server_name"
                  placeholder="My Media Server"
                  defaultValue={s.server_name ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  name="currency_symbol"
                  defaultValue={s.currency_symbol ?? "$"}
                  className={inputClass}
                >
                  <option value="$">$ — USD/CAD/AUD</option>
                  <option value="€">€ — Euro</option>
                  <option value="£">£ — British Pound</option>
                  <option value="¥">¥ — Yen/Yuan</option>
                  <option value="₹">₹ — Rupee</option>
                  <option value="kr">kr — Krona/Krone</option>
                  <option value="R$">R$ — Real</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Discord reminders
              </h3>
              <label className={labelClass}>Webhook URL</label>
              <input
                name="discord_webhook_url"
                placeholder="https://discord.com/api/webhooks/..."
                defaultValue={s.discord_webhook_url ?? ""}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Save
            </button>
          </form>
        </section>
      )}

      {activeTab === "payments" && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
            Your payment handles
          </h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            These are <strong>your</strong> accounts &mdash; the generated payment links send
            money to you, not to each user.
          </p>
          <form action={savePaymentHandles} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Venmo username</label>
              <input name="venmo" defaultValue={s.venmo ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>PayPal.me username</label>
              <input name="paypal" defaultValue={s.paypal ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cash App $cashtag</label>
              <input name="cashapp" defaultValue={s.cashapp ?? ""} className={inputClass} />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Save payment handles
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "integrations" && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Integrations</h2>
          <form action={saveIntegrations} className="space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Plex
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Server URL</label>
                  <input
                    name="plex_url"
                    placeholder="http://192.168.1.10:32400"
                    defaultValue={s.plex_url ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Token (X-Plex-Token)</label>
                  <input
                    name="plex_token"
                    type="password"
                    defaultValue={s.plex_token ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Jellyfin
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>URL</label>
                  <input
                    name="jellyfin_url"
                    placeholder="http://192.168.1.10:8096"
                    defaultValue={s.jellyfin_url ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>API key</label>
                  <input
                    name="jellyfin_api_key"
                    type="password"
                    defaultValue={s.jellyfin_api_key ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Overseerr / Jellyseerr
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>URL</label>
                  <input
                    name="overseerr_url"
                    placeholder="http://192.168.1.10:5055"
                    defaultValue={s.overseerr_url ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>API key</label>
                  <input
                    name="overseerr_api_key"
                    type="password"
                    defaultValue={s.overseerr_api_key ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Save integrations
            </button>
          </form>
        </section>
      )}

      {activeTab === "smtp" && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Email reminders (SMTP)
          </h2>
          <form action={saveSmtp} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Host</label>
                <input name="smtp_host" defaultValue={s.smtp_host ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Port</label>
                <input
                  name="smtp_port"
                  type="number"
                  defaultValue={s.smtp_port ?? "587"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input name="smtp_user" defaultValue={s.smtp_user ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  name="smtp_pass"
                  type="password"
                  defaultValue={s.smtp_pass ?? ""}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>From address</label>
                <input
                  name="smtp_from"
                  placeholder="payerr@yourdomain.com"
                  defaultValue={s.smtp_from ?? ""}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Save SMTP settings
            </button>
          </form>
        </section>
      )}

      {activeTab === "automation" && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">Automation</h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Runs entirely inside this container &mdash; no external cron or scripts needed. A
            daily check runs at 09:00 server time.
          </p>
          <form action={saveAutomation} className="space-y-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="auto_generate_period_enabled"
                name="auto_generate_period_enabled"
                defaultChecked={s.auto_generate_period_enabled === "1"}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="auto_generate_period_enabled" className="font-medium text-sm">
                  Auto-generate monthly billing period
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Skips automatically if a period already exists for the current month.
                </p>
                <label className={labelClass}>Day of month</label>
                <input
                  name="auto_generate_day"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={s.auto_generate_day ?? "1"}
                  className={`${inputClass} max-w-[120px]`}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="auto_reminder_enabled"
                name="auto_reminder_enabled"
                defaultChecked={s.auto_reminder_enabled === "1"}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="auto_reminder_enabled" className="font-medium text-sm">
                  Auto-send reminders for unpaid invoices
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Repeats every N days per invoice until it&apos;s marked paid.
                </p>
                <label className={labelClass}>Remind every (days)</label>
                <input
                  name="auto_reminder_interval_days"
                  type="number"
                  min={1}
                  max={30}
                  defaultValue={s.auto_reminder_interval_days ?? "3"}
                  className={`${inputClass} max-w-[120px]`}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="auto_sync_enabled"
                name="auto_sync_enabled"
                defaultChecked={s.auto_sync_enabled === "1"}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="auto_sync_enabled" className="font-medium text-sm">
                  Auto-sync users from Plex/Jellyfin/Overseerr
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Only runs the integrations you&apos;ve configured in the Integrations tab.
                </p>
                <label className={labelClass}>Sync every (hours)</label>
                <input
                  name="auto_sync_interval_hours"
                  type="number"
                  min={1}
                  max={168}
                  defaultValue={s.auto_sync_interval_hours ?? "24"}
                  className={`${inputClass} max-w-[120px]`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Save automation
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
