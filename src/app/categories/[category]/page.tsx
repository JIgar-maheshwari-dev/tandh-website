import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/product/CategoryBrowser";
import { getAllProducts, getCategories } from "@/lib/productLoader";

// Shows live stock per product — must re-read the database on every
// request, not be frozen as static HTML from build time.
export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const categories = getCategories();
  if (!categories.includes(params.category)) {
    notFound();
  }
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-3xl text-ink mb-2 capitalize">{params.category}</h1>
      <p className="text-bark mb-8">
        {products.filter((p) => p.category === params.category).length} items in this category.
      </p>
      <CategoryBrowser products={products} categories={categories} activeCategory={params.category} />
    </div>
  );
}
