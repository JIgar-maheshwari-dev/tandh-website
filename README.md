# tandh studio

A complete, mobile-first Next.js e-commerce site for handwoven Kala
Cotton fabrics and garments from Faradi village, Kutch — folder-based
product catalog, MOQ enforcement, login-gated checkout, live stock
tracking, a Postgres database, UPI + Razorpay payments, and
auto-generated CSV exports.

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
| Stock tracking | Live count in the database, decremented automatically when an order is confirmed |
| Login | Required before checkout — email/password or Google, your choice |
| Database | Postgres (e.g. a free Neon project) — users, orders, and live stock |
| Spreadsheet access | `data/users.csv` and `data/orders.csv`, plus on-demand admin export endpoints |
| Payments | UPI (direct-to-app links, no gateway needed) and/or Razorpay (cards, netbanking, automatic confirmation) |
| Cash on delivery | Does not exist anywhere in this codebase, by design |
| Brand copy (About page) | Editable JSON at `src/content/about.json` and `src/content/brand.json` |
| Logo / favicon | `public/logo/logo.svg` + `src/app/favicon.ico` |
| Homepage hero / category photos | Drop a file in `public/hero/` or `public/category-covers/`, no code change |

---

## Directory structure

```
tandh-studio/
├── data/                             ← CSV exports + local dev secret appear here at runtime
│   ├── README.md
│   └── seed-stock.sql                ← run once to seed demo product stock
├── scripts/
│   └── check-db.mjs                  ← pre-flight DATABASE_URL check (runs before dev/build/start)
├── public/
│   ├── logo/logo.svg                 ← replace with your real mark
│   ├── hero/                         ← drop in hero-image.jpg or hero-video.mp4
│   ├── category-covers/              ← drop in <category-slug>.jpg
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
│   │       ├── stock/route.ts        ← live stock check used by the cart drawer
│   │       ├── checkout/route.ts, checkout/confirm-upi/route.ts
│   │       ├── razorpay/order/route.ts, razorpay/verify/route.ts
│   │       └── admin/export/users/route.ts, admin/export/orders/route.ts
│   ├── components/
│   │   ├── layout/ (TopNav, BottomNav, Footer, Logo)
│   │   ├── cart/CartDrawer.tsx
│   │   ├── product/ (ProductCard, ProductGrid, CategoryBrowser, ProductDetail, MoqStepper, ImageCarousel, CraftAccordion, SustainabilityBadges)
│   │   ├── checkout/CheckoutForm.tsx
│   │   ├── auth/ (LoginForm, SignupForm, PasswordInput)
│   │   └── home/ (Hero, StorySection, CategoryTeaser)
│   ├── lib/
│   │   ├── db.ts                     ← Postgres connection pool + schema
│   │   ├── userStore.ts, orderStore.ts
│   │   ├── stockStore.ts             ← live stock, decremented on order confirmation
│   │   ├── orderValidation.ts        ← re-prices/re-validates every order server-side
│   │   ├── csvExport.ts
│   │   ├── auth.ts                   ← NextAuth config
│   │   ├── cartStore.tsx             ← cart Context + localStorage
│   │   ├── paymentConfig.ts          ← UPI / Google Pay / PhonePe / Paytm / Razorpay
│   │   ├── mediaLookup.ts            ← hero/category-cover file auto-detection
│   │   └── productLoader.ts          ← reads public/products/ from disk, overlays live stock
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
  "images": ["image1.jpg", "image2.jpg"],
  "featured": true,
  "newArrival": false,
  "sizes": ["S", "M", "L", "XL"]
}
```

Delete the folder to remove a product. Restart `npm run dev` (or just
refresh — the dev server picks up new folders on the next request) to
see changes. No database entry needed for the catalog content above —
it's read live from disk.

**Fabric-style MOQ** (minimum 2 metres, half-metre increments):
```json
{ "moq": 2, "moqUnit": "meters", "moqStep": 0.5 }
```

