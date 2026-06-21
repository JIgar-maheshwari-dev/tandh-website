# tandh studio

A complete, mobile-first Next.js e-commerce site for handwoven Kala
Cotton fabrics and garments from Faradi village, Kutch — folder-based
product catalog, MOQ enforcement, login-gated checkout, a real SQLite
database, UPI + Razorpay payments, and auto-generated CSV exports.

For a step-by-step "fresh Ubuntu machine to running site" walkthrough,
see **SETUP_GUIDE.md**. For deploying to a free, temporary remote host
to test it outside your own network, see **DEPLOY.md**. This file is
the reference for how everything works once it's running.

---

## What's actually in here

| Concern | How it's handled |
|---|---|
| Product catalog | Folders on disk under `public/products/`, no code changes to add/remove a product |
| Minimum order quantities | Enforced in the UI *and* re-validated server-side at checkout |
| Login | Required before checkout — email/password or Google, your choice |
| Database | Real SQLite file at `data/tandh.db` (users + orders) |
| Spreadsheet access | `data/users.csv` and `data/orders.csv`, auto-regenerated on every write |
| Payments | UPI (direct-to-app links, no gateway needed) and/or Razorpay (cards, netbanking, automatic confirmation) |
| Cash on delivery | Does not exist anywhere in this codebase, by design |
| Brand copy (About page) | Editable JSON at `src/content/about.json` and `src/content/brand.json` |
| Logo / favicon | `public/logo/logo.svg` + `src/app/favicon.ico` |

---

## Directory structure

```
tandh-studio/
├── data/                             ← SQLite DB + CSV exports appear here at runtime
│   └── README.md
├── public/
│   ├── logo/logo.svg                 ← replace with your real mark
│   └── products/
│       ├── fabric/kala-cotton-01/{metadata.json, image1.jpg, ...}
│       ├── shirts/bhujodi-shirt-01/{...}
│       └── kurtis/indigo-kurti-01/{...}
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← Homepage
│   │   ├── layout.tsx                ← Root layout, fonts, providers
│   │   ├── login/page.tsx, signup/page.tsx
│   │   ├── categories/(...)          ← All products / per-category
│   │   ├── products/[category]/[productId]/page.tsx
│   │   ├── checkout/page.tsx         ← Login-gated
│   │   ├── order-confirmation/[orderId]/page.tsx
│   │   ├── about/page.tsx, wholesale/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts, auth/register/route.ts
│   │       ├── products/route.ts
│   │       ├── checkout/route.ts, checkout/confirm-upi/route.ts
│   │       ├── razorpay/order/route.ts, razorpay/verify/route.ts
│   │       └── admin/export/users/route.ts, admin/export/orders/route.ts
│   ├── components/
│   │   ├── layout/ (TopNav, BottomNav, Footer, Logo)
│   │   ├── cart/CartDrawer.tsx
│   │   ├── product/ (ProductCard, ProductGrid, CategoryBrowser, ProductDetail, MoqStepper, ImageCarousel, CraftAccordion, SustainabilityBadges)
│   │   ├── checkout/CheckoutForm.tsx
│   │   ├── auth/ (LoginForm, SignupForm)
│   │   └── home/ (Hero, StorySection, CategoryTeaser)
│   ├── lib/
│   │   ├── db.ts                     ← SQLite connection + schema
│   │   ├── userStore.ts, orderStore.ts
│   │   ├── orderValidation.ts        ← re-prices/re-validates every order server-side
│   │   ├── csvExport.ts
│   │   ├── auth.ts                   ← NextAuth config
│   │   ├── cartStore.tsx             ← cart Context + localStorage
│   │   ├── paymentConfig.ts          ← UPI / Google Pay / PhonePe / Paytm / Razorpay
│   │   └── productLoader.ts          ← reads public/products/ from disk
│   ├── content/
│   │   ├── about.json                ← edit this to change the About page
│   │   └── brand.json                ← site name, contact, footer, wholesale blurb
│   └── types/index.ts
├── .env.local.example
└── package.json
```

---

## Adding / removing products

1. Create a folder: `public/products/<category>/<product-id>/`
2. Drop in images: `image1.jpg`, `image2.jpg`, ...
3. Add `metadata.json`:

```json
{
  "id": "your-product-id",
  "title": "Product Name",
  "subtitle": "Brief descriptor",
  "price": 2500,
  "priceUnit": "per piece",
  "currency": "INR",
  "category": "shirts",
  "description": "Full description...",
  "craftStory": "...",
  "weaveType": "Bhujodi extra-weft...",
  "dyeProcess": "Natural indigo...",
  "careInstructions": "Cold hand-wash...",
  "details": ["100% Kala Cotton", "Natural dye"],
  "tags": ["Ajrakh", "Natural dye", "Kutch"],
  "badges": ["100% Organic", "Artisan Made"],
  "moq": 1,
  "moqUnit": "pieces",
  "moqStep": 1,
  "stock": 10,
  "images": ["image1.jpg", "image2.jpg"],
  "featured": true,
  "newArrival": false,
  "sizes": ["S", "M", "L", "XL"]
}
```

