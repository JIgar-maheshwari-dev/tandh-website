import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getAllProducts, getProductById } from "@/lib/productLoader";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ category: p.category, productId: p.id }));
}

export default function ProductPage({
  params,
}: {
  params: { category: string; productId: string };
}) {
  const product = getProductById(params.category, params.productId);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
