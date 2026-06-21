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

  const order = getOrder(params.orderId);
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

      <Link
        href="/categories"
        className="inline-block mt-8 text-sm uppercase tracking-widest2 text-ink border-b border-ink pb-0.5 hover:text-terracotta hover:border-terracotta"
      >
        Continue Browsing
      </Link>
    </div>
  );
}
