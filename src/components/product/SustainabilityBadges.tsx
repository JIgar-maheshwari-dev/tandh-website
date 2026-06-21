import { Leaf, CloudRain, Hand, FlaskConical } from "lucide-react";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "100% Organic": Leaf,
  "Rain-fed Crop": CloudRain,
  "Artisan Made": Hand,
  "Zero Chemical Dyes": FlaskConical,
};

export function SustainabilityBadges({ badges }: { badges?: string[] }) {
  if (!badges || badges.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-3 mt-4">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge] ?? Leaf;
        return (
          <li
            key={badge}
            className="flex items-center gap-1.5 text-xs text-bark border border-line rounded-full px-3 py-1.5"
          >
            <Icon className="h-3.5 w-3.5 text-terracotta" />
            {badge}
          </li>
        );
      })}
    </ul>
  );
}
