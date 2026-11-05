/*
 * The loader's timeline (Preloader.tsx, globals.css "Loader"), in
 * milliseconds from data-intro="play". docs/MOTION.md, "Load sequence".
 *
 * A dark façade of tall vertical blades, seamless; a raking light crosses
 * it from left to right, picking out the joints between the blades; the logo
 * comes up in the middle with a red rule drawn under it and the firm's line
 * below; a short hold; then the logo lifts away and the blades pivot open,
 * from the middle outward, like a brise-soleil turning to let the light in,
 * and the page is seen through them.
 */

/** The light crossing the façade. */
export const LOADER_LIGHT = { at: 150, ms: 1600 };
/** The joints between the blades come up as the light reaches them. */
export const LOADER_JOINTS = { at: 350, ms: 900 };
/** Each joint 40ms after the one to its left (globals.css, .loader__blade::before). */
export const LOADER_JOINT_STAGGER_MS = 40;
/** The logo rises into place. */
export const LOADER_LOGO = { at: 300, ms: 900 };
/** The red rule is drawn out from the middle under the logo. */
export const LOADER_RULE = { at: 800, ms: 700 };
/** The firm's line comes up under the rule. */
export const LOADER_LINE = { at: 1050, ms: 700 };
/** The finished façade is held at least this long. */
export const LOADER_HOLD_MS = 300;
/** The logo, rule and line lift away first. */
export const LOADER_LIFT_MS = 420;
/** Then the blades pivot open, from the middle outward. */
export const LOADER_OPEN_AT_MS = 140;
export const LOADER_OPEN_MS = 1000;
export const LOADER_OPEN_STAGGER_MS = 55;
/** How far each blade turns (just short of edge on, so it still catches the light). */
export const LOADER_OPEN_DEG = 86;
/** The last of the screen (the blades' thin edges) fades over the end of the turn. */
export const LOADER_FADE_MS = 550;
/** With reduced motion: the blades stay still and the screen fades. */
export const LOADER_GENTLE_FADE_MS = 600;
/** The façade's blades: fewer on phones. */
export const LOADER_BLADES = 12;
export const LOADER_BLADES_NARROW = 8;

/** When the façade is complete, from play. */
export function facadeDoneAt() {
  const joints = LOADER_JOINTS.at + LOADER_JOINTS.ms + (LOADER_BLADES - 1) * LOADER_JOINT_STAGGER_MS;
  return Math.max(joints, LOADER_LIGHT.at + LOADER_LIGHT.ms, ...[LOADER_LOGO, LOADER_RULE, LOADER_LINE].map((s) => s.at + s.ms));
}

/** Each blade's delay as the façade opens: the middle pair first, then outward, one step per blade. */
export function bladeDelay(index: number, count: number) {
  const fromMiddle = Math.abs(index - (count - 1) / 2) - 0.5;
  return LOADER_OPEN_AT_MS + Math.max(0, Math.round(fromMiddle)) * LOADER_OPEN_STAGGER_MS;
}

/** How long the opening takes, from the end of the hold, for this many blades. */
export function openDuration(count: number) {
  return Math.max(...Array.from({ length: count }, (_, i) => bladeDelay(i, count))) + LOADER_OPEN_MS;
}

/** From play, when the screen is gone if nothing is waited for. */
export function loaderEndAt(count = LOADER_BLADES) {
  return facadeDoneAt() + LOADER_HOLD_MS + openDuration(count);
}
