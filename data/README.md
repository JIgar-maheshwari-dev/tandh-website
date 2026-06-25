This folder is intentionally mostly empty in a fresh copy of the
project. The real database (users, orders, live stock) lives in
Postgres, not here — see DATABASE_URL in .env.local.

A couple of things still appear here at runtime, though:

- `.nextauth-secret` — only created if you haven't set NEXTAUTH_SECRET
  yourself, as a local-dev convenience so sessions survive a server
  restart. Never relied on in production — set NEXTAUTH_SECRET for real
  deployments.
- `users.csv` / `orders.csv` — a convenience export mirrored from the
  database on every signup/order, so you can open them directly in
  Excel/Sheets. These are NOT the source of truth (Postgres is) — if
  they're missing or stale on some host, the admin export endpoints
  (`/api/admin/export/users` and `/api/admin/export/orders`) regenerate
  the same content directly from the database on demand.

None of these are committed to version control (see .gitignore).
