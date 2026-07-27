"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, getSetting, queryAll } from "@/lib/db";
import {
  fetchPlexServerUsers,
  fetchOverseerrUsers,
  fetchJellyfinUsers,
  ImportedUser,
} from "@/lib/integrations";

export async function addUser(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const externalUsername = String(formData.get("external_username") || "").trim() || null;
  const shareType = String(formData.get("share_type") || "equal");
  const shareValue = Number(formData.get("share_value") || 1);

  if (!name) {
    redirect("/users?error=" + encodeURIComponent("Name is required"));
  }

  db.prepare(
    `INSERT INTO users (name, email, external_username, source, share_type, share_value)
     VALUES (?, ?, ?, 'manual', ?, ?)`
  ).run(name, email, externalUsername, shareType, shareValue);

  revalidatePath("/users");
}

export async function updateUser(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const externalUsername = String(formData.get("external_username") || "").trim() || null;
  const shareType = String(formData.get("share_type") || "equal");
  const shareValue = Number(formData.get("share_value") || 1);

  if (!id || !name) {
    redirect("/users?error=" + encodeURIComponent("Name is required"));
  }

  db.prepare(
    `UPDATE users SET name = ?, email = ?, external_username = ?, share_type = ?, share_value = ?
     WHERE id = ?`
  ).run(name, email, externalUsername, shareType, shareValue, id);

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUser(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("UPDATE users SET active = 1 - active WHERE id = ?").run(id);
  revalidatePath("/users");
}

export async function deleteUser(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  revalidatePath("/users");
}

function upsertImported(imported: ImportedUser[], source: string) {
  const existing = queryAll<{
    id: number;
    email: string | null;
    external_username: string | null;
  }>("SELECT id, email, external_username FROM users");

  let added = 0;
  for (const u of imported) {
    const match = existing.find(
      (e) =>
        (u.email && e.email && e.email.toLowerCase() === u.email.toLowerCase()) ||
        (u.externalUsername && e.external_username && e.external_username === u.externalUsername)
    );
    if (match) continue;
    db.prepare(
      `INSERT INTO users (name, email, external_username, source, share_type, share_value)
       VALUES (?, ?, ?, ?, 'equal', 1)`
    ).run(u.name, u.email, u.externalUsername, source);
    added++;
  }
  return added;
}

export async function syncPlexUsers() {
  const url = getSetting("plex_url");
  const token = getSetting("plex_token");
  if (!url || !token) {
    redirect(
      "/users?error=" + encodeURIComponent("Configure your Plex URL and token in Settings first")
    );
  }

  let redirectTarget: string;
  try {
    const users = await fetchPlexServerUsers(url!, token!);
    const added = upsertImported(users, "plex");
    revalidatePath("/users");
    redirectTarget = "/users?synced=" + encodeURIComponent(`Imported ${added} new user(s) from Plex`);
  } catch (err) {
    redirectTarget =
      "/users?error=" + encodeURIComponent(`Plex sync failed: ${(err as Error).message}`);
  }
  redirect(redirectTarget);
}

export async function syncOverseerrUsers() {
  const url = getSetting("overseerr_url");
  const apiKey = getSetting("overseerr_api_key");
  if (!url || !apiKey) {
    redirect(
      "/users?error=" + encodeURIComponent("Configure your Overseerr URL and API key in Settings first")
    );
  }

  let redirectTarget: string;
  try {
    const users = await fetchOverseerrUsers(url!, apiKey!);
    const added = upsertImported(users, "overseerr");
    revalidatePath("/users");
    redirectTarget =
      "/users?synced=" + encodeURIComponent(`Imported ${added} new user(s) from Overseerr`);
  } catch (err) {
    redirectTarget =
      "/users?error=" + encodeURIComponent(`Overseerr sync failed: ${(err as Error).message}`);
  }
  redirect(redirectTarget);
}

export async function syncJellyfinUsers() {
  const url = getSetting("jellyfin_url");
  const apiKey = getSetting("jellyfin_api_key");
  if (!url || !apiKey) {
    redirect(
      "/users?error=" +
        encodeURIComponent("Configure your Jellyfin URL and API key in Settings first")
    );
  }

  let redirectTarget: string;
  try {
    const users = await fetchJellyfinUsers(url!, apiKey!);
    const added = upsertImported(users, "jellyfin");
    revalidatePath("/users");
    redirectTarget =
      "/users?synced=" + encodeURIComponent(`Imported ${added} new user(s) from Jellyfin`);
  } catch (err) {
    redirectTarget =
      "/users?error=" + encodeURIComponent(`Jellyfin sync failed: ${(err as Error).message}`);
  }
  redirect(redirectTarget);
}
