"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartStore";
import { formatPrice } from "@/lib/utils";
import { buildUpiLink, buildGooglePayLink, buildPhonePeLink, buildPaytmLink, isRazorpayConfigured, isUpiConfigured } from "@/lib/paymentConfig";
import type { CustomerDetails, PaymentMethod } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutForm({ userEmail, userName }: { userEmail: string; userName: string }) {
  const { items, totalPrice, hasMoqViolation, clearCart } = useCart();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetails>({
    ...EMPTY_CUSTOMER,
    name: userName || "",
    email: userEmail || "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isRazorpayConfigured() ? "razorpay" : "upi"
  );
  const [stage, setStage] = useState<"details" | "pay">("details");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [utr, setUtr] = useState("");

  const handleField = (field: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCustomer((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create order.");
        return;
      }
      setOrderId(data.orderId);
      setAmount(data.amount);
      setStage("pay");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRazorpayPay = async () => {
    if (!orderId) return;
    setError(null);
    setBusy(true);
    try {
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Could not start Razorpay payment.");
        setBusy(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError("Could not load Razorpay checkout. Check your internet connection.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "tandh studio",
        description: `Order ${orderId}`,
        order_id: orderData.razorpayOrderId,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#B85C38" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.status === "paid") {
            clearCart();
            router.push(`/order-confirmation/${orderId}`);
          } else {
            setError("Payment could not be verified. Please contact support before retrying.");
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch {
      setError("Something went wrong starting the payment.");
      setBusy(false);
    }
  };

  const handleUpiConfirm = async () => {
    if (!orderId || utr.trim().length < 4) {
      setError("Enter the UPI transaction reference (UTR) number from your payment app.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/confirm-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, utr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not record your payment reference.");
        return;
      }
      clearCart();
      router.push(`/order-confirmation/${orderId}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-bark">Your bag is empty — add something before checking out.</p>;
  }

  if (hasMoqViolation && stage === "details") {
    return (
      <p className="text-terracotta">
        One or more items in your bag are below their minimum order quantity. Please update quantities in your bag before checking out.
      </p>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        {stage === "details" && (
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <h2 className="font-serif text-xl text-ink mb-2">Shipping Details</h2>
            <Input label="Full Name" value={customer.name} onChange={handleField("name")} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={customer.email} onChange={handleField("email")} required />
              <Input label="Phone" type="tel" value={customer.phone} onChange={handleField("phone")} required />
            </div>
            <Input label="Address Line 1" value={customer.addressLine1} onChange={handleField("addressLine1")} required />
            <Input label="Address Line 2 (optional)" value={customer.addressLine2 ?? ""} onChange={handleField("addressLine2")} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="City" value={customer.city} onChange={handleField("city")} required />
              <Input label="State" value={customer.state} onChange={handleField("state")} required />
              <Input label="Pincode" value={customer.pincode} onChange={handleField("pincode")} required />
            </div>

            <div className="pt-4">
              <h3 className="text-xs uppercase tracking-widest2 text-bark mb-3">Payment Method</h3>
              <p className="text-xs text-bark mb-3">
                Pre-paid only — cash on delivery is not available.
              </p>
              {isRazorpayConfigured() && (
                <p className="text-xs text-bark mb-3">
                  <span className="text-ink font-medium">Card / UPI / Netbanking</span> confirms
                  automatically and supports UPI too (it opens your UPI app the same way, then returns
                  here on its own). The separate <span className="text-ink font-medium">UPI</span>{" "}
                  option below pays directly to our UPI ID without a gateway, but needs a quick manual
                  check afterward.
                </p>
              )}
              <div className="flex gap-3">
                {isRazorpayConfigured() && (
                  <PaymentOption
                    active={paymentMethod === "razorpay"}
                    onClick={() => setPaymentMethod("razorpay")}
                    label="Card / UPI / Netbanking"
                  />
                )}
                {isUpiConfigured() && (
                  <PaymentOption
                    active={paymentMethod === "upi"}
                    onClick={() => setPaymentMethod("upi")}
                    label="UPI (GPay / PhonePe / Paytm)"
                  />
                )}
              </div>
              {!isRazorpayConfigured() && !isUpiConfigured() && (
                <p className="text-sm text-terracotta mt-2">
                  No payment method is configured yet — set NEXT_PUBLIC_UPI_ID in .env.local.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-terracotta">{error}</p>}

            <button
              type="submit"
              disabled={busy || (!isRazorpayConfigured() && !isUpiConfigured())}
              className="w-full bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Continue to Payment"}
            </button>
          </form>
        )}

        {stage === "pay" && orderId && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl text-ink">Complete Payment</h2>
            <p className="text-sm text-bark">
              Order <span className="font-medium text-ink">{orderId}</span> — pay{" "}
              <span className="font-medium text-ink">{formatPrice(amount)}</span> to confirm.
            </p>

            {paymentMethod === "razorpay" && (
              <button
                type="button"
                onClick={handleRazorpayPay}
                disabled={busy}
                className="w-full bg-terracotta text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target disabled:opacity-50"
              >
                {busy ? "Opening secure payment…" : `Pay ${formatPrice(amount)}`}
              </button>
            )}

            {paymentMethod === "upi" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildGooglePayLink({ amount, note: `Order ${orderId}`, txnRef: orderId })}
                    className="text-center bg-terracotta text-weave py-3 rounded text-sm tap-target"
                  >
                    Google Pay
                  </a>
                  <a
                    href={buildPhonePeLink({ amount, note: `Order ${orderId}`, txnRef: orderId })}
                    className="text-center bg-terracotta text-weave py-3 rounded text-sm tap-target"
                  >
                    PhonePe
                  </a>
                  <a
                    href={buildPaytmLink({ amount, note: `Order ${orderId}`, txnRef: orderId })}
                    className="text-center bg-terracotta text-weave py-3 rounded text-sm tap-target"
                  >
                    Paytm
                  </a>
                  <a
                    href={buildUpiLink({ amount, note: `Order ${orderId}`, txnRef: orderId })}
                    className="text-center border border-terracotta text-terracotta py-3 rounded text-sm tap-target"
                  >
                    Other UPI App
                  </a>
                </div>
                <p className="text-xs text-bark">
                  Each button opens that exact app directly with{" "}
                  <span className="text-ink font-medium">{formatPrice(amount)}</span> and our UPI ID
                  already filled in — you only need to tap Pay inside the app, nothing to type. If a
                  button does nothing, that app likely isn&apos;t installed on this device; try another
                  one.
                </p>
                <p className="text-xs text-bark border-t border-line pt-3">
                  <span className="text-ink font-medium">Why we still ask for a reference number:</span>{" "}
                  a personal UPI ID has no way to automatically tell this website a payment succeeded —
                  that confirmation can only happen instantly with a full payment gateway (see the{" "}
                  <span className="text-ink font-medium">Card / UPI / Netbanking</span> option above,
                  if enabled, which does confirm automatically). For this UPI path, enter the
                  transaction reference (UTR) your payment app shows after paying, and we&apos;ll verify
                  it against our bank statement before dispatching.
                </p>
                <Input
                  label="UPI Transaction Reference (UTR)"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                />
                {error && <p className="text-sm text-terracotta">{error}</p>}
                <button
                  type="button"
                  onClick={handleUpiConfirm}
                  disabled={busy}
                  className="w-full bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "I've Completed Payment"}
                </button>
              </div>
            )}

            {error && paymentMethod === "razorpay" && <p className="text-sm text-terracotta">{error}</p>}
          </div>
        )}
      </div>

      <aside className="border border-line rounded p-5 h-fit">
        <h3 className="font-serif text-lg text-ink mb-4">Order Summary</h3>
        <ul className="space-y-3 mb-4">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size ?? ""}`} className="flex justify-between text-sm">
              <span className="text-bark">
                {item.title} × {item.quantity} {item.moqUnit ?? ""}
              </span>
              <span className="text-ink">{formatPrice(item.price * item.quantity, item.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line pt-3 flex justify-between">
          <span className="text-bark">Total</span>
          <span className="font-serif text-lg text-ink">{formatPrice(totalPrice)}</span>
        </div>
      </aside>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest2 text-bark">{label}</span>
      <input
        {...props}
        className="mt-1 w-full border border-line rounded px-3 py-2.5 bg-weave focus:border-indigo"
      />
    </label>
  );
}

function PaymentOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-sm border rounded px-4 py-3 tap-target ${
        active ? "border-indigo bg-indigo/5 text-ink" : "border-line text-bark"
      }`}
    >
      {label}
    </button>
  );
}
