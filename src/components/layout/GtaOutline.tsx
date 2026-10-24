import type { CSSProperties } from "react";
import { GTA_BORDERS, GTA_HEIGHT, GTA_OUTLINE, GTA_REGIONS, GTA_WIDTH } from "@/content/gta-map";

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

/**
 * The Greater Toronto Area as the intro shows it (src/content/gta-map.ts):
 * the five regions, each a client rendering clipped to its shape, under the
 * straight white lines, the outline first, then the borders between the
 * regions. The page transition's mark (ScreenTransition.tsx), which animates
 * it itself; the pictures are CSS backgrounds that apply only while the veil
 * is up (globals.css), in the small and middle cuts.
 */
export function GtaOutline({ className }: { className?: string }) {
  return (
    <div className={className}>
      {GTA_REGIONS.map((r) => {
        const [x, y, w, h] = r.box;
        return (
          <div
            key={r.key}
            className="gta__region"
            style={{ left: pct(x, GTA_WIDTH), top: pct(y, GTA_HEIGHT), width: pct(w, GTA_WIDTH), height: pct(h, GTA_HEIGHT), clipPath: `url(#veil-clip-${r.key})` }}
          >
            <div
              className="gta__picture"
              style={
                {
                  "--picture-small": `url(${r.picture.small})`,
                  "--picture-medium": `url(${r.picture.medium})`,
                  transformOrigin: `${pct(r.centre[0] - x, w)} ${pct(r.centre[1] - y, h)}`,
                } as CSSProperties
              }
            />
          </div>
        );
      })}
      <svg viewBox={`0 0 ${GTA_WIDTH} ${GTA_HEIGHT}`} className="gta__lines" fill="none" aria-hidden="true" focusable="false">
        <defs>
          {GTA_REGIONS.map((r) => (
            <clipPath key={r.key} id={`veil-clip-${r.key}`} clipPathUnits="objectBoundingBox">
              <path d={r.clip} />
            </clipPath>
          ))}
        </defs>
        {GTA_OUTLINE.map((d) => (
          <path key={d.slice(0, 32)} d={d} pathLength={1} className="gta__stroke" />
        ))}
        {GTA_BORDERS.map((d) => (
          <path key={d.slice(0, 32)} d={d} pathLength={1} className="gta__stroke gta__stroke--border" />
        ))}
      </svg>
    </div>
  );
}
