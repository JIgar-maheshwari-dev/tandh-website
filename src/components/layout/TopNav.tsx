"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cartStore";

const NAV_LINKS = [
  { href: "/categories/fabric", label: "Fabrics" },
  { href: "/categories/shirts", label: "Apparel" },
  { href: "/categories", label: "All Products" },
  { href: "/about", label: "Our Story" },
  { href: "/wholesale", label: "Wholesale" },
];

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-weave/95 backdrop-blur-sm border-b border-line safe-top">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop links */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-widest2 text-bark hover:text-terracotta transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              title={`Signed in as ${session.user.email}. Click to sign out.`}
              className="hidden sm:flex items-center gap-1.5 tap-target px-2 rounded-full hover:bg-weave-200 text-sm text-ink"
            >
              <User className="h-5 w-5" />
              <span className="max-w-[100px] truncate">{session.user.name?.split(" ")[0]}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 tap-target px-2 rounded-full hover:bg-weave-200 text-sm text-ink"
            >
              <User className="h-5 w-5" /> Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className="relative tap-target flex items-center justify-center rounded-full hover:bg-weave-200"
          >
            <ShoppingBag className="h-6 w-6 text-ink" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-terracotta text-weave text-[10px] font-medium rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden tap-target flex items-center justify-center rounded-full hover:bg-weave-200"
          >
            <Menu className="h-6 w-6 text-ink" />
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-[78%] max-w-xs bg-weave border-l-2 border-terracotta shadow-2xl p-6 flex flex-col gap-1 safe-top">
            <div className="flex items-center justify-between mb-8">
              <Logo size={30} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="tap-target flex items-center justify-center rounded-full hover:bg-weave-200"
              >
                <X className="h-6 w-6 text-ink" />
              </button>
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base border-b border-line text-ink hover:text-terracotta transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4">
              {session?.user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full text-left py-3 text-base text-ink"
                >
                  Sign out ({session.user.email})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-base text-ink"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
