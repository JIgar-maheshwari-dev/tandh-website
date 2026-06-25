import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getAllProducts, getProductById } from "@/lib/productLoader";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ category: p.category, productId: p.id }));
}

export default async function ProductPage({
  params,
}: {
  params: { category: string; productId: string };
}) {
  const product = await getProductById(params.category, params.productId);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
