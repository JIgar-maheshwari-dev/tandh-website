import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getProductById } from "@/lib/productLoader";

// This is the page that was showing stale stock — it used to be
// statically pre-rendered at build time (via generateStaticParams),
// which baked in whatever the stock count happened to be at build
// time. Forcing dynamic rendering means every visit re-reads the real,
// current stock from the database.
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { category: string; productId: string };
}) {
  const product = await getProductById(params.category, params.productId);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
