import { HOUSE_STROKES } from "@/content/house-drawing";

/*
 * The loader's timeline (Preloader.tsx, globals.css "Loader"), in
 * milliseconds from data-intro="play". docs/MOTION.md, "Load sequence".
 *
 * A dark screen; a ground line runs out across it; the house is drawn on it
 * (src/content/house-drawing.ts), the front door last, in red; the logo
 * comes up under the ground; a short hold; the door swings open onto the
 * page; and the screen goes in through the doorway until the opening is
 * bigger than the screen.
 */

/** The ground line runs out from the middle to both edges of the screen. */
export const LOADER_GROUND = { at: 80, ms: 750 };
/** The logo comes up under the ground line once the door is drawn. */
export const LOADER_LOGO = { at: 1350, ms: 600 };
/** The finished drawing is held at least this long. */
export const LOADER_HOLD_MS = 250;
/** The door swings in (it opens into the house). */
export const LOADER_DOOR_MS = 650;
/** The way in starts this far into the door's swing, and takes this long. */
export const LOADER_ENTER_AT_MS = 260;
export const LOADER_ENTER_MS = 1050;
/** With reduced motion: no swing and no way in, the screen fades. */
export const LOADER_GENTLE_FADE_MS = 600;
/** The opening ends this much bigger than it needs to be to clear the screen. */
export const LOADER_ENTER_MARGIN = 1.12;

/** When the drawing is complete, from play. */
export function drawingDoneAt() {
  return Math.max(LOADER_GROUND.at + LOADER_GROUND.ms, LOADER_LOGO.at + LOADER_LOGO.ms, ...HOUSE_STROKES.map((s) => s.at + s.ms));
}

/** From play, when the screen is gone if nothing is waited for. */
export function loaderEndAt() {
  return drawingDoneAt() + LOADER_HOLD_MS + LOADER_ENTER_AT_MS + LOADER_ENTER_MS;
}

/**
 * How far the screen must grow, around the door's centre, for the doorway to clear the whole viewport: the door's
 * rectangle, scaled about its own centre, must reach past every edge.
 */
export function enterScale(door: { left: number; top: number; width: number; height: number }, viewport: { width: number; height: number }) {
  const cx = door.left + door.width / 2;
  const cy = door.top + door.height / 2;
  const sx = (2 * Math.max(cx, viewport.width - cx)) / door.width;
  const sy = (2 * Math.max(cy, viewport.height - cy)) / door.height;
  return Math.max(sx, sy, 1) * LOADER_ENTER_MARGIN;
}
