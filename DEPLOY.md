# Deploying for Free (Render.com + Neon Postgres)

Goal: a real public HTTPS URL, no credit card anywhere in this setup.
Unlike the earlier version of this app (SQLite on local disk), **your
data now genuinely persists** with this combo — not just "good enough
for a quick test." Users, orders, and stock all live on Neon's free
Postgres, which is completely independent of whatever happens to
Render's web service (restarts, spin-downs, redeploys). Render only
needs to run the Next.js process itself; it doesn't need to keep
anything on its own local disk anymore.

---

## 1. Set up Neon (if you haven't already)

See the Database section in README.md / step 5 in SETUP_GUIDE.md if
you skipped this for local dev — same database, same connection
string, works for both.

## 2. Push the project to GitHub

Render deploys from a Git repo (GitHub, GitLab, or Bitbucket). A
private repo is fine and still free.

```bash
cd tandh-studio
git init
git add .
git commit -m "Initial commit"
```
Create an empty repo on GitHub, then:
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 3. Create the Render web service

1. Go to [render.com](https://render.com) → sign up with GitHub (no card needed).
2. **New +** → **Web Service** → connect your repo.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance type**: Free
4. Don't deploy yet — add the environment variables first (next step), then deploy.

## 4. Environment variables

In the Render dashboard, under **Environment**, add everything from
your local `.env.local`, **including `DATABASE_URL`** — use the exact
same Neon connection string you're using locally (or create a second
Neon project if you'd rather keep dev/prod data separate; either is
fine on the free tier):

```env
DATABASE_URL=<your Neon connection string>
NEXTAUTH_SECRET=<openssl rand -base64 32 — can reuse your local one, or generate a fresh one>
NEXTAUTH_URL=https://<your-app-name>.onrender.com
NEXT_PUBLIC_UPI_ID=yourvpa@upi
NEXT_PUBLIC_MERCHANT_NAME=tandh studio
ADMIN_EXPORT_KEY=<any long random string>
```

You'll know the exact `onrender.com` URL after the first deploy — go
back and fix `NEXTAUTH_URL` to match it exactly, then redeploy (Render
auto-redeploys on env var changes).

If you're also testing Google sign-in, add `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET`, and add this exact URL as an authorized
redirect URI in Google Cloud Console (in addition to the localhost one
you already have):
```
https://<your-app-name>.onrender.com/api/auth/callback/google
```

## 5. Deploy and test

Render builds and gives you a live URL. Test the whole flow exactly
like you did locally: signup, login, browse, add to cart, checkout,
confirm payment, check that stock decremented. This is also a great
mobile test — it's a real public HTTPS URL, so there's no Wi-Fi/router/
Host-header fuss at all. Just open the `onrender.com` URL on your phone
over normal mobile data or Wi-Fi.

**One thing worth knowing about the free web service itself** (this is
about Render specifically, not your data): it spins down after 15
minutes of no traffic and takes ~30-60 seconds to wake back up on the
next request. That's a minor UX hiccup for an occasional visitor on a
cold start, not a data-loss risk — your database isn't affected by it
at all, since it's not running on that same instance.

---

## Checking order details on the remote server

You don't need SSH or server access — the CSV export endpoints already
built into the app work over plain HTTPS, generated fresh from the
database on every request:

```
https://<your-app-name>.onrender.com/api/admin/export/orders?key=<your ADMIN_EXPORT_KEY>
https://<your-app-name>.onrender.com/api/admin/export/users?key=<your ADMIN_EXPORT_KEY>
```

Open either URL in a browser (or `curl` it) and it downloads the CSV
directly. You can also just query Neon directly — its dashboard has a
built-in SQL editor, or use `psql "$DATABASE_URL"` from anywhere with
network access.

---

## On Neon's free tier limits

0.5 GB storage, ~100 compute-hours/month, and it's a permanent free
tier (not a trial) — not "free for 30 days" like some alternatives.
For a small shop's users/orders/stock tables, that's a lot of runway.
The database also "scales to zero" when idle, meaning the very first
request after a quiet period takes a touch longer while it spins back
up (similar idea to Render's own free-tier cold start, just on the
database side instead).

If you ever do outgrow the free tier (a lot of orders, basically),
Neon's paid plans start cheap and it's a billing change, not a
migration — same connection string format, same code.
