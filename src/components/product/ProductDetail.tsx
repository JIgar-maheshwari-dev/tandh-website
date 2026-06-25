"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { ImageCarousel } from "./ImageCarousel";
import { MoqStepper } from "./MoqStepper";
import { CraftAccordion } from "./CraftAccordion";
import { SustainabilityBadges } from "./SustainabilityBadges";
import { useCart } from "@/lib/cartStore";
import { formatPrice, cn } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(product.moq);
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0]);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Sticky add-to-bag bar appears only once the in-page CTA has scrolled
  // out of view — avoids showing two "Add to Cart" controls on screen
  // at once, which is the overlap complaint this is meant to solve.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      category: product.category,
      title: product.title,
      image: product.imagePaths[0] ?? "",
      price: product.price,
      priceUnit: product.priceUnit,
      currency: product.currency,
      quantity,
      moq: product.moq,
      moqStep: product.moqStep,
      moqUnit: product.moqUnit,
      size,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const accordionItems = [
    { title: "Weave Type", content: product.weaveType },
    { title: "Dye Process", content: product.dyeProcess },
    { title: "Care Instructions", content: product.careInstructions },
    { title: "Craft Story", content: product.craftStory },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-10">
        <ImageCarousel images={product.imagePaths} alt={product.title} />

        <div>
          {product.tags && product.tags.length > 0 && (
            <p className="text-xs uppercase tracking-widest2 text-terracotta mb-2">
              {product.tags.slice(0, 3).join(" · ")}
            </p>
          )}
          <h1 className="font-serif text-3xl text-ink">{product.title}</h1>
          {product.subtitle && <p className="text-bark mt-1">{product.subtitle}</p>}

          <p className="font-serif text-2xl text-ink mt-4">
            {formatPrice(product.price, product.currency)}
            {product.priceUnit && <span className="text-base text-bark"> {product.priceUnit}</span>}
          </p>

          <SustainabilityBadges badges={product.badges} />

          <p className="text-sm text-bark leading-relaxed mt-6">{product.description}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest2 text-bark mb-2">Size</p>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "tap-target px-4 border rounded text-sm",
                      size === s ? "border-ink bg-ink text-weave" : "border-line text-ink"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest2 text-bark mb-2">Quantity</p>
            <MoqStepper
              quantity={quantity}
              moq={product.moq}
              moqStep={product.moqStep}
              moqUnit={product.moqUnit}
              maxStock={product.stock}
              onChange={setQuantity}
            />
          </div>

          {/* In-page CTA — the one that gets "covered" by the sticky bar
              once it scrolls out of view */}
          <div ref={ctaRef} className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target hover:bg-indigo-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? "Out of Stock" : added ? "Added to Bag" : "Add to Bag"}
            </button>
            <button
              type="button"
              onClick={() => setWishlisted((v) => !v)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              className="tap-target w-14 flex items-center justify-center border border-line rounded"
            >
              <Heart className={cn("h-5 w-5", wishlisted ? "fill-terracotta text-terracotta" : "text-ink")} />
            </button>
          </div>

          {product.stock !== undefined && (
            <p className="text-xs text-bark mt-3">
              {product.stock > 0 ? `${product.stock} in stock` : "Currently out of stock"}
            </p>
          )}

          <CraftAccordion items={accordionItems} />
          {product.details && product.details.length > 0 && (
            <ul className="mt-6 space-y-1 text-sm text-bark">
              {product.details.map((d) => (
                <li key={d}>— {d}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sticky add-to-bag bar: sits ABOVE the mobile BottomNav (which is
          h-16 / 64px), never on top of it. On desktop there is no bottom
          nav, so it docks to the true bottom edge instead. The two
          buttons here use flex + gap rather than absolute positioning,
          so they can never stack on top of each other either. */}
      <div
        className={cn(
          "fixed left-0 right-0 bottom-16 lg:bottom-0 z-20 bg-weave border-t border-line px-4 py-3 transition-transform duration-200",
          showStickyBar ? "translate-y-0" : "translate-y-full",
          "safe-bottom lg:safe-bottom"
        )}
      >
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{product.title}</p>
            <p className="text-sm text-bark">{formatPrice(product.price, product.currency)}</p>
          </div>
          <button
            type="button"
            onClick={() => setWishlisted((v) => !v)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className="tap-target w-12 shrink-0 flex items-center justify-center border border-line rounded"
          >
            <Heart className={cn("h-5 w-5", wishlisted ? "fill-terracotta text-terracotta" : "text-ink")} />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="shrink-0 flex items-center gap-2 bg-indigo text-weave px-5 py-3 rounded uppercase text-xs tracking-widest2 tap-target disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="h-4 w-4" />
            {product.stock === 0 ? "Sold Out" : added ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