Delete the folder to remove a product. Restart `npm run dev` (or just
refresh — the dev server picks up new folders on the next request) to
see changes. No database entry needed for products — they're read live
from disk.

**Fabric-style MOQ** (minimum 2 metres, half-metre increments):
```json
{ "moq": 2, "moqUnit": "meters", "moqStep": 0.5 }
```

MOQ is enforced in three places: the stepper UI, the cart drawer, and
again inside `/api/checkout` against the real metadata.json on disk —
so a tampered request body can't undercut it.

---

## Authentication

Checkout requires being signed in. Two ways in:

1. **Email + password** — `/signup` creates an account (password
   hashed with bcrypt), `/login` signs in. Works immediately, no setup.
2. **Google** — only appears once you configure it (see below). First
   sign-in with a given Google account auto-creates a matching local
   user record.

Sessions are JWT-based (no server-side session table needed). The
actual security boundary is server-side: `/api/checkout` and the
payment-confirmation routes check `getServerSession()` themselves and
reject unauthenticated requests with `401` — the `/checkout` page
redirect to `/login` is just the convenience layer on top.

### Setting up Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. **APIs & Services → OAuth consent screen** — set it up (External, fill in app name/support email).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type **Web application**.
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (Add your real domain's equivalent later when you deploy.)
5. Copy the generated **Client ID** and **Client Secret** into `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
6. Restart the dev server. The "Continue with Google" button appears on `/login` automatically once both values are set — it's hidden otherwise.

> Testing Google sign-in from your phone over your LAN IP (e.g.
> `http://192.168.1.42:3000`) won't work unless you also add that exact
> IP-based URL as an authorized redirect URI in Google Cloud Console —
> Google requires an exact match. Email/password login has no such
> restriction and works from any device/IP immediately.

Also set `NEXTAUTH_SECRET` (any long random string — `openssl rand -base64 32`) and `NEXTAUTH_URL` (matching whatever URL you're running on) in `.env.local`. Both are required for NextAuth to work at all, with or without Google.

---

## Database & spreadsheet access

Everything is stored in a real SQLite database at `data/tandh.db`,
using Node's built-in `node:sqlite` module — no separate database
server, no native module to compile, just a single file. Open it with
any SQLite browser tool, or:

```bash
sqlite3 data/tandh.db "SELECT * FROM orders;"
```

**For day-to-day use, you don't need SQL at all.** Two CSV files are
regenerated automatically every time something changes:

- `data/users.csv` — every signup
- `data/orders.csv` — every order, with items and shipping address
  flattened into readable columns, plus payment status

Open either directly in Excel or Google Sheets. If you'd rather
download them remotely instead of opening the file on disk (e.g. from
your phone while the server runs on your laptop), set `ADMIN_EXPORT_KEY`
in `.env.local` and visit:

```
http://<your-ip>:3000/api/admin/export/users?key=<your key>
http://<your-ip>:3000/api/admin/export/orders?key=<your key>
```

These contain real names, emails, and shipping addresses — keep the key
private, and don't deploy without setting it to something non-guessable.

---

## Payments

**Cash on delivery does not exist in this codebase** — there's no
status, button, or code path for it anywhere.

### UPI (no gateway account needed)

Set in `.env.local`:
```env
NEXT_PUBLIC_UPI_ID=yourvpa@upi
NEXT_PUBLIC_MERCHANT_NAME=tandh studio
```

At checkout, the customer sees separate **Google Pay**, **PhonePe**,
**Paytm**, and **Other UPI App** buttons. Each opens that exact app
directly — not a generic "choose an app" picker, and never a redirect
to the Play Store — with your UPI ID and the order amount already
filled in. The customer only has to tap **Pay** inside the app; nothing
to type.

**Important limitation, explained honestly:** a personal/business UPI
ID with no payment gateway behind it has no way to automatically tell
this website "the payment succeeded" — there's no webhook, by design,
since anyone could otherwise fake that callback. So for the UPI-only
path, the customer enters the UPI transaction reference (UTR) shown in
their payment app after paying, and the order is marked
`pending_verification` (not `paid`) until you check that reference
against your bank/UPI statement and update it. This is the most honest
thing a no-gateway flow can do — anything claiming instant automatic
confirmation from a bare personal VPA would be lying about how UPI
actually works.

### Razorpay (optional — real automatic confirmation)

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```
Get keys from [dashboard.razorpay.com](https://dashboard.razorpay.com/app/keys).

This is the path that gives the experience of "pay, the payment sheet
closes itself, and the site shows success with no manual step" —
Razorpay's checkout already deep-links into installed UPI apps the
same way, but also receives a verifiable server-side signature once
payment completes (`/api/razorpay/verify` checks an HMAC-SHA256
signature against your secret — an order is only ever marked `paid`
once that check passes). If you want fully automatic confirmation
including for UPI payments, this is the way to get it; the personal-UPI
path above cannot offer the same guarantee at the protocol level, with
or without code changes.

---

## Customizing brand content

- **About page copy**: edit `src/content/about.json` — headings,
  paragraphs, and the three stat numbers all come from there.
- **Site name, tagline, contact emails, footer note, wholesale blurb,
  social links**: `src/content/brand.json`.
- **Logo / favicon**: replace `public/logo/logo.svg` with your real
  mark (square, works at small sizes). Regenerate `src/app/favicon.ico`
  from the same mark with any favicon generator, or ask for help
  regenerating it from a new logo file.

---

## Mobile UX details

- Sticky bottom nav (mobile only) and a sticky "Add to Bag" bar on
  product pages are deliberately offset from each other (`bottom-16`
  vs `bottom-0`) so they never overlap or cover one another.
- Wishlist and Add-to-Bag buttons use flex layout with explicit gaps,
  never absolute-positioned on top of each other.
- Filter sidebar collapses into a bottom sheet under `lg:`.
- Touch targets are ≥44×44px (`.tap-target` utility class).
- `env(safe-area-inset-*)` support for notched phones.
- `maximum-scale=1` in the viewport meta tag prevents iOS auto-zoom on
  input focus.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS, custom earthy palette |
| Icons | lucide-react |
| Auth | NextAuth.js (Google + email/password, JWT sessions) |
| Database | SQLite via Node's built-in `node:sqlite` |
| State | React Context + localStorage (cart only — never auth) |
| Product data | Local filesystem (no DB needed for the catalog) |
| Payments | UPI deep links + Razorpay |
| Language | TypeScript |

---

## Deployment notes

- Set every variable from `.env.local.example` in your hosting
  platform's environment variable manager — never commit `.env.local`.
- `data/tandh.db` and the CSV files need a writable, **persistent**
  filesystem. Don't deploy to a purely serverless/ephemeral platform
  (most "Edge" runtimes, or containers without a mounted volume) and
  expect the database to survive a redeploy — a small VPS, a
  traditional Node host, or a platform with persistent disk/volume
  support is what this needs.
- Update the Google OAuth authorized redirect URI and `NEXTAUTH_URL` to
  your real domain once deployed.

---

## License

Private — tandh studio internal use.

---

## Fixes applied from real dev-server logs (read this if upgrading)

Three issues, found from an actual `npm start` log you shared:

1. **Sessions broke on every server restart** (`JWT_SESSION_ERROR`,
   `decryption operation failed`). Cause: `NEXTAUTH_SECRET` wasn't set,
   so next-auth silently generated a brand-new random secret every time
   the process started — instantly invalidating every existing login
   cookie. Fixed by persisting a generated secret to
   `data/.nextauth-secret` on first run and reusing it across restarts.
   **You should still set `NEXTAUTH_SECRET` yourself** before any real
   deployment — this file is a local-dev convenience, not a production
   secret-management strategy.

2. **Login worked on the laptop but not on the phone.** Cause:
   `NEXTAUTH_URL` is a single fixed value (e.g. `http://localhost:3000`),
   and next-auth anchors all callback/redirect URLs to it *unless* told
   to trust the incoming request's Host header instead. Without that,
   every request from your phone's LAN IP was being silently treated as
   if it came from `localhost` — which means nothing on the phone
   itself. Fixed by setting `AUTH_TRUST_HOST=true` automatically (see
   `src/lib/auth.ts` for the security note on what this trusts).

3. **Google sign-in didn't appear at all.** Not a bug — the "Continue
   with Google" button is intentionally hidden until
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set (see the Google
   Sign-In section above). Once set, the real Google account-chooser
   screen appears exactly as on other sites.

Also added while investigating:

- **Show/hide password toggle** (eye icon) on both `/login` and `/signup`.
- **Open-redirect fix**: the `?callbackUrl=` parameter used to send you
  back to where you came from after login is now validated to only
  allow same-site relative paths — previously a crafted link like
  `/login?callbackUrl=https://evil.example` could have redirected
  someone to an external site immediately after a real, successful
  login on your actual site, which is a classic phishing setup.
