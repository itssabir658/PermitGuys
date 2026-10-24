/*
 * The intro's timeline (Preloader.tsx, globals.css "Intro"), in milliseconds
 * from the screen's first paint. docs/MOTION.md, "Load sequence".
 *
 * A held dark screen; the outline of the Greater Toronto Area drawing
 * itself up the lakeshore and round; the borders between the five regions
 * following it in; then the five regions coming to life west to east, each
 * picture fading up and settling inside its region; a hold on the finished
 * map; and a crossfade onto the page.
 */

/** The dark screen, held before anything draws. */
export const INTRO_HOLD_MS = 400;
/** The outer edge draws in one stroke. */
export const INTRO_OUTLINE_MS = 1300;
/** Any island (none at present) draws as the edge closes. */
export const INTRO_ISLAND_MS = 400;
/** The borders between regions start once the edge is most of the way round, a little apart. */
export const INTRO_BORDERS_AT_MS = 1050;
export const INTRO_BORDER_MS = 650;
export const INTRO_BORDER_STAGGER_MS = 70;
/** The first picture starts as the edge closes; each next one 220ms later. */
export const INTRO_REVEAL_AT_MS = 1550;
export const INTRO_REVEAL_STAGGER_MS = 220;
export const INTRO_REVEAL_MS = 900;
/** The finished map is held this long once the last picture has settled. */
export const INTRO_COMPLETE_MS = 600;
/** The crossfade onto the page. */
export const INTRO_EXIT_MS = 800;
/** A later full load in the same tab: the dark screen just fades once the page is ready. */
export const INTRO_REPEAT_EXIT_MS = 450;

export interface IntroStroke {
  /** Delay from first paint, ms. */
  at: number;
  /** Duration, ms. */
  ms: number;
}

/** When the outline's strokes draw: the edge first, then any island. */
export function outlineTiming(index: number): IntroStroke {
  return index === 0 ? { at: INTRO_HOLD_MS, ms: INTRO_OUTLINE_MS } : { at: INTRO_HOLD_MS + INTRO_OUTLINE_MS - INTRO_ISLAND_MS * 0.5, ms: INTRO_ISLAND_MS };
}

/** When each border draws. */
export function borderTiming(index: number): IntroStroke {
  return { at: INTRO_BORDERS_AT_MS + index * INTRO_BORDER_STAGGER_MS, ms: INTRO_BORDER_MS };
}

/** When each region's picture comes in, in reveal order. */
export function revealTiming(index: number): IntroStroke {
  return { at: INTRO_REVEAL_AT_MS + index * INTRO_REVEAL_STAGGER_MS, ms: INTRO_REVEAL_MS };
}

/** From first paint, when the finished map has been held and the crossfade starts. */
export function introExitAt(regions: number, borders: number, outlines: number) {
  const ends = [
    ...Array.from({ length: outlines }, (_, i) => outlineTiming(i)),
    ...Array.from({ length: borders }, (_, i) => borderTiming(i)),
    ...Array.from({ length: regions }, (_, i) => revealTiming(i)),
  ].map((s) => s.at + s.ms);
  return Math.max(...ends) + INTRO_COMPLETE_MS;
}
