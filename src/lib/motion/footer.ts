import { clamp, ease, tween } from "./math";

/*
 * The footer on every page (MotionRoot, footer module), as pure functions
 * of scroll, so they can be tested without a browser. Every position is in
 * px of the document.
 */

/**
 * How far the footer has come up, 0–1: 0 as its top meets the bottom of
 * the screen, 1 once it is all on screen, or at the end of the page if the
 * page ends sooner (a footer taller than the screen counts one screen), so
 * a short page still reaches 1 at its last scroll position.
 */
export function footerProgress(scroll: number, vh: number, top: number, height: number, scrollHeight: number) {
  const span = Math.max(1, Math.min(height, vh, scrollHeight - top));
  return clamp((scroll + vh - top) / span);
}

/**
 * The footer's content rises out from under the sheet above it: it lags
 * behind the footer's top edge (which clips it) by up to 0.3 of the
 * footer's height, or of a screen if the footer is taller, and is in place
 * at progress 1. In px, negative is up.
 */
export function footerLift(x: number, height: number, vh: number) {
  return -(1 - clamp(x)) * 0.3 * Math.min(height, vh);
}

/**
 * How far the outline has been drawn, 0–1, from where the outline itself
 * is: 0 as its top comes up over the bottom of the screen, 1 once its
 * bottom is 0.3 screen above it, or at the end of the page. Read from the
 * outline rather than the footer, so on a phone, where the footer is
 * taller than the screen, it draws while it is in view.
 */
export function footerDraw(scroll: number, vh: number, top: number, height: number, scrollHeight: number) {
  const span = Math.max(1, Math.min(height + 0.3 * vh, scrollHeight - top));
  return clamp((scroll + vh - top) / span);
}

/** The dash offset of stroke group i (0 the mainland, then the islands): 1 undrawn, 0 drawn. */
export function footerStroke(d: number, i: number) {
  return 1 - tween(d, 0.15 + i * 0.06, 0.5, ease.power2Out);
}

/** The GTA dot's scale: it lands as the last island closes. */
export function footerDot(d: number) {
  return tween(d, 0.7, 0.2, ease.power3Out);
}