MOQ is enforced in three places: the stepper UI, the cart drawer, and
again inside `/api/checkout` against the real metadata.json on disk —
so a tampered request body can't undercut it.

**Notice there's no `stock` field above** — it's been removed entirely
on purpose. See "Stock management" below: every product's stock is
purely a database value, full stop. A new product folder defaults to
**0 (out of stock)** the moment it's first viewed, until you explicitly
set a real number in the database. There's no metadata fallback and no
"unlimited if not specified" behavior, by design — a product can never
be silently oversold just because nobody remembered to set its stock.

---

## Stock management

Stock lives **only** in the `product_stock` table — never in
`metadata.json`, never anywhere on disk. Every page that shows stock
(`/`, `/categories`, `/categories/[category]`, and the product detail
page) is forced to render fresh on every single request
(`export const dynamic = "force-dynamic"`) specifically so this is
never frozen as stale build-time HTML — if you update stock directly in
the database, the very next page load reflects it immediately, with no
rebuild and no redeploy needed.

It decreases automatically the moment an order is confirmed:

- **UPI orders**: the moment the customer submits their UTR and lands
  on the "Order Received" confirmation page.
- **Razorpay orders**: the moment the payment signature is verified.

Each order can only trigger a decrement once, even if a request is
retried or a UTR is resubmitted — guarded by checking the order hasn't
already moved past `pending_payment` before decrementing.

It's also enforced **before** that point, in two more places:
- **The cart drawer** fetches live stock the moment it's opened (via
  `GET /api/stock`) and caps the "+" button at whatever's actually
  available right now — not whatever was available when the item was
  first added. If stock has since dropped below what's already in the
  bag, a clear warning appears and checkout is blocked until the
  quantity is adjusted down.
- **`/api/checkout`** re-checks stock server-side regardless of what
  the cart UI did or didn't catch, the same way price and MOQ are
  re-checked — the authoritative limit is always the live database
  value at the moment of checkout, never anything cached client-side.

Stock is also enforced at checkout: ordering more than what's currently
available is rejected server-side with a clear error, the same way an
MOQ violation is. The product page also disables "Add to Bag" entirely
once stock hits zero, and shows an "Out of Stock" badge on the grid
card.

**To restock a product**, update the database directly — there's no
admin UI for this yet:
```sql
UPDATE product_stock SET stock = 50
WHERE category = 'fabric' AND product_id = 'kala-cotton-01';
```
Run that against your `DATABASE_URL` using any Postgres client (Neon's
own dashboard has a built-in SQL editor for exactly this), or via
`psql` if you have it installed locally.

**For the three demo products bundled with this project**, there's a
ready-made script instead of typing that by hand three times:
```bash
psql "$DATABASE_URL" -f data/seed-stock.sql
```
This only works after the app has run at least once (the
`product_stock` table needs to already exist) — run the dev server
once first, then run this.

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

Users, orders, and live stock are stored in **Postgres** — a real,
standard SQL database, not a proprietary format. The app talks to it
through the plain `pg` driver, so it works with literally any Postgres
provider: a free [Neon](https://neon.tech) project (recommended — see
`.env.local.example`), Supabase, Render Postgres, or a self-hosted
instance. Swapping providers later is purely a `DATABASE_URL` change.

**This app assumes a working database connection from the very first
moment, full stop.** `npm run dev`, `npm run build`, and `npm start`
each run a quick connectivity check first (`scripts/check-db.mjs`,
wired in as `predev`/`prebuild`/`prestart`) and refuse to continue with
a clear, actionable error if `DATABASE_URL` is missing or unreachable
— rather than letting a misconfigured deploy go live and silently
treat every product as having no stock. If you ever see "Database
check failed" in your terminal or in a deploy log, that's this check
doing its job, not a separate bug.

```bash
psql "$DATABASE_URL" -c "SELECT * FROM orders;"
```
(Neon's own dashboard also has a built-in SQL editor if you'd rather
not install `psql` locally.)

