import { db, getSetting, queryAll } from "./db";
import {
  fetchPlexServerUsers,
  fetchOverseerrUsers,
  fetchJellyfinUsers,
  ImportedUser,
} from "./integrations";

function upsertImported(imported: ImportedUser[], source: string): number {
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

export type SyncResult = { added: number } | { error: string };

export async function syncPlexCore(): Promise<SyncResult> {
  const url = getSetting("plex_url");
  const token = getSetting("plex_token");
  if (!url || !token) return { error: "Plex URL/token not configured" };
  try {
    const users = await fetchPlexServerUsers(url, token);
    return { added: upsertImported(users, "plex") };
  } catch (err) {
    return { error: `Plex sync failed: ${(err as Error).message}` };
  }
}

export async function syncOverseerrCore(): Promise<SyncResult> {
  const url = getSetting("overseerr_url");
  const apiKey = getSetting("overseerr_api_key");
  if (!url || !apiKey) return { error: "Overseerr URL/API key not configured" };
  try {
    const users = await fetchOverseerrUsers(url, apiKey);
    return { added: upsertImported(users, "overseerr") };
  } catch (err) {
    return { error: `Overseerr sync failed: ${(err as Error).message}` };
  }
}

export async function syncJellyfinCore(): Promise<SyncResult> {
  const url = getSetting("jellyfin_url");
  const apiKey = getSetting("jellyfin_api_key");
  if (!url || !apiKey) return { error: "Jellyfin URL/API key not configured" };
  try {
    const users = await fetchJellyfinUsers(url, apiKey);
    return { added: upsertImported(users, "jellyfin") };
  } catch (err) {
    return { error: `Jellyfin sync failed: ${(err as Error).message}` };
  }
}
