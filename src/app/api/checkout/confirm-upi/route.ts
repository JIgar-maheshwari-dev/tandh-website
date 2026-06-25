import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/orderStore";
import { decrementStockForOrder } from "@/lib/stockStore";

/**
 * IMPORTANT — read before relying on this in production:
 *
 * A personal/business UPI ID with no payment gateway behind it has no
 * webhook and no API that tells your server "this payment succeeded."
 * That confirmation can only come from a gateway (Razorpay, Cashfree,
 * etc.) which IS implemented for real, automatic confirmation — see
 * /api/razorpay/verify.
 *
 * For the UPI-only path, the most honest thing this app can do is:
 * capture the UTR/reference number the customer sees in their own UPI
 * app after paying, mark the order "pending_verification" (NOT "paid"),
 * and require a human (you) to check the reference against your bank/UPI
 * statement before treating the order as confirmed and shipping it.
 * This route does exactly that — it never marks an order "paid".
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { orderId?: string; utr?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, utr } = body;
  if (!orderId || !utr || utr.trim().length < 4) {
    return NextResponse.json(
      { error: "A valid order ID and UPI transaction reference (UTR) are required." },
      { status: 400 }
    );
  }

  const existing = await getOrder(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "This order does not belong to your account." }, { status: 403 });
  }

  // Guard against double-decrementing stock if this is a resubmission
  // (e.g. correcting a typo'd UTR) rather than the first confirmation.
  const isFirstConfirmation = existing.status === "pending_payment";

  const updated = await updateOrder(orderId, {
    status: "pending_verification",
    upiUtr: utr.trim(),
  });

  if (isFirstConfirmation) {
    await decrementStockForOrder(
      existing.items.map((i) => ({ category: i.category, productId: i.productId, quantity: i.quantity }))
    );
  }

  return NextResponse.json({ orderId: updated?.orderId, status: updated?.status });
}
