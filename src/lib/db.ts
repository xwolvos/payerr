import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "payerr.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __payerrDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  const conn = new DatabaseSync(DB_PATH);
  conn.exec("PRAGMA journal_mode = WAL;");
  conn.exec("PRAGMA busy_timeout = 5000;");
  conn.exec("PRAGMA foreign_keys = ON;");
  return conn;
}

export const db = globalThis.__payerrDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalThis.__payerrDb = db;
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      plex_username TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      share_type TEXT NOT NULL DEFAULT 'equal',
      share_value REAL NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cost_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      interval TEXT NOT NULL DEFAULT 'monthly',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS billing_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      total_cost REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES billing_periods(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_due REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      paid_at TEXT,
      method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

migrate();

export function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

export function getSettings(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const key of keys) result[key] = getSetting(key);
  return result;
}

export function queryAll<T>(sql: string, params: SQLInputValue[] = []): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

export function queryOne<T>(sql: string, params: SQLInputValue[] = []): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}