**For day-to-day use, you don't need SQL at all.** Two CSV files are
regenerated automatically every time something changes:

- `data/users.csv` — every signup
- `data/orders.csv` — every order, with items and shipping address
  flattened into readable columns, plus payment status

Open either directly in Excel or Google Sheets. These are a convenience
export, not the source of truth — the database is authoritative, so
it's fine if this local file doesn't survive a restart on a host with
an ephemeral filesystem; it's just regenerated from the database again
on the next write.

If you'd rather download them remotely instead of opening the file on
disk (e.g. from your phone while the server runs elsewhere), set
`ADMIN_EXPORT_KEY` in `.env.local` and visit:

```
https://<your-domain>/api/admin/export/users?key=<your key>
https://<your-domain>/api/admin/export/orders?key=<your key>
```
These generate the CSV directly from the database on each request, so
they work identically whether or not the local disk persisted anything.

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

## Homepage hero & category photos

Both are file-drop configurable — no code changes needed:

- **Hero background** (behind the "Explore Earth-Born Kala Cotton"
  text): drop a video at `public/hero/hero-video.mp4` (or `.webm`), or
  a photo at `public/hero/hero-image.jpg` (`.jpeg`/`.png`/`.webp` also
  work). Video takes priority if both exist. Neither file present →
  falls back to the built-in generated pattern automatically.
- **Fabrics / Apparel card backgrounds** on the homepage: drop a photo
  at `public/category-covers/<slug>.jpg`, where `<slug>` matches the
  category folder name under `public/products/` (so `fabric.jpg` and
  `shirts.jpg` for the current categories). Missing file for a given
  category → that card just keeps the woven-pattern background.

Full naming details and recommended dimensions are in the README.md
files inside each of those two folders.

**One thing to know about timing:** locally with `npm run dev`, a
dropped-in file shows up the moment you refresh the page. On a
deployed copy (Render, etc.), the homepage is built once at deploy
time, so a new photo won't appear until the next deploy — which
already happens automatically on every `git push` (see DEPLOY.md), so
in practice it's: commit, push, wait for the build to finish, refresh.

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
- The site declares `color-scheme: light` (both via Next's `viewport`
  export and in CSS) — without this, some Android browsers' automatic
  dark-mode heuristics can recolor an unmarked page unpredictably,
  which is what was causing the mobile hamburger menu to sometimes
  look like unreadable text mixed into the background. The menu panel
  itself is also a fully opaque background with a strong shadow and an
  accent border, and the backdrop behind it is blurred, so it reads as
  a distinct layer above the page regardless.
- The cart drawer fetches live stock the moment it opens and caps each
  item's "+" button at what's actually available — see "Stock
  management" above.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS, custom earthy palette |
| Icons | lucide-react |
| Auth | NextAuth.js (Google + email/password, JWT sessions) |
| Database | Postgres via `pg` (free Neon project recommended) |
| State | React Context + localStorage (cart only — never auth) |
| Product catalog | Local filesystem (stock count lives in the database, everything else doesn't need a DB) |
| Payments | UPI deep links + Razorpay |
| Language | TypeScript |

---

## Deployment notes

- Set every variable from `.env.local.example` in your hosting
  platform's environment variable manager — never commit `.env.local`.
- Because the database is now a separate, persistent Postgres instance
  (Neon or otherwise) rather than a local file, **the app itself no
  longer needs a persistent disk to keep real data** — you can deploy
  it to genuinely ephemeral/ serverless hosts (including free tiers
  that reset their local filesystem on every restart) and your users
  and orders still survive, since they never lived on that local disk
  to begin with. See DEPLOY.md.
- `generateStaticParams` for product pages queries the database at
  *build* time (to read live stock), so `DATABASE_URL` needs to be set
  and reachable during the build step, not just at runtime — most
  platforms (Render included) make environment variables available to
  both automatically, but it's worth knowing if a build ever fails with
  a database connection error.
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
