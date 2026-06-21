"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice, hasMoqViolation } =
    useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={closeCart} aria-hidden="true" />
      <aside
        className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-weave shadow-weave flex flex-col safe-top"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
          <h2 className="font-serif text-xl text-ink">Your Bag</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="tap-target flex items-center justify-center rounded-full hover:bg-weave-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-bark gap-3 py-20">
              <p className="font-serif text-lg text-ink">Your bag is empty</p>
              <p className="text-sm max-w-[220px]">
                Explore handwoven fabrics and apparel from Kutch to begin.
              </p>
              <Link
                href="/categories"
                onClick={closeCart}
                className="mt-2 text-sm uppercase tracking-widest2 text-terracotta border-b border-terracotta pb-0.5"
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => {
                const atFloor = item.quantity <= item.moq;
                return (
                  <li key={`${item.productId}-${item.size ?? ""}`} className="flex gap-3">
                    <div className="relative h-20 w-16 shrink-0 rounded overflow-hidden bg-weave-200">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                      {item.size && <p className="text-xs text-bark">Size: {item.size}</p>}
                      <p className="text-xs text-bark">
                        {formatPrice(item.price, item.currency)} {item.priceUnit}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - item.moqStep, item.size)
                          }
                          disabled={atFloor}
                          aria-label="Decrease quantity"
                          className="tap-target flex items-center justify-center border border-line rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm w-12 text-center tabular-nums">
                          {item.quantity} {item.moqUnit ?? ""}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + item.moqStep, item.size)
                          }
                          aria-label="Increase quantity"
                          className="tap-target flex items-center justify-center border border-line rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.size)}
                          aria-label={`Remove ${item.title}`}
                          className="ml-auto tap-target flex items-center justify-center text-bark hover:text-terracotta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {atFloor && (
                        <p className="mt-1 text-[11px] text-terracotta">
                          Minimum order: {item.moq} {item.moqUnit ?? "units"}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line p-5 safe-bottom shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-bark">Subtotal</span>
              <span className="font-serif text-lg text-ink">{formatPrice(totalPrice)}</span>
            </div>
            {hasMoqViolation && (
              <p className="text-xs text-terracotta mb-2">
                One or more items are below their minimum order quantity.
              </p>
            )}
            <Link
              href="/checkout"
              onClick={closeCart}
              aria-disabled={hasMoqViolation}
              className="block w-full text-center bg-indigo text-weave py-3.5 rounded uppercase text-sm tracking-widest2 tap-target hover:bg-indigo-900 transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
