import { GTA_BORDERS, GTA_HEIGHT, GTA_OUTLINE, GTA_WIDTH } from "@/content/gta-map";

/**
 * The Greater Toronto Area in straight white lines, as the intro draws it
 * (src/content/gta-map.ts): the outline first, then the borders between its
 * five regions. The page transition's mark (ScreenTransition.tsx), which
 * animates the paths itself.
 */
export function GtaOutline({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${GTA_WIDTH} ${GTA_HEIGHT}`} className={className} fill="none" aria-hidden="true" focusable="false">
      {GTA_OUTLINE.map((d) => (
        <path key={d.slice(0, 32)} d={d} pathLength={1} className="gta__stroke" />
      ))}
      {GTA_BORDERS.map((d) => (
        <path key={d.slice(0, 32)} d={d} pathLength={1} className="gta__stroke gta__stroke--border" />
      ))}
    </svg>
  );
}
