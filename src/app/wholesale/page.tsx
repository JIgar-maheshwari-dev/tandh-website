import brand from "@/content/brand.json";

export const metadata = { title: "Wholesale — tandh studio" };

export default function WholesalePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-serif text-3xl text-ink mb-4">Wholesale & B2B Sourcing</h1>
      <p className="text-bark leading-relaxed">{brand.wholesaleBlurb}</p>

      <div className="mt-8 border border-line rounded p-6">
        <p className="text-xs uppercase tracking-widest2 text-bark mb-2">Get in touch</p>
        <a href={`mailto:${brand.wholesaleEmail}`} className="font-serif text-xl text-ink hover:text-terracotta">
          {brand.wholesaleEmail}
        </a>
        <p className="text-sm text-bark mt-3">
          Please include your brand name, country, the kind of fabric or apparel you&apos;re sourcing, and
          your typical order volume.
        </p>
      </div>
    </div>
  );
}
