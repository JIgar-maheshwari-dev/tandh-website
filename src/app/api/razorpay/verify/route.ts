import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/orderStore";

/**
 * This is the actual "only proceed with the order if payment succeeded"
 * gate for the Razorpay path. Razorpay's Checkout widget returns a
 * payment id, order id, and a signature after a successful payment.
 * That signature is an HMAC-SHA256 of `${razorpay_order_id}|${razorpay_payment_id}`
 * keyed with your secret — if it doesn't match, the payment claim is
 * not trustworthy and the order is never marked "paid".
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Server is not configured for Razorpay." }, { status: 500 });
  }

  let body: {
    orderId?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "This order does not belong to your account." }, { status: 403 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const signatureValid = expectedSignature === razorpay_signature;

  if (!signatureValid) {
    updateOrder(orderId, { status: "failed" });
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  // Only at this point — verified signature — does the order get marked
  // "paid". Nothing earlier in the flow (cart, form, button click) is
  // ever sufficient on its own.
  const updated = updateOrder(orderId, {
    status: "paid",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  return NextResponse.json({ orderId: updated?.orderId, status: updated?.status });
}
