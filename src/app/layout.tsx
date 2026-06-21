import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import brand from "@/content/brand.json";

export const metadata: Metadata = {
  title: `${brand.siteName} — ${brand.tagline}`,
  description: brand.metaDescription,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevents iOS auto-zoom on input focus
  viewportFit: "cover", // enables env(safe-area-inset-*) on notched phones
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Fonts are loaded via a standard <link> tag rather than next/font,
          so this works the moment you copy the project — no build-time
          dependency on Google's font CDN. Swap or self-host these later
          if you want fully offline builds.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <TopNav />
          <main className="min-h-[60vh] pb-16 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
