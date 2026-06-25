import { CategoryBrowser } from "@/components/product/CategoryBrowser";
import { getAllProducts, getCategories } from "@/lib/productLoader";

export const metadata = { title: "All Products — tandh studio" };

export default async function AllProductsPage() {
  const products = await getAllProducts();
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-3xl text-ink mb-2">All Products</h1>
      <p className="text-bark mb-8">Handwoven fabrics and apparel from Kutch.</p>
      <CategoryBrowser products={products} categories={categories} />
    </div>
  );
}
