import { Hero } from "@/components/home/Hero";
import { StorySection } from "@/components/home/StorySection";
import { CategoryTeaser } from "@/components/home/CategoryTeaser";
import { ProductGrid } from "@/components/product/ProductGrid";
import { WeaveDivider } from "@/components/ui/WeaveDivider";
import { getFeaturedProducts } from "@/lib/productLoader";

// Featured products show live stock (e.g. "Out of Stock" badges) —
// this page must re-read the database on every request, never be
// frozen as static HTML from build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <div>
      <Hero />
      <CategoryTeaser />
      <WeaveDivider className="my-16" />
      <StorySection />
      <WeaveDivider className="my-4" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-ink">Featured</h2>
        </div>
        <ProductGrid products={featured} />
      </section>
    </div>
  );
}
