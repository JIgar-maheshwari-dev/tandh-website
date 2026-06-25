import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrder } from "@/lib/orderStore";
import { formatPrice } from "@/lib/utils";
import { WeaveMotifIcon } from "@/components/ui/WeaveDivider";

export default async function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/order-confirmation/${params.orderId}`);
  }

  const order = await getOrder(params.orderId);
  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending_verification";

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="flex justify-center mb-6">
        <WeaveMotifIcon className="h-14 w-14" />
      </div>

      {isPaid && (
        <>
          <h1 className="font-serif text-3xl text-ink">Payment Confirmed</h1>
          <p className="text-bark mt-3">
            Order <span className="text-ink font-medium">{order.orderId}</span> is confirmed and will be
            handwoven into your shipment.
          </p>
        </>
      )}

      {isPending && (
        <>
          <h1 className="font-serif text-3xl text-ink">Order Received — Verifying Payment</h1>
          <p className="text-bark mt-3">
            We&apos;ve recorded your UPI reference <span className="text-ink font-medium">{order.upiUtr}</span>{" "}
            for order <span className="text-ink font-medium">{order.orderId}</span>. We&apos;ll confirm against
            our bank statement and email you once it&apos;s verified — this is usually quick, but your order
            won&apos;t be dispatched until then.
          </p>
        </>
      )}

      {!isPaid && !isPending && (
        <>
          <h1 className="font-serif text-3xl text-ink">Order Pending</h1>
          <p className="text-bark mt-3">
            Order <span className="text-ink font-medium">{order.orderId}</span> has not been marked as paid
            yet.
          </p>
        </>
      )}

      <p className="font-serif text-xl text-ink mt-6">{formatPrice(order.amount, order.currency)}</p>

      {/* Itemized summary — what was bought, and where it's shipping to.
          The data was always stored (see data/orders.csv), this just
          surfaces it back to the customer right after they order. */}
      <div className="mt-10 border border-line rounded text-left p-6">
        <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Order Summary</p>
        <ul className="space-y-2 mb-5">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.size ?? ""}`} className="flex justify-between text-sm">
              <span className="text-ink">
                {item.title}
                {item.size ? ` (${item.size})` : ""} × {item.quantity} {item.moqUnit ?? ""}
              </span>
              <span className="text-bark">{formatPrice(item.price * item.quantity, item.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-sm border-t border-line pt-3 mb-5">
          <span className="text-ink font-medium">Total Paid</span>
          <span className="text-ink font-medium">{formatPrice(order.amount, order.currency)}</span>
        </div>
        <p className="text-xs uppercase tracking-widest2 text-bark mb-2">Shipping To</p>
        <p className="text-sm text-bark leading-relaxed">
          {order.customer.name}
          <br />
          {order.customer.addressLine1}
          {order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ""}
          <br />
          {order.customer.city}, {order.customer.state} {order.customer.pincode}
          <br />
          {order.customer.phone}
        </p>
      </div>

      <Link
        href="/categories"
        className="inline-block mt-8 text-sm uppercase tracking-widest2 text-ink border-b border-ink pb-0.5 hover:text-terracotta hover:border-terracotta"
      >
        Continue Browsing
      </Link>
    </div>
  );
}
