"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSetting } from "@/lib/db";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

export async function saveIntegrations(formData: FormData) {
  setSetting("plex_token", str(formData, "plex_token"));
  setSetting("jellyfin_url", str(formData, "jellyfin_url"));
  setSetting("jellyfin_api_key", str(formData, "jellyfin_api_key"));
  setSetting("overseerr_url", str(formData, "overseerr_url"));
  setSetting("overseerr_api_key", str(formData, "overseerr_api_key"));
  setSetting("discord_webhook_url", str(formData, "discord_webhook_url"));
  setSetting("smtp_host", str(formData, "smtp_host"));
  setSetting("smtp_port", str(formData, "smtp_port"));
  setSetting("smtp_user", str(formData, "smtp_user"));
  setSetting("smtp_pass", str(formData, "smtp_pass"));
  setSetting("smtp_from", str(formData, "smtp_from"));

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function savePaymentHandles(formData: FormData) {
  setSetting("venmo", str(formData, "venmo"));
  setSetting("paypal", str(formData, "paypal"));
  setSetting("cashapp", str(formData, "cashapp"));

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
