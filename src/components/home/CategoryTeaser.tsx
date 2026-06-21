import Link from "next/link";
import Image from "next/image";
import { getCategoryCover } from "@/lib/mediaLookup";

const TEASERS = [
  {
    href: "/categories/fabric",
    slug: "fabric",
    label: "Fabrics",
    desc: "Raw Kala cotton yardage, Bhujodi extra-weft motifs, by the metre.",
  },
  {
    href: "/categories/shirts",
    slug: "shirts",
    label: "Apparel",
    desc: "Shirts and kurtas cut from the same handloom cloth.",
  },
];

/**
 * Background photo for each card is auto-detected from
 * public/category-covers/<slug>.{jpg,jpeg,png,webp} — see
 * getCategoryCover() in src/lib/mediaLookup.ts. Falls back to the
 * woven CSS pattern if no file is found for that slug.
 */
export function CategoryTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid sm:grid-cols-2 gap-5">
        {TEASERS.map((t) => {
          const cover = getCategoryCover(t.slug);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-lg bg-bark/90 aspect-[16/10] flex items-end p-6 sm:p-8"
            >
              {cover ? (
                <>
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {/* Scrim so the label text stays legible over an
                      arbitrary photo — the woven-pattern fallback below
                      didn't need this since it was already tuned for
                      contrast, but a real photo can't guarantee that. */}
                  <div className="absolute inset-0 bg-ink/35 group-hover:bg-ink/45 transition-colors" />
                </>
              ) : (
                <div className="absolute inset-0 weave-motif opacity-60 group-hover:opacity-90 transition-opacity" />
              )}
              <div className="relative">
                <p className="font-serif text-2xl sm:text-3xl text-weave">{t.label}</p>
                <p className="text-weave/80 text-sm mt-1 max-w-xs">{t.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
