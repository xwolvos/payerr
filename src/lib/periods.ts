import { db, getSettings, queryAll, queryOne } from "./db";
import { monthlyEquivalent, splitCost, SplitUser } from "./split";
import { buildPaymentLinks, sendDiscordMessage, sendEmail, PaymentHandles } from "./integrations";
import { formatMoney } from "./format";
import { CostItem, Invoice, User } from "./types";

export type GeneratePeriodResult = { periodId: number } | { error: string };

export function generatePeriodCore(label?: string): GeneratePeriodResult {
  const resolvedLabel =
    label?.trim() || new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const costItems = queryAll<CostItem>("SELECT * FROM cost_items WHERE active = 1");
  const totalCost = costItems.reduce((sum, c) => sum + monthlyEquivalent(c), 0);

  const users = queryAll<User>("SELECT * FROM users WHERE active = 1");
  if (users.length === 0) {
    return { error: "Add at least one active user first" };
  }

  const splitUsers: SplitUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    shareType: u.share_type,
    shareValue: u.share_value,
  }));

  const results = splitCost(totalCost, splitUsers);

  const insertPeriod = db.prepare("INSERT INTO billing_periods (label, total_cost) VALUES (?, ?)");
  const info = insertPeriod.run(resolvedLabel, totalCost);
  const periodId = Number(info.lastInsertRowid);

  const insertInvoice = db.prepare(
    "INSERT INTO invoices (period_id, user_id, amount_due) VALUES (?, ?, ?)"
  );
  for (const r of results) {
    insertInvoice.run(periodId, r.userId, r.amountDue);
  }

  return { periodId };
}

/** True if a billing period already exists whose label matches the given month/year. */
export function periodExistsForMonth(date: Date): boolean {
  const label = date.toLocaleString("en-US", { month: "long", year: "numeric" });
  return Boolean(
    queryOne<{ id: number }>("SELECT id FROM billing_periods WHERE label = ?", [label])
  );
}

export type ReminderResult =
  | { discordSent: number; emailSent: number; emailFailed: number }
  | { error: string };

export async function sendRemindersCore(
  periodId: number,
  options: { onlyDue?: boolean; reminderIntervalDays?: number } = {}
): Promise<ReminderResult> {
  const period = queryOne<{ id: number; label: string }>(
    "SELECT * FROM billing_periods WHERE id = ?",
    [periodId]
  );
  if (!period) return { error: "Billing period not found" };

  const unpaid = queryAll<
    Invoice & { user_name: string; user_email: string | null; last_reminded_at: string | null }
  >(
    `SELECT invoices.*, users.name as user_name, users.email as user_email
     FROM invoices JOIN users ON users.id = invoices.user_id
     WHERE invoices.period_id = ? AND invoices.status = 'unpaid'`,
    [periodId]
  );

  const dueInvoices = options.onlyDue
    ? unpaid.filter((inv) => {
        if (!inv.last_reminded_at) return true;
        const daysSince = (Date.now() - new Date(inv.last_reminded_at).getTime()) / 86_400_000;
        return daysSince >= (options.reminderIntervalDays ?? 3);
      })
    : unpaid;

  const settings = getSettings([
    "server_name",
    "currency_symbol",
    "venmo",
    "paypal",
    "cashapp",
    "discord_webhook_url",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from",
  ]);
  const handles: PaymentHandles = {
    venmo: settings.venmo,
    paypal: settings.paypal,
    cashapp: settings.cashapp,
  };
  const senderName = settings.server_name || "Payerr";
  const currency = settings.currency_symbol || "$";

  let discordSent = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const inv of dueInvoices) {
    const amount = formatMoney(inv.amount_due, currency);
    const note = `${senderName} - ${inv.user_name} - ${period.label}`;
    const links = buildPaymentLinks(handles, inv.amount_due, note);
    const linksText = links.map((l) => `${l.label}: ${l.url}`).join("\n");
    const message = `💸 **${inv.user_name}** owes **${amount}** for ${period.label} (${senderName})\n${
      linksText || "(no payment handles configured)"
    }`;

    let remindedThisInvoice = false;

    if (settings.discord_webhook_url) {
      try {
        await sendDiscordMessage(settings.discord_webhook_url, message);
        discordSent++;
        remindedThisInvoice = true;
      } catch {
        // best-effort; continue with remaining reminders
      }
    }

    if (settings.smtp_host && inv.user_email) {
      try {
        await sendEmail(
          {
            host: settings.smtp_host,
            port: Number(settings.smtp_port || 587),
            user: settings.smtp_user || undefined,
            pass: settings.smtp_pass || undefined,
            from: settings.smtp_from || settings.smtp_user || "payerr@localhost",
          },
          inv.user_email,
          `Payment due: ${amount} for ${period.label} (${senderName})`,
          `Hi ${inv.user_name},\n\nYou owe ${amount} for ${period.label} (${senderName}).\n\n${linksText}\n\nThanks!`
        );
        emailSent++;
        remindedThisInvoice = true;
      } catch {
        emailFailed++;
      }
    }

    if (remindedThisInvoice) {
      db.prepare("UPDATE invoices SET last_reminded_at = datetime('now') WHERE id = ?").run(inv.id);
    }
  }

  return { discordSent, emailSent, emailFailed };
}
