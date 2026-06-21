// Lightweight className combiner — avoids pulling in clsx/tailwind-merge
// as extra dependencies for a single helper.
type ClassInput = string | false | null | undefined | ClassInput[];

export function cn(...inputs: ClassInput[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter(Boolean)
    .join(" ");
}

export function formatPrice(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function generateOrderId() {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `TS-${stamp}-${rand}`.toUpperCase();
}

/**
 * `callbackUrl` query params (used after login/signup to send people
 * back where they came from) must never be allowed to point off-site —
 * otherwise a link like `/login?callbackUrl=https://evil.example` could
 * be used to redirect someone to an attacker's site immediately after
 * they authenticate, which reads as much more trustworthy than a cold
 * phishing link. Only same-origin, relative paths are allowed through;
 * anything else falls back to "/".
 */
export function sanitizeCallbackUrl(url: string | null | undefined): string {
  if (!url) return "/";
  // Must start with a single "/" — rejects absolute URLs (https://...),
  // protocol-relative URLs (//evil.com), and anything with a scheme.
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("://")) {
    return "/";
  }
  return url;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
