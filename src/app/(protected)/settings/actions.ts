"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSetting } from "@/lib/db";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

export async function saveGeneral(formData: FormData) {
  setSetting("server_name", str(formData, "server_name") || "Payerr");
  setSetting("currency_symbol", str(formData, "currency_symbol") || "$");
  setSetting("discord_webhook_url", str(formData, "discord_webhook_url"));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/costs");
  revalidatePath("/users");
  redirect("/settings?tab=general&saved=1");
}

export async function savePaymentHandles(formData: FormData) {
  setSetting("venmo", str(formData, "venmo"));
  setSetting("paypal", str(formData, "paypal"));
  setSetting("cashapp", str(formData, "cashapp"));

  revalidatePath("/settings");
  redirect("/settings?tab=payments&saved=1");
}

export async function saveIntegrations(formData: FormData) {
  setSetting("plex_url", str(formData, "plex_url"));
  setSetting("plex_token", str(formData, "plex_token"));
  setSetting("jellyfin_url", str(formData, "jellyfin_url"));
  setSetting("jellyfin_api_key", str(formData, "jellyfin_api_key"));
  setSetting("overseerr_url", str(formData, "overseerr_url"));
  setSetting("overseerr_api_key", str(formData, "overseerr_api_key"));

  revalidatePath("/settings");
  redirect("/settings?tab=integrations&saved=1");
}

export async function saveSmtp(formData: FormData) {
  setSetting("smtp_host", str(formData, "smtp_host"));
  setSetting("smtp_port", str(formData, "smtp_port"));
  setSetting("smtp_user", str(formData, "smtp_user"));
  setSetting("smtp_pass", str(formData, "smtp_pass"));
  setSetting("smtp_from", str(formData, "smtp_from"));

  revalidatePath("/settings");
  redirect("/settings?tab=smtp&saved=1");
}

export async function saveAutomation(formData: FormData) {
  setSetting("auto_generate_period_enabled", formData.get("auto_generate_period_enabled") ? "1" : "");
  setSetting("auto_generate_day", str(formData, "auto_generate_day") || "1");
  setSetting("auto_reminder_enabled", formData.get("auto_reminder_enabled") ? "1" : "");
  setSetting("auto_reminder_interval_days", str(formData, "auto_reminder_interval_days") || "3");
  setSetting("auto_sync_enabled", formData.get("auto_sync_enabled") ? "1" : "");
  setSetting("auto_sync_interval_hours", str(formData, "auto_sync_interval_hours") || "24");

  revalidatePath("/settings");
  redirect("/settings?tab=automation&saved=1");
}
