# Deploying for a Free, Temporary Remote Test (Render.com)

Goal: a real public HTTPS URL, no credit card, no payment plan — just to
confirm the site behaves correctly off your own machine. Render's free
tier is the best fit: it's a genuine long-running container (not
serverless), so the app runs exactly like it does locally, no card
required to start.

**The one thing to know going in:** Render's free web services don't
get a persistent disk. The SQLite file (`data/tandh.db`) will work fine
while the instance is running, but gets wiped whenever it restarts —
which happens automatically after 15 minutes of no traffic (it "spins
down" and "spins back up" on the next request, taking ~30-60 seconds).
For checking that signup/login/checkout/payments *behave correctly*
remotely, that's perfectly fine. Don't treat any data you create there
as something to keep. See the "If you want it to actually persist"
section at the bottom if you want that instead.

---

## 1. Push the project to GitHub

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

## 2. Create the Render web service

1. Go to [render.com](https://render.com) → sign up with GitHub (no card needed).
2. **New +** → **Web Service** → connect your repo.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance type**: Free
4. Don't deploy yet — add the environment variables first (next step), then deploy.

## 3. Environment variables

In the Render dashboard, under **Environment**, add:

```env
NEXTAUTH_SECRET=<openssl rand -base64 32>
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

## 4. Deploy and test

Render builds and gives you a live URL. Test the whole flow exactly
like you did locally: signup, login, browse, add to cart, checkout.
This is actually a *better* mobile test than your LAN setup — it's a
real public HTTPS URL, so there's no Wi-Fi/router/Host-header fuss at
all. Just open the `onrender.com` URL on your phone over normal mobile
data or Wi-Fi.

---

## Checking order details on the remote server

You don't need SSH or server access — the CSV export endpoints already
built into the app work over plain HTTPS:

```
https://<your-app-name>.onrender.com/api/admin/export/orders?key=<your ADMIN_EXPORT_KEY>
https://<your-app-name>.onrender.com/api/admin/export/users?key=<your ADMIN_EXPORT_KEY>
```

Open either URL in a browser (or `curl` it) and it downloads the CSV
directly — same files that get written to `data/orders.csv` and
`data/users.csv` on the server itself, just fetched remotely.

---

## Is SQLite "available" on a remote server?

Yes, unconditionally — `node:sqlite` ships inside Node.js itself, not
as a separate install, so it works wherever Node 22.5+ runs, Render
included. The thing that actually varies between hosting platforms
isn't SQLite's availability, it's whether you get a **persistent
disk** to keep that file on between restarts. Render's free tier
doesn't include one (see above). A few platforms that genuinely do, if
you want actual persistence later, all without requiring SQLite-specific
support since the database itself just needs disk:

- Render **paid** tier (~$7/mo) — adds a real persistent disk
- A basic always-on VM (e.g. a small DigitalOcean/Hetzner box, or your
  own machine via a tunnel) — full persistent disk, but not free
- Switching the database itself to a free **hosted** database (next section)

---

## If you want it to actually persist (still free, still no card)

Render also gives every account one **free PostgreSQL database** — 1GB,
no card, but it expires 30 days after creation (with a 14-day grace
period before deletion). That's a real persistent SQL database you can
connect to over the network, which sidesteps the "no disk on free web
services" limitation entirely, and conveniently matches "temporary"
almost exactly — it auto-expires instead of you needing to remember to
tear it down.

This needs a real code change, though: `node:sqlite` only talks to a
local file, not a network database. Swapping `src/lib/db.ts` (and the
handful of files that use it — `userStore.ts`, `orderStore.ts`,
`csvExport.ts`) to use Postgres instead (via the `pg` package) is a
contained change since those were already the only files touching the
database directly. **Let me know if you want this and I'll do the
migration** — otherwise, deploying as-is to test behavior (with the
understanding that data resets on restart) is the simpler path and
matches what you asked for.
