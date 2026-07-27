import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db, getSetting, setSetting } from "./db";

const SESSION_COOKIE = "payerr_session";
const SESSION_DAYS = 30;

export function isAdminConfigured(): boolean {
  return Boolean(getSetting("admin_username")) && Boolean(getSetting("admin_password_hash"));
}

export async function createAdmin(username: string, password: string) {
  const hash = await bcrypt.hash(password, 12);
  setSetting("admin_username", username);
  setSetting("admin_password_hash", hash);
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const storedUsername = getSetting("admin_username");
  const storedHash = getSetting("admin_password_hash");
  if (!storedUsername || !storedHash) return false;
  if (storedUsername !== username) return false;
  return bcrypt.compare(password, storedHash);
}

function pruneExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export async function createSession(): Promise<string> {
  pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token, created_at, expires_at) VALUES (?, datetime('now'), ?)").run(
    token,
    expiresAt
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Deliberately not tied to NODE_ENV: this app is typically self-hosted
    // behind plain HTTP on a LAN (no reverse-proxy TLS), and browsers
    // silently refuse to store `Secure` cookies on non-HTTPS origins. A
    // cookie set with `Secure: true` here would appear to work for the
    // single response that inlines the redirected page, then vanish on
    // the very next request. httpOnly + sameSite=lax still protects it;
    // Secure would only add value behind actual HTTPS, which the deployer
    // is free to add via a reverse proxy without any code change needed.
    secure: false,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const row = db
    .prepare("SELECT token FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token);
  return Boolean(row);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
