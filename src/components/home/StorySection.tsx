import Link from "next/link";
import about from "@/content/about.json";
import { WeaveMotifIcon } from "@/components/ui/WeaveDivider";

export function StorySection() {
  const intro = about.sections[0];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <p className="text-xs uppercase tracking-widest2 text-terracotta mb-3">{about.heroEyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-snug">{intro.heading}</h2>
          <p className="text-bark mt-4 leading-relaxed">{intro.body}</p>
          <Link
            href="/about"
            className="inline-block mt-6 text-sm uppercase tracking-widest2 text-ink border-b border-ink pb-0.5 hover:text-terracotta hover:border-terracotta"
          >
            Read the Full Story
          </Link>

          <dl className="grid grid-cols-3 gap-4 mt-10 border-t border-line pt-6">
            {about.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs text-bark uppercase tracking-widest2">{stat.label}</dt>
                <dd className="font-serif text-2xl text-ink mt-1">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 lg:order-2 flex items-center justify-center bg-weave-200 rounded-lg aspect-square p-12">
          <WeaveMotifIcon className="h-32 w-32" />
        </div>
      </div>
    </section>
  );
}
