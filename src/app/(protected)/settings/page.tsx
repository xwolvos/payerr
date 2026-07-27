import { getSettings } from "@/lib/db";
import { saveIntegrations, savePaymentHandles } from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = getSettings([
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
  ]);

  return (
    <div className="space-y-8">
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

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Integrations</h2>
        <form action={saveIntegrations} className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Plex</h3>
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

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Email reminders (SMTP)
            </h3>
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
          </div>

          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Save integrations
          </button>
        </form>
      </section>
    </div>
  );
}
