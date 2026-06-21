"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] w-full bg-weave-200 rounded flex items-center justify-center text-bark text-sm">
        No image available
      </div>
    );
  }

  const scrollToIndex = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActive(idx);
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(idx);
  };

  return (
    <div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded"
      >
        {images.map((src, idx) => (
          <div key={src} className="relative aspect-[4/5] w-full shrink-0 snap-start bg-weave-200">
            <Image
              src={src}
              alt={`${alt} — image ${idx + 1}`}
              fill
              priority={idx === 0}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                active === idx ? "w-6 bg-terracotta" : "w-2 bg-line"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
