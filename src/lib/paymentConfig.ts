// Central place for everything payment-related. COD is intentionally
// never modeled here — there is no status or code path for it anywhere
// in the app.

export const PAYMENT_CONFIG = {
  upiId: process.env.NEXT_PUBLIC_UPI_ID || "",
  merchantName: process.env.NEXT_PUBLIC_MERCHANT_NAME || "tandh studio",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
};

export function isUpiConfigured() {
  return Boolean(PAYMENT_CONFIG.upiId);
}

export function isRazorpayConfigured() {
  return Boolean(PAYMENT_CONFIG.razorpayKeyId);
}

/**
 * Builds a standard UPI deep link (upi://pay?...) that opens the user's
 * default UPI app (GPay / PhonePe / Paytm / BHIM) with the amount and
 * payee VPA pre-filled. This works with just a personal/business UPI ID
 * in .env.local — no payment gateway account required.
 */
export function buildUpiLink(params: { amount: number; note: string; txnRef: string }) {
  const { upiId, merchantName } = PAYMENT_CONFIG;
  const query = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    tr: params.txnRef,
    tn: params.note,
    am: params.amount.toFixed(2),
    cu: "INR",
  });
  return `upi://pay?${query.toString()}`;
}

/**
 * App-specific deep links. Each major UPI app also registers its own
 * URI scheme alongside the generic `upi://` one — using it opens that
 * exact app directly (skipping Android's "choose an app" sheet) with
 * the amount and your UPI ID already filled in, so the customer never
 * types either one.
 *
 * Deliberately NOT using Android's `intent://...#Intent;package=...;end`
 * syntax here: that syntax auto-falls-back to the Play Store listing
 * when the named app isn't installed, which is exactly the "opens Play
 * Store instead of the app" behaviour you want to avoid. A plain custom
 * scheme link like `tez://...` has no such fallback — if the app isn't
 * installed, the browser simply can't open the link (and typically
 * shows nothing or a small native "can't open this link" notice),
 * instead of pushing the customer toward an app store.
 *
 * Coverage note: these schemes work reliably on Android. iOS support
 * for third-party custom URI schemes varies by app/OS version, so the
 * generic `upi://` link (buildUpiLink) is kept as the universal fallback
 * option on every platform.
 */
export function buildGooglePayLink(params: { amount: number; note: string; txnRef: string }) {
  const { upiId, merchantName } = PAYMENT_CONFIG;
  const query = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    tr: params.txnRef,
    tn: params.note,
    am: params.amount.toFixed(2),
    cu: "INR",
  });
  return `tez://upi/pay?${query.toString()}`;
}

export function buildPhonePeLink(params: { amount: number; note: string; txnRef: string }) {
  const { upiId, merchantName } = PAYMENT_CONFIG;
  const query = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    tr: params.txnRef,
    tn: params.note,
    am: params.amount.toFixed(2),
    cu: "INR",
  });
  return `phonepe://pay?${query.toString()}`;
}

export function buildPaytmLink(params: { amount: number; note: string; txnRef: string }) {
  const { upiId, merchantName } = PAYMENT_CONFIG;
  const query = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    tr: params.txnRef,
    tn: params.note,
    am: params.amount.toFixed(2),
    cu: "INR",
  });
  return `paytmmp://pay?${query.toString()}`;
}

/**
 * Builds a UPI QR payload string — same format as the deep link, which
 * any UPI app can scan from a QR code rendered with a QR library if you
 * add one later (e.g. `qrcode.react`).
 */
export function buildUpiQrPayload(params: { amount: number; note: string; txnRef: string }) {
  return buildUpiLink(params);
}
