"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  content?: string;
}

export function CraftAccordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const visibleItems = items.filter((i) => i.content && i.content.trim().length > 0);

  if (visibleItems.length === 0) return null;

  return (
    <div className="border-t border-line mt-8">
      {visibleItems.map((item, idx) => {
        const open = openIndex === idx;
        return (
          <div key={item.title} className="border-b border-line">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : idx)}
              aria-expanded={open}
              className="w-full flex items-center justify-between py-4 text-left tap-target"
            >
              <span className="text-sm uppercase tracking-widest2 text-ink">{item.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-bark transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <p className="pb-4 text-sm text-bark leading-relaxed pr-6">{item.content}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
