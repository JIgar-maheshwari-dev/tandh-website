import Link from "next/link";
import Image from "next/image";
import { getHeroMedia } from "@/lib/mediaLookup";

/**
 * Full-width hero. Background is auto-detected from public/hero/ —
 * see getHeroMedia() in src/lib/mediaLookup.ts for the exact filenames
 * it looks for. No code change needed to swap in real photography or
 * video; if neither file exists, it falls back to a generative woven
 * pattern so the homepage never looks broken in the meantime.
 */
export function Hero() {
  const media = getHeroMedia();

  return (
    <section className="relative w-full overflow-hidden bg-indigo-900">
      {media?.type === "video" && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={media.src} />
        </video>
      )}

      {media?.type === "image" && (
        <Image
          src={media.src}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {!media && (
        <svg
          viewBox="0 0 400 220"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-40"
          aria-hidden="true"
        >
          <pattern id="heroWeave" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 40 L20 0 L40 40" fill="none" stroke="#B85C38" strokeWidth="2" />
            <path d="M-10 40 L10 0 L30 40" fill="none" stroke="#F6F1E7" strokeWidth="1" opacity="0.5" />
          </pattern>
          <rect width="400" height="220" fill="url(#heroWeave)" />
        </svg>
      )}

      {/* Gradient scrim — keeps the text readable whether the backdrop
          is the generated pattern, a photo, or a video */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-indigo-900/70 to-indigo-900/30" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <p className="text-xs sm:text-sm uppercase tracking-widest2 text-clay">Faradi, Kutch</p>
        <h1 className="font-serif text-4xl sm:text-6xl text-weave mt-4 leading-tight">
          Explore Earth-Born
          <br />
          Kala Cotton
        </h1>
        <p className="text-weave/85 mt-5 max-w-md mx-auto text-sm sm:text-base">
          Hand-spun, rain-fed cotton. Woven on a pit-loom in Kutch by the same family for three generations.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/categories"
            className="bg-terracotta text-weave px-8 py-3.5 rounded uppercase text-sm tracking-widest2 tap-target hover:bg-terracotta-600 transition-colors"
          >
            Explore Collection
          </Link>
          <Link
            href="/about"
            className="border border-weave/40 text-weave px-8 py-3.5 rounded uppercase text-sm tracking-widest2 tap-target hover:bg-weave/10 transition-colors"
          >
            Our Story
          </Link>
        </div>
      </div>
    </section>
  );
}
