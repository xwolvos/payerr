"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generatePeriodCore, sendRemindersCore } from "@/lib/periods";

export async function generatePeriod(formData: FormData) {
  const label = String(formData.get("label") || "").trim();
  const result = generatePeriodCore(label || undefined);

  revalidatePath("/dashboard");
  if ("error" in result) {
    redirect("/dashboard?error=" + encodeURIComponent(result.error));
  }
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
  const result = await sendRemindersCore(periodId);

  if ("error" in result) {
    redirect("/dashboard?error=" + encodeURIComponent(result.error));
  }

  redirect(
    "/dashboard?reminded=" +
      encodeURIComponent(
        `Sent ${result.discordSent} Discord message(s), ${result.emailSent} email(s)${
          result.emailFailed ? `, ${result.emailFailed} email(s) failed` : ""
        }`
      )
  );
}
