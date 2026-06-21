import about from "@/content/about.json";
import { WeaveDivider } from "@/components/ui/WeaveDivider";

export const metadata = { title: "Our Story — tandh studio" };

/**
 * Every word on this page comes from src/content/about.json. Edit that
 * file to change this page's copy — no code changes needed.
 */
export default function AboutPage() {
  return (
    <div>
      <div className="bg-indigo-900 text-weave py-20 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-widest2 text-clay mb-3">{about.heroEyebrow}</p>
        <h1 className="font-serif text-3xl sm:text-5xl max-w-2xl mx-auto leading-snug">
          {about.heroTitle}
        </h1>
        <p className="text-weave/80 mt-4 max-w-md mx-auto">{about.heroSubtitle}</p>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {about.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-serif text-2xl text-ink mb-3">{section.heading}</h2>
            <p className="text-bark leading-relaxed">{section.body}</p>
          </div>
        ))}

        <WeaveDivider />

        <dl className="grid grid-cols-3 gap-4 text-center">
          {about.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-bark uppercase tracking-widest2">{stat.label}</dt>
              <dd className="font-serif text-2xl text-ink mt-1">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
