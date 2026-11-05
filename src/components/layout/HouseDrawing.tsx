import type { CSSProperties } from "react";
import { HOUSE_GROUND, HOUSE_HEIGHT, HOUSE_STROKES, HOUSE_WIDTH } from "@/content/house-drawing";

/**
 * The house elevation the loader draws (src/content/house-drawing.ts), as one
 * SVG of pathLength=1 strokes. Each stroke carries its own timing as --at and
 * --ms (the intro's CSS uses them; the page transition reads data-at and
 * data-ms and compresses them). `ground` adds a ground line inside the
 * drawing, for the page transition (the intro runs its own across the whole
 * screen).
 */
export function HouseDrawing({ className, ground }: { className?: string; ground?: boolean }) {
  return (
    <svg viewBox={`0 0 ${HOUSE_WIDTH} ${HOUSE_HEIGHT}`} className={className} fill="none" aria-hidden="true" focusable="false">
      {ground ? <path d={`M-20 ${HOUSE_GROUND}H${HOUSE_WIDTH + 20}`} pathLength={1} className="house__stroke house__stroke--ground" data-at={0} data-ms={700} /> : null}
      {HOUSE_STROKES.map((s) => (
        <path
          key={s.d}
          d={s.d}
          pathLength={1}
          className={`house__stroke house__stroke--${s.kind}`}
          data-at={s.at}
          data-ms={s.ms}
          style={{ "--at": `${s.at}ms`, "--ms": `${s.ms}ms` } as CSSProperties}
        />
      ))}
    </svg>
  );
}
