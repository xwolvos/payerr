import nodemailer from "nodemailer";

export interface ImportedUser {
  name: string;
  email: string | null;
  externalUsername: string | null;
}

/**
 * Queries the Plex server itself (not plex.tv) for the accounts that
 * currently have access to it — the same authoritative list Wizarr and
 * Overseerr's Plex auth check rely on, rather than the plex.tv account-wide
 * friends list.
 */
export async function fetchPlexServerUsers(
  baseUrl: string,
  token: string
): Promise<ImportedUser[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/accounts`;
  const res = await fetch(url, {
    headers: { "X-Plex-Token": token, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Plex API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as {
    MediaContainer?: { Account?: Array<{ id?: number; name?: string }> };
  };
  const accounts = data.MediaContainer?.Account ?? [];
  return accounts
    .filter((a) => a.name)
    .map((a) => ({
      name: a.name!,
      email: null,
      externalUsername: a.name!,
    }));
}

/**
 * Jellyfin has no per-library sharing like Plex — this lists every account
 * on the server via the admin Users endpoint, which is the closest
 * equivalent to "who has access."
 */
export async function fetchJellyfinUsers(
  baseUrl: string,
  apiKey: string
): Promise<ImportedUser[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/Users`;
  const res = await fetch(url, {
    headers: { "X-Emby-Token": apiKey, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jellyfin API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as Array<{ Name?: string }>;
  return data.map((u) => ({
    name: u.Name || "Unknown",
    email: null,
    externalUsername: u.Name ?? null,
  }));
}

export async function fetchOverseerrUsers(
  baseUrl: string,
  apiKey: string
): Promise<ImportedUser[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/user?take=200&skip=0`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Overseerr API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as {
    results: Array<{ displayName?: string; email?: string; plexUsername?: string }>;
  };
  return data.results.map((u) => ({
    name: u.displayName || u.plexUsername || u.email || "Unknown",
    email: u.email ?? null,
    externalUsername: u.plexUsername ?? null,
  }));
}

export async function sendDiscordMessage(webhookUrl: string, content: string) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Discord webhook error: ${res.status} ${res.statusText}`);
}

export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}

export async function sendEmail(smtp: SmtpConfig, to: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  await transporter.sendMail({ from: smtp.from, to, subject, text });
}

export interface PaymentHandles {
  venmo?: string | null;
  paypal?: string | null;
  cashapp?: string | null;
}

export interface PaymentLink {
  label: string;
  url: string;
}

export function buildPaymentLinks(
  handles: PaymentHandles,
  amount: number,
  note: string
): PaymentLink[] {
  const links: PaymentLink[] = [];
  const amt = amount.toFixed(2);
  if (handles.venmo) {
    links.push({
      label: "Venmo",
      url: `https://venmo.com/${encodeURIComponent(handles.venmo)}?txn=charge&amount=${amt}&note=${encodeURIComponent(
        note
      )}`,
    });
  }
  if (handles.paypal) {
    links.push({
      label: "PayPal",
      url: `https://paypal.me/${encodeURIComponent(handles.paypal)}/${amt}`,
    });
  }
  if (handles.cashapp) {
    links.push({
      label: "Cash App",
      url: `https://cash.app/$${encodeURIComponent(handles.cashapp)}/${amt}`,
    });
  }
  return links;
}
