import type { CSSProperties } from "react";
import { GTA_POINT, ONTARIO_PATHS, ONTARIO_VIEWBOX } from "@/content/ontario";

/** The mainland first, then the islands in four groups: five strokes, as in the reference's five-path logo. */
const strokes = [ONTARIO_PATHS.slice(0, 1), ONTARIO_PATHS.slice(1, 2), ONTARIO_PATHS.slice(2, 4), ONTARIO_PATHS.slice(4, 7), ONTARIO_PATHS.slice(7)];

/**
 * The outline of Ontario with the Greater Toronto Area marked, drawn stroke
 * by stroke by CSS (globals.css, "Screen transition"; the footer's is drawn
 * by MotionRoot.tsx). Each group carries its index in --i for the stagger.
 */
export function OntarioOutline({ className }: { className?: string }) {
  return (
    <svg viewBox={ONTARIO_VIEWBOX} className={className} fill="none" aria-hidden="true" focusable="false">
      {strokes.map((group, i) => (
        <g key={i} className="ontario__stroke" style={{ "--i": i } as CSSProperties}>
          {group.map((d) => (
            <path key={d.slice(0, 24)} d={d} pathLength={1} />
          ))}
        </g>
      ))}
      <circle cx={GTA_POINT.x} cy={GTA_POINT.y} r={11} className="ontario__dot" />
    </svg>
  );
}
