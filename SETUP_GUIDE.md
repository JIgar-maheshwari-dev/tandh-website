# Setup Guide — Fresh Ubuntu to Running Site

This walks through everything from a brand-new Ubuntu install to the
site running locally and reachable from your phone, including the new
login system and database.

---

## 1. Update the system & install base tools

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

## 2. Install Node.js 22 (via nvm)

Node 22 is required — not just for Next.js, but specifically because
this project's database layer uses Node's built-in `node:sqlite`
module, which needs Node 22.5 or newer.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22
nvm alias default 22

node -v   # should show v22.x (22.5.0 or higher)
npm -v
```

## 3. Get the project onto the machine

```bash
cd ~
# unzip the project you were given, or git clone if it's in a repo
cd tandh-studio
```

## 4. Install dependencies

```bash
npm install
```

## 5. Configure environment variables

```bash
cp .env.local.example .env.local
nano .env.local
```

At minimum, set these two so the site can even start (required for
authentication to function at all):

```env
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Then set at least one payment method:

```env
NEXT_PUBLIC_UPI_ID=yourvpa@upi
NEXT_PUBLIC_MERCHANT_NAME=tandh studio
```

Google sign-in (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) and
Razorpay (`NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`) are
optional — both features simply hide themselves from the UI until
configured. Full walkthroughs for both are in **README.md**.

Save with `Ctrl+O`, exit with `Ctrl+X`.

## 6. Run the dev server — reachable from your phone too

```bash
npm run dev
```
(This already runs `next dev -H 0.0.0.0` under the hood — see
`package.json` — so it's reachable on your LAN out of the box.)

Visit on the laptop: **http://localhost:3000**

The first time the server starts, it creates `data/tandh.db`
automatically — you don't need to set anything up for the database
itself.

## 7. Create your first account and test a full order

1. Go to `/signup`, create an account with email + password.
2. Browse to a product, add it to your bag (note the MOQ floor).
3. Go to checkout — fill in shipping details, pick UPI as the payment
   method.
4. Try the Google Pay / PhonePe / Paytm buttons (they'll only actually
   open an app on a phone that has them installed — on a laptop
   browser they'll typically do nothing visible, which is expected).
5. Enter any text as a test UTR and submit — you should land on the
   order confirmation page showing "pending verification."
6. Check `data/orders.csv` — your test order should be in there.

## 8. Test on your actual mobile phone (same Wi-Fi)

Find your laptop's local IP:
```bash
hostname -I
```
On your phone (same Wi-Fi network), open `http://<that-ip>:3000`.

Email/password signup and login work identically from your phone. The
UPI app buttons are actually meaningful here, since your phone has
real UPI apps installed — try the Google Pay button on a real low
or test amount once you've set `NEXT_PUBLIC_UPI_ID` to your real VPA.

**Google sign-in note:** if you've configured Google OAuth, it will
NOT work from the phone's LAN IP unless you've also added that exact
`http://<lan-ip>:3000/api/auth/callback/google` URL as an authorized
redirect URI in Google Cloud Console (Google requires an exact match
per URL, not just per domain). Email/password login has no such
restriction. For real mobile testing of Google sign-in, it's easier to
deploy to a real domain first, or just test Google sign-in from the
laptop and everything else from the phone.

**If the phone can't reach the site at all:**
```bash
sudo ufw status
sudo ufw allow 3000
```
and confirm both devices are on the same Wi-Fi network (not one on
mobile data).

## 9. Test the production build

```bash
npm run build
npm start
```
Same access pattern as step 8 (`npm start` also binds to `0.0.0.0`).
This is the optimized build — closer to what real visitors will see.

---

## Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| `node -v` shows below v22.5 | nvm didn't switch correctly — run `nvm use 22` again, or `nvm alias default 22` and open a new terminal |
| "SQLite is an experimental feature" warning on startup | Expected and harmless — it's Node's own stability label, not an error |
| Checkout redirects to `/login` even when logged in | `NEXTAUTH_SECRET` missing/changed — sessions are invalidated whenever that value changes |
| Google button doesn't appear on `/login` | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` not set — expected if you haven't configured Google yet |
| Google sign-in redirects to an error page | Authorized redirect URI in Google Cloud Console doesn't exactly match `NEXTAUTH_URL` + `/api/auth/callback/google` |
| New product doesn't show up | Invalid JSON in `metadata.json` — validate with `cat metadata.json \| python3 -m json.tool` |
| `data/orders.csv` missing | It only appears after the first order — place one and check again |
| Phone can't reach `http://<ip>:3000` | Different Wi-Fi networks, firewall, or router AP isolation |

---

## What gets created automatically (don't worry about these)

- `data/tandh.db` — created on first run
- `data/users.csv` — created on first signup
- `data/orders.csv` — created on first order

None of these exist in a fresh copy of the project, and that's normal.
