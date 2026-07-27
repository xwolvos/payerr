import cron from "node-cron";
import { getSettings, queryAll, setSetting } from "./db";
import { generatePeriodCore, periodExistsForMonth, sendRemindersCore } from "./periods";
import { syncPlexCore, syncOverseerrCore, syncJellyfinCore } from "./sync";
import { BillingPeriod } from "./types";

let started = false;

/** Runs once per process; safe to call multiple times (e.g. hot reload in dev). */
export function startScheduler() {
  if (started) return;
  started = true;

  // Once daily is plenty for month-boundary period generation, reminder
  // cadence (measured in days), and roster sync (measured in hours) — no
  // need for finer-grained scheduling here.
  cron.schedule("0 9 * * *", () => {
    runDailyTasks().catch((err) => console.error("[scheduler] daily tasks failed:", err));
  });

  console.log("[scheduler] started - daily automation tasks run at 09:00 server time");
}

export async function runDailyTasks() {
  const settings = getSettings([
    "auto_generate_period_enabled",
    "auto_generate_day",
    "auto_reminder_enabled",
    "auto_reminder_interval_days",
    "auto_sync_enabled",
    "auto_sync_interval_hours",
    "last_sync_at",
  ]);

  const today = new Date();

  if (settings.auto_generate_period_enabled === "1") {
    const targetDay = Number(settings.auto_generate_day || 1);
    if (today.getDate() === targetDay && !periodExistsForMonth(today)) {
      const result = generatePeriodCore();
      if ("error" in result) {
        console.warn("[scheduler] auto-generate period skipped:", result.error);
      } else {
        console.log("[scheduler] auto-generated billing period", result.periodId);
      }
    }
  }

  if (settings.auto_reminder_enabled === "1") {
    const intervalDays = Number(settings.auto_reminder_interval_days || 3);
    // Bounded to the last year of periods so this stays cheap indefinitely.
    const periods = queryAll<BillingPeriod>(
      "SELECT * FROM billing_periods ORDER BY created_at DESC LIMIT 12"
    );
    for (const period of periods) {
      const result = await sendRemindersCore(period.id, {
        onlyDue: true,
        reminderIntervalDays: intervalDays,
      });
      if (!("error" in result) && (result.discordSent || result.emailSent)) {
        console.log(`[scheduler] sent reminders for period ${period.id}`, result);
      }
    }
  }

  if (settings.auto_sync_enabled === "1") {
    const intervalHours = Number(settings.auto_sync_interval_hours || 24);
    const lastSync = settings.last_sync_at ? new Date(settings.last_sync_at).getTime() : 0;
    const dueSync = Date.now() - lastSync >= intervalHours * 60 * 60 * 1000;
    if (dueSync) {
      await Promise.all([syncPlexCore(), syncOverseerrCore(), syncJellyfinCore()]);
      setSetting("last_sync_at", new Date().toISOString());
      console.log("[scheduler] ran periodic user sync");
    }
  }
}
