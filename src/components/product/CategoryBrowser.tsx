"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types";
import { ProductGrid } from "./ProductGrid";
import { cn } from "@/lib/utils";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "New Arrivals",
};

export function CategoryBrowser({
  products,
  categories,
  activeCategory,
}: {
  products: Product[];
  categories: string[];
  activeCategory?: string;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    activeCategory ? [activeCategory] : []
  );
  const [sort, setSort] = useState<SortOption>("featured");
  const [sheetOpen, setSheetOpen] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).slice(0, 10);
  }, [products]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedTags.length > 0) {
      result = result.filter((p) => p.tags?.some((t) => selectedTags.includes(t)));
    }
    const sorted = [...result];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "newest") sorted.sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
    else sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    return sorted;
  }, [products, selectedCategories, selectedTags, sort]);

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const filterControls = (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Category</p>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat}>
              <label className="flex items-center gap-2 text-sm capitalize cursor-pointer tap-target">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="accent-terracotta h-4 w-4"
                />
                {cat}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {allTags.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Craft & Material</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border",
                  selectedTags.includes(tag)
                    ? "bg-terracotta text-weave border-terracotta"
                    : "border-line text-bark"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Sort By</p>
        <ul className="space-y-2">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <li key={opt}>
              <label className="flex items-center gap-2 text-sm cursor-pointer tap-target">
                <input
                  type="radio"
                  name="sort"
                  checked={sort === opt}
                  onChange={() => setSort(opt)}
                  className="accent-terracotta h-4 w-4"
                />
                {SORT_LABELS[opt]}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{filterControls}</aside>

      {/* Mobile filter trigger */}
      <div className="lg:hidden flex items-center justify-between">
        <p className="text-sm text-bark">{filtered.length} items</p>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 text-sm border border-line rounded-full px-4 py-2 tap-target"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filter & Sort
        </button>
      </div>

      <div>
        <ProductGrid products={filtered} />
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-weave rounded-t-2xl max-h-[80vh] overflow-y-auto p-6 safe-bottom">
            <div className="flex items-center justify-between mb-6">
              <p className="font-serif text-lg">Filter & Sort</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="tap-target flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterControls}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-8 w-full bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target"
            >
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
