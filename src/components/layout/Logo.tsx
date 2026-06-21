import Image from "next/image";
import Link from "next/link";
import brand from "@/content/brand.json";

/**
 * Brand mark. Drop a replacement file at /public/logo/logo.svg (or .png)
 * and it's picked up everywhere — header, footer, and the favicon at
 * src/app/favicon.ico can be regenerated separately from the same mark.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2 tap-target" aria-label={`${brand.siteName} home`}>
      <Image
        src="/logo/logo.svg"
        alt={`${brand.siteName} logo`}
        width={size}
        height={size}
        className="rounded-sm"
        priority
      />
      <span className="font-serif text-xl tracking-wide text-ink lowercase">{brand.siteName}</span>
    </Link>
  );
}
