import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { WeaveMotifIcon } from "@/components/ui/WeaveDivider";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
        <WeaveMotifIcon className="h-12 w-12 opacity-50" />
        <p className="font-serif text-lg text-ink">No products here yet</p>
        <p className="text-sm text-bark max-w-xs">
          Add a folder under <code className="text-xs bg-weave-200 px-1 rounded">public/products/</code> to list items in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
      {products.map((product) => (
        <ProductCard key={`${product.category}-${product.id}`} product={product} />
      ))}
    </div>
  );
}
