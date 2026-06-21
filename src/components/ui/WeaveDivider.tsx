// The site's signature recurring element: a woven extra-weft motif,
// rendered as inline SVG so it scales crisply at any size and needs no
// image asset. Used deliberately and sparingly — as a section divider,
// never as background wallpaper.
export function WeaveDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 240 12" preserveAspectRatio="none" className="w-full h-3">
        <pattern id="weaveChevron" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12 L12 0 L24 12" fill="none" stroke="#B85C38" strokeWidth="1.5" opacity="0.55" />
          <path d="M-6 12 L6 0 L18 12" fill="none" stroke="#2F3C5E" strokeWidth="1.5" opacity="0.4" />
        </pattern>
        <rect width="240" height="12" fill="url(#weaveChevron)" />
      </svg>
    </div>
  );
}

export function WeaveMotifIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="none" strokeWidth="2">
        <path d="M4 24 L16 8 L28 24 L40 8" stroke="#B85C38" opacity="0.8" />
        <path d="M4 32 L16 16 L28 32 L40 16" stroke="#2F3C5E" opacity="0.8" />
        <path d="M4 40 L16 24 L28 40 L40 24" stroke="#6B5544" opacity="0.6" />
      </g>
    </svg>
  );
}
