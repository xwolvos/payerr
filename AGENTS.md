<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Payerr project conventions

## Stack and why

- Next.js App Router, Server Actions for all mutations (`actions.ts` next to
  each route's `page.tsx`, marked `"use server"`). Don't add API route
  handlers for things a Server Action can already do — the invoice/reminder
  flow, user CRUD, settings, etc. are all actions, not `/api/*` routes.
- Database is `node:sqlite` (Node's built-in module), not `better-sqlite3`
  or any native addon. This is intentional: it keeps the Docker build free
  of native compilation, which matters because the image is built from
  scratch on `docker compose up` on people's home servers, not pulled
  pre-built. Don't swap it for a native SQLite driver.
- No ORM. Raw SQL via the helpers in `src/lib/db.ts` (`queryAll`, `queryOne`,
  `getSetting`, `setSetting`). Always go through these rather than calling
  `db.prepare(...).all()/.get()` directly with a raw `as Type[]` cast —
  `node:sqlite`'s types don't overlap with app types, so a direct cast
  needs `as unknown as T[]`, which `queryAll`/`queryOne` already handle.

## Known gotchas (already hit these once — don't reintroduce them)

- **Build-time SQLite lock contention.** `next build` spins up several
  worker processes that each import `db.ts` to statically analyze routes.
  If `db.ts` opened a real connection to the on-disk file at import time,
  those workers race on the DB lock and the build fails with
  "database is locked." `src/lib/db.ts` detects `NEXT_PHASE ===
  "phase-production-build"` and uses an in-memory DB during build instead.
  Keep that guard if you touch `db.ts`.
- **No WAL journal mode.** `db.ts` explicitly sets `journal_mode = DELETE`,
  not the more common `WAL`. This was a defensive change made while
  chasing what turned out to be an unrelated bug (see below) — it wasn't
  proven necessary, but WAL's shared-memory mmap (the `-shm` file) is a
  real known weak point on FUSE-based filesystems (e.g. Unraid's
  `/mnt/user`), so it stays as a precaution. This is a single-process app
  with low write volume; DELETE's weaker concurrent-writer story doesn't
  matter here.
- **`isAdminConfigured()`/`getSession()` checks need `force-dynamic`.**
  `/`, `/login`, and `/setup` each check `isAdminConfigured()` before any
  call to a real dynamic API (`cookies()`, etc). With nothing marking the
  route dynamic, Next statically prerenders it at build time — against
  the empty **build-phase** database (see above), where
  `isAdminConfigured()` is always `false`. That bakes in a permanent,
  stale redirect that ignores the real runtime database forever. Symptom
  in production: visiting the app redirects in an infinite loop between
  `/login` and `/setup` even though an admin account genuinely exists.
  Fix was `export const dynamic = "force-dynamic"` on all three pages.
  If you add another page that branches on auth state before touching a
  real dynamic API, it needs this too — check the `next build` route
  table (`ƒ` vs `○`) before shipping.
- **`npm ci` vs `npm install` on Linux.** Both the Dockerfile and
  `ci.yml` use `npm install`, not `npm ci`. A `package-lock.json`
  generated on Windows/macOS doesn't carry the Linux optional platform
  packages `npm ci`'s strict lockfile check expects, so it fails with an
  "out of sync" error on any Linux runner/base image (Alpine *or*
  glibc-based Ubuntu) even though the lockfile is fine on the host OS.
- **Payment handles belong to the admin, not the user.** Venmo/PayPal.me/
  Cash App links always send money *to* whoever's handle is in the URL.
  Settings → Payments holds *your* handles, because you're the one getting
  paid. Do not add per-user payment handle fields again — that was tried
  and reverted early on; the per-user fields that make sense are
  `share_type`/`share_value` (how much they owe), not where their money
  goes.
- **Currency and sender name are settings, not literals.** Every dollar
  amount rendered or sent in a message goes through `formatMoney()` from
  `src/lib/format.ts` with the `currency_symbol` setting — never hardcode
  `$`. Reminder messages and payment-link notes use the `server_name`
  setting, not a literal `"Payerr"`.

## Testing

- `npm test` runs `node --test` against `*.test.ts` files directly (Node's
  native TypeScript support, no ts-node/babel). Type-only imports must use
  `import { type Foo } from "./bar.ts"` — a plain `import { Foo }` for a
  type-only export fails at runtime because type stripping removes the
  export entirely.
- Any change to `src/lib/split.ts` (the cost-splitting math) needs a test
  in `split.test.ts` covering the new behavior. This is the one piece of
  logic where a silent bug costs someone real money — treat it accordingly.
- CI (`.github/workflows/ci.yml`) runs lint, test, and build on every push/
  PR to `master`. All three must pass before merge.

## Git hygiene

- Do not add `Co-Authored-By` trailers (or similar AI-attribution trailers)
  to commit messages in this repo. Commits should be attributed to the
  human maintainer only.
