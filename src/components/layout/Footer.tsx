import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { WeaveDivider } from "@/components/ui/WeaveDivider";
import brand from "@/content/brand.json";

export function Footer() {
  return (
    <footer className="mt-24 pb-20 lg:pb-0">
      <WeaveDivider />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <p className="font-serif text-2xl text-ink lowercase">{brand.siteName}</p>
          <p className="mt-3 text-sm text-bark leading-relaxed">{brand.footerNote}</p>
          {brand.social.instagram && (
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-ink hover:text-terracotta tap-target"
            >
              <ExternalLink className="h-4 w-4" /> Instagram
            </a>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/categories/fabric" className="hover:text-terracotta">Fabrics</Link></li>
            <li><Link href="/categories/shirts" className="hover:text-terracotta">Apparel</Link></li>
            <li><Link href="/categories" className="hover:text-terracotta">All Products</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest2 text-bark mb-3">Studio</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-terracotta">Our Story</Link></li>
            <li><Link href="/wholesale" className="hover:text-terracotta">Wholesale / B2B</Link></li>
            <li><a href={`mailto:${brand.contactEmail}`} className="hover:text-terracotta">{brand.contactEmail}</a></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-bark/70 pb-6">
        © {new Date().getFullYear()} {brand.siteName}. {brand.address}.
      </p>
    </footer>
  );
}
