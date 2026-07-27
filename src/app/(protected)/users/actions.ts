"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { syncPlexCore, syncOverseerrCore, syncJellyfinCore } from "@/lib/sync";

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

export async function syncPlexUsers() {
  const result = await syncPlexCore();
  revalidatePath("/users");
  if ("error" in result) {
    redirect("/users?error=" + encodeURIComponent(result.error));
  }
  redirect("/users?synced=" + encodeURIComponent(`Imported ${result.added} new user(s) from Plex`));
}

export async function syncOverseerrUsers() {
  const result = await syncOverseerrCore();
  revalidatePath("/users");
  if ("error" in result) {
    redirect("/users?error=" + encodeURIComponent(result.error));
  }
  redirect(
    "/users?synced=" + encodeURIComponent(`Imported ${result.added} new user(s) from Overseerr`)
  );
}

export async function syncJellyfinUsers() {
  const result = await syncJellyfinCore();
  revalidatePath("/users");
  if ("error" in result) {
    redirect("/users?error=" + encodeURIComponent(result.error));
  }
  redirect(
    "/users?synced=" + encodeURIComponent(`Imported ${result.added} new user(s) from Jellyfin`)
  );
}
