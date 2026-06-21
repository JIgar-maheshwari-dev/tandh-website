import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCartItems } from "@/lib/orderValidation";
import { saveOrder } from "@/lib/orderStore";
import { generateOrderId } from "@/lib/utils";
import { isRazorpayConfigured, isUpiConfigured } from "@/lib/paymentConfig";
import type { CustomerDetails, OrderRecord, PaymentMethod } from "@/types";

function isValidCustomer(c: Partial<CustomerDetails> | undefined): c is CustomerDetails {
  if (!c) return false;
  const required: (keyof CustomerDetails)[] = [
    "name",
    "email",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];
  return required.every((field) => typeof c[field] === "string" && c[field]!.trim().length > 0);
}

export async function POST(req: NextRequest) {
  // The /checkout page already redirects signed-out visitors to /login,
  // but that's a UX convenience, not a security boundary — this is the
  // boundary. Anyone could otherwise POST directly to this endpoint.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "You must be signed in to place an order." }, { status: 401 });
  }

  let body: {
    items?: unknown;
    customer?: Partial<CustomerDetails>;
    paymentMethod?: PaymentMethod;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { items, customer, paymentMethod } = body;

  if (paymentMethod !== "upi" && paymentMethod !== "razorpay") {
    return NextResponse.json({ error: "Invalid or missing payment method." }, { status: 400 });
  }
  // There is intentionally no third accepted value here (e.g. "cod").
  // Pre-paid only, by design.

  if (paymentMethod === "razorpay" && !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured on this server." }, { status: 400 });
  }
  if (paymentMethod === "upi" && !isUpiConfigured()) {
    return NextResponse.json({ error: "UPI ID is not configured on this server." }, { status: 400 });
  }

  if (!isValidCustomer(customer)) {
    return NextResponse.json({ error: "Missing or invalid customer details." }, { status: 400 });
  }

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
  }

  const validation = validateCartItems(items as never);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  const order: OrderRecord = {
    orderId: generateOrderId(),
    userId: session.user.id,
    userEmail: session.user.email,
    createdAt: new Date().toISOString(),
    items: validation.lines.map((l) => l.item),
    customer,
    paymentMethod,
    amount: validation.amount,
    currency: validation.lines[0]?.item.currency ?? "INR",
    status: "pending_payment",
  };

  saveOrder(order);

  return NextResponse.json({
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
  });
}
