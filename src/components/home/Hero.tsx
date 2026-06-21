import Link from "next/link";

/**
 * Full-width hero. In place of stock photography (none was supplied),
 * the backdrop is a large-scale rendering of the same extra-weft
 * chevron structure used as the site's signature motif elsewhere —
 * keeping the "texture of handloomed fabric" promise from the brief
 * without relying on a placeholder photo. Swap the <svg> background
 * for a real <Image> of the loom/fabric whenever photography is ready.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-indigo-900">
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
