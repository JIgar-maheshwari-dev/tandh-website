import Link from "next/link";

const TEASERS = [
  {
    href: "/categories/fabric",
    label: "Fabrics",
    desc: "Raw Kala cotton yardage, Bhujodi extra-weft motifs, by the metre.",
  },
  {
    href: "/categories/shirts",
    label: "Apparel",
    desc: "Shirts and kurtas cut from the same handloom cloth.",
  },
];

export function CategoryTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid sm:grid-cols-2 gap-5">
        {TEASERS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative overflow-hidden rounded-lg bg-bark/90 aspect-[16/10] flex items-end p-6 sm:p-8"
          >
            <div className="absolute inset-0 weave-motif opacity-60 group-hover:opacity-90 transition-opacity" />
            <div className="relative">
              <p className="font-serif text-2xl sm:text-3xl text-weave">{t.label}</p>
              <p className="text-weave/80 text-sm mt-1 max-w-xs">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
