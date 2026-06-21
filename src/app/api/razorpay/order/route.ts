import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrder } from "@/lib/orderStore";
import { PAYMENT_CONFIG, isRazorpayConfigured } from "@/lib/paymentConfig";

/**
 * Creates a Razorpay order for an existing pending order in our own
 * order store, then returns the Razorpay order id so the client can
 * open Razorpay's Checkout widget. Uses a plain fetch with Basic Auth
 * instead of the `razorpay` npm package — one less dependency, and the
 * REST API surface used here is tiny.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "RAZORPAY_KEY_SECRET is missing on the server." },
      { status: 500 }
    );
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const order = getOrder(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "This order does not belong to your account." }, { status: 403 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "Order is already paid." }, { status: 400 });
  }

  const auth = Buffer.from(`${PAYMENT_CONFIG.razorpayKeyId}:${keySecret}`).toString("base64");

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(order.amount * 100), // paise
        currency: order.currency || "INR",
        receipt: order.orderId,
        notes: { tandhStudioOrderId: order.orderId },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.description || "Razorpay order creation failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: PAYMENT_CONFIG.razorpayKeyId,
    });
  } catch (err) {
    console.error("[razorpay/order] request failed:", err);
    return NextResponse.json({ error: "Could not reach Razorpay." }, { status: 502 });
  }
}
