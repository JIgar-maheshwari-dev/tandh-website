"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const primary = product.imagePaths[0];
  const secondary = product.imagePaths[1] ?? primary;

  return (
    <div className="group relative">
      <Link href={`/products/${product.category}/${product.id}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-weave-200">
          {primary && (
            <>
              <Image
                src={primary}
                alt={product.title}
                fill
                className="object-cover transition-opacity duration-300 group-hover:opacity-0"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <Image
                src={secondary}
                alt=""
                aria-hidden="true"
                fill
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </>
          )}
          {product.newArrival && (
            <span className="absolute top-2 left-2 bg-indigo text-weave text-[10px] uppercase tracking-widest2 px-2 py-1 rounded">
              New
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setWishlisted((v) => !v)}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        className="absolute top-2 right-2 tap-target flex items-center justify-center bg-weave/90 rounded-full shadow-sm"
      >
        <Heart className={`h-4 w-4 ${wishlisted ? "fill-terracotta text-terracotta" : "text-ink"}`} />
      </button>

      <Link href={`/products/${product.category}/${product.id}`} className="block mt-3">
        <p className="text-sm text-ink font-medium leading-snug">{product.title}</p>
        {product.subtitle && <p className="text-xs text-bark mt-0.5">{product.subtitle}</p>}
        <p className="text-sm text-ink mt-1">
          {formatPrice(product.price, product.currency)}
          {product.priceUnit ? ` ${product.priceUnit}` : ""}
        </p>
      </Link>
    </div>
  );
}
