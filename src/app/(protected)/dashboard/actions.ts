"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, getSettings, queryAll, queryOne } from "@/lib/db";
import { monthlyEquivalent, splitCost, SplitUser } from "@/lib/split";
import {
  buildPaymentLinks,
  sendDiscordMessage,
  sendEmail,
  PaymentHandles,
} from "@/lib/integrations";
import { CostItem, Invoice, User } from "@/lib/types";

export async function generatePeriod(formData: FormData) {
  const label =
    String(formData.get("label") || "").trim() ||
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const costItems = queryAll<CostItem>("SELECT * FROM cost_items WHERE active = 1");
  const totalCost = costItems.reduce((sum, c) => sum + monthlyEquivalent(c), 0);

  const users = queryAll<User>("SELECT * FROM users WHERE active = 1");
  if (users.length === 0) {
    redirect("/dashboard?error=" + encodeURIComponent("Add at least one active user first"));
  }

  const splitUsers: SplitUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    shareType: u.share_type,
    shareValue: u.share_value,
  }));

  const results = splitCost(totalCost, splitUsers);

  const insertPeriod = db.prepare(
    "INSERT INTO billing_periods (label, total_cost) VALUES (?, ?)"
  );
  const info = insertPeriod.run(label, totalCost);
  const periodId = Number(info.lastInsertRowid);

  const insertInvoice = db.prepare(
    "INSERT INTO invoices (period_id, user_id, amount_due) VALUES (?, ?, ?)"
  );
  for (const r of results) {
    insertInvoice.run(periodId, r.userId, r.amountDue);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deletePeriod(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM billing_periods WHERE id = ?").run(id);
  revalidatePath("/dashboard");
}

export async function markPaid(formData: FormData) {
  const id = Number(formData.get("id"));
  const method = String(formData.get("method") || "manual");
  db.prepare(
    "UPDATE invoices SET status = 'paid', paid_at = datetime('now'), method = ? WHERE id = ?"
  ).run(method, id);
  revalidatePath("/dashboard");
}

export async function markUnpaid(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("UPDATE invoices SET status = 'unpaid', paid_at = NULL, method = NULL WHERE id = ?").run(
    id
  );
  revalidatePath("/dashboard");
}

export async function sendReminders(formData: FormData) {
  const periodId = Number(formData.get("period_id"));

  const period = queryOne<{ id: number; label: string }>(
    "SELECT * FROM billing_periods WHERE id = ?",
    [periodId]
  );
  if (!period) {
    redirect("/dashboard?error=" + encodeURIComponent("Billing period not found"));
  }

  const unpaid = queryAll<Invoice & { user_name: string; user_email: string | null }>(
    `SELECT invoices.*, users.name as user_name, users.email as user_email
     FROM invoices JOIN users ON users.id = invoices.user_id
     WHERE invoices.period_id = ? AND invoices.status = 'unpaid'`,
    [periodId]
  );

  const settings = getSettings([
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

  let discordSent = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const inv of unpaid) {
    const note = `Payerr - ${inv.user_name} - ${period!.label}`;
    const links = buildPaymentLinks(handles, inv.amount_due, note);
    const linksText = links.map((l) => `${l.label}: ${l.url}`).join("\n");
    const message = `💸 **${inv.user_name}** owes **$${inv.amount_due.toFixed(2)}** for ${
      period!.label
    }\n${linksText || "(no payment handles configured)"}`;

    if (settings.discord_webhook_url) {
      try {
        await sendDiscordMessage(settings.discord_webhook_url, message);
        discordSent++;
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
          `Payment due: $${inv.amount_due.toFixed(2)} for ${period!.label}`,
          `Hi ${inv.user_name},\n\nYou owe $${inv.amount_due.toFixed(2)} for ${
            period!.label
          }.\n\n${linksText}\n\nThanks!`
        );
        emailSent++;
      } catch {
        emailFailed++;
      }
    }
  }

  redirect(
    "/dashboard?reminded=" +
      encodeURIComponent(
        `Sent ${discordSent} Discord message(s), ${emailSent} email(s)${
          emailFailed ? `, ${emailFailed} email(s) failed` : ""
        }`
      )
  );
}
