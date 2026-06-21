"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingBag, Info } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Collections", icon: Grid3x3 },
  { href: "/about", label: "Story", icon: Info },
];

/**
 * Mobile-only sticky bottom nav. Deliberately NOT placed in the same
 * fixed-bottom layer as the product page's sticky add-to-bag bar —
 * see ProductDetail.tsx for how the two avoid overlapping each other.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-weave border-t border-line safe-bottom"
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 h-16">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 tap-target",
                active ? "text-terracotta" : "text-bark"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px]">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center gap-1 tap-target text-bark relative"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[11px]">Cart</span>
          {totalItems > 0 && (
            <span className="absolute top-1 right-[28%] bg-terracotta text-weave text-[9px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
