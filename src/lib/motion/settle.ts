import { clamp, ease, tween } from "./math";

/*
 * Touch screens: a scene is never left part way (docs/MOTION.md, "Settle").
 *
 * A flick on a phone ends wherever its momentum runs out, and on the
 * homepage's scrubbed scenes that is often in the middle of a change: a
 * paragraph half out of its masks, a word half rolled, a picture half wiped
 * over the last. Each module says where its changes are (spans of scroll in
 * px, `zones`), and once the page has come to rest inside one, the engine
 * glides it on to the end of the change in the direction it was going: on
 * down to the next moment, or back up to the one before. So the page only
 * ever rests where every scene is whole, and every flick, however gentle,
 * moves the story on. Pure functions, so they can be tested without a
 * browser.
 */

/** A span of scroll positions, in px of the document: [first, last]. */
export type Span = readonly [number, number];

/** How finely the zones are found, in screens of scroll. */
export const ZONE_STEP = 0.01;

/**
 * The spans of [from, to] where `cut` holds, sampled every `step` px. Each
 * runs from the last sample before the change to the first one after it,
 * so both its ends are places where everything is at rest.
 */
export function spansWhere(from: number, to: number, step: number, cut: (y: number) => boolean): Span[] {
  const spans: Span[] = [];
  if (!(step > 0) || to < from) return spans;
  let start: number | null = null;
  let prev = from;
  for (let k = 0; ; k++) {
    const y = Math.min(to, from + k * step);
    if (cut(y)) {
      if (start === null) start = prev;
    } else if (start !== null) {
      spans.push([start, y]);
      start = null;
    }
    prev = y;
    if (y >= to) break;
  }
  if (start !== null) spans.push([start, to]);
  return spans;
}

/** How short a rest between two changes may be, in screens, before the two are taken as one: a moment held for less is no place to stop. */
export const SETTLE_JOIN = 0.15;

/** The spans in order, with any that overlap, meet or are no more than `join` px apart made one. */
export function mergeSpans(spans: readonly Span[], join = 0): Span[] {
  const sorted = [...spans].filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a - last[1] <= join) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/**
 * Where a page at rest at `y`, last moving in `dir` (1 down, −1 up), should
 * glide to: the end of the change it rests in, in the direction it was
 * going. (Never back the way it came: a gentle flick into a change would be
 * undone every time, and the page could not be scrolled on. A touch too
 * small to scroll the page never gets this far.) Null when it rests where
 * everything is whole.
 */
export function settleTarget(y: number, dir: number, spans: readonly Span[]): number | null {
  for (const [a, b] of spans) if (y > a && y < b) return dir < 0 ? a : b;
  return null;
}

/** How long the page waits, still, before it settles (ms): the momentum has run out by then. */
export const SETTLE_WAIT = 90;

/** How long the glide takes (s): a short way quickly, a long one unhurried. */
export function settleDuration(distance: number, vh: number) {
  return clamp(0.3 + (0.5 * Math.abs(distance)) / Math.max(1, vh), 0.3, 0.8);
}

/** Where the glide is, `elapsed` s after it set off from `from` towards `to` over `duration` s: it starts and ends at rest. */
export function settleAt(from: number, to: number, elapsed: number, duration: number) {
  return from + (to - from) * tween(elapsed, 0, duration, ease.power2InOut);
}

/*
 * Pieces that come up with the page rather than on a pinned stage (Services
 * on phones, Contact) cannot be settled: the page is
 * free to rest anywhere around them. On touch screens each plays its
 * entrance on its own clock instead, from the moment the page brings it to
 * its start, so a flick that stops as one arrives never leaves it part way.
 */

/**
 * A clock for one module's entrances. Ask it each frame, for each piece
 * (`key`), with the frame's `time` (s), the piece's sso (`s`) and the sso it
 * starts at (`from`); it answers the seconds since the piece started, or a
 * negative number until it has. Pieces that start in the same frame go
 * `gap` s apart, in the order they are asked for, so a block that arrives
 * at once still comes in line by line. A piece back below the screen
 * (s < 0) is reset, to play again the next time it comes up.
 */
export function entranceClock() {
  const started = new WeakMap<object, number>();
  let frame = Number.NaN;
  let queued = 0;
  return (time: number, key: object, s: number, from: number, gap = 0) => {
    if (s < 0) {
      started.delete(key);
      return -1;
    }
    let t0 = started.get(key);
    if (t0 === undefined) {
      if (s < from) return -1;
      if (time !== frame) {
        frame = time;
        queued = 0;
      }
      t0 = time + queued;
      queued += gap;
      started.set(key, t0);
    }
    return time - t0;
  };
}
