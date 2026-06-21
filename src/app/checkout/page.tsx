import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — tandh studio" };

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/checkout");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-3xl text-ink mb-8">Checkout</h1>
      <p className="text-sm text-bark mb-6">
        Signed in as <span className="text-ink font-medium">{session.user?.email}</span>
      </p>
      <CheckoutForm userEmail={session.user?.email ?? ""} userName={session.user?.name ?? ""} />
    </div>
  );
}
