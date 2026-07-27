# Payerr

Self-hosted cost splitting for your Plex/Jellyfin server. Track what your
server actually costs, split it across the people who use it, and generate
payment request links so you're not chasing people down manually.

## Features

- **Cost tracking** — log recurring expenses (hosting, storage, indexers,
  VPN, domain, etc.) as monthly or yearly line items.
- **Flexible splitting** — split costs equally, by weight, or as a fixed flat
  amount per user, then generate a billing period with one click.
- **Plex / Overseerr / Jellyseerr sync** — pull your user roster in directly
  instead of typing it in by hand.
- **Payment links** — Venmo, PayPal.me, and Cash App request links generated
  per invoice, pointing at *your* account.
- **Reminders** — send outstanding balances via Discord webhook or email
  (SMTP).
- **Payment tracking** — mark invoices paid/unpaid and keep a history of
  billing periods.

Payerr never touches real money — it doesn't process payments or store
financial credentials. It generates the request links; your existing payment
apps handle the transaction.

## Running it

### Docker Compose (recommended)

```bash
git clone <this-repo> payerr
cd payerr
docker compose up -d
```

The app will be available at `http://<host>:3690`. On first visit you'll be
walked through creating an admin account.

### Docker run

```bash
docker build -t payerr .
docker run -d \
  --name payerr \
  -p 3690:3000 \
  -v ./data:/app/data \
  --restart unless-stopped \
  payerr
```

### Local development

Requires Node.js 22.5+ (uses the built-in `node:sqlite` module — no native
build tooling required).

```bash
npm install
npm run dev
```

## Configuration

Everything is configured through the UI after first login:

- **Settings → Your payment handles** — your Venmo/PayPal/Cash App usernames.
  These receive the money; they are not per-user.
- **Settings → Integrations** — Plex token, Overseerr/Jellyseerr URL + API
  key, Discord webhook, and SMTP details for reminders.
- **Users** — add people manually or sync from Plex/Overseerr, and set each
  person's share type (equal / weighted / fixed).
- **Costs** — add your recurring expenses.
- **Dashboard** — generate a billing period, send reminders, and mark
  invoices paid.

All data is stored in a single SQLite file under `/app/data` (or `./data`
locally) — back that up if you want to keep your history.

## Notes on the Plex/Overseerr sync

- The Plex sync uses `plex.tv`'s "friends" endpoint, a reasonable proxy for
  "people who have access to my server" for personal/solo Plex owners. It
  does not verify per-library access the way Overseerr's own Plex sign-in
  check does.
- The Overseerr/Jellyseerr sync pulls the existing user list via the
  `/api/v1/user` endpoint and an API key from Settings → Integrations.

## License

MIT
