import { PI2, clamp, ease, fit, mix, mixColorNum, mixColorOklab, smoothstep, tween } from "./math";

/*
 * The homepage choreography as pure functions of scroll. Every input is
 * measured in viewport heights of scroll unless it says px, so 1 means one
 * screen.
 *
 *   sso  showScreenOffset: 0 when an element's top meets the bottom of the
 *        screen, 1 when it meets the top.
 *   hso  hideScreenOffset: −1 when its bottom meets the bottom of the
 *        screen, 0 when it meets the top.
 *
 * One motion vocabulary for the whole site (the CSS side is in globals.css,
 * :root):
 *   - Sheets: a section hands over by a sheet rising from the bottom edge
 *     over a layer that recedes (scales up 8% at most, darkens, or dims to
 *     0.72). Timed sheets use --e-sheet (cssEase.sheet) over 0.6–1.0s;
 *     scrubbed wipes use power2InOut over about 0.3 screens.
 *   - Masks: display type never fades. Each line rises from its own mask at
 *     MASK % and leaves upward through it: roll(). Masked lines take
 *     0.9–1.2s timed, or 0.24–0.3 screens scrubbed, 0.06–0.09s apart
 *     (0.03–0.05 screens scrubbed). Only small labels, captions and blocks
 *     may fade (labels over 0.7s).
 *   - Eases: entrances power3Out, exits power2In, no overshoot. Hover and
 *     tone changes take 0.3s with --e-ui.
 *   - Rhythm: each beat holds 0.6–0.8 screens fully composed and hands over
 *     in about 0.3; the next section's first element starts entering before
 *     the last one leaves, so no frame is empty for more than 0.15 screens.
 *   - Materials: ivory hero sheet, stone Works, ivory Values, dusk into the
 *     night Services (an OKLab blend), the ivory Contact and the charcoal
 *     footer (pageGround).
 */

/** % travel of a masked line: clears the .16em overflow-clip-margin at line-height 0.85 and above. */
export const MASK = 120;

/** A masked line's yPercent: rises from MASK % as `inP` runs 0 → 1, then leaves upward to −MASK % as `outP` runs 0 → 1. */
export function roll(inP: number, outP: number) {
  return outP > 0 ? -MASK * outP : MASK * (1 - inP);
}

/* ---- Hero (200vh track, 100vh sticky stage) ---- */

/** Heading rises and sub-line sinks by half a screen while both fade, from half a screen of scroll to the end of the track. */
export function heroState(scroll: number, top: number, height: number, vh: number) {
  const p = fit(scroll, top + vh * 0.5, top + height, 0, 1);
  const r = vh * 0.5;
  return { p, headingY: -p * r, subY: p * r, opacity: 1 - p };
}

/* ---- Intro orbit (600vh track, 100vh sticky stage) ---- */

export const ORBIT = {
  radiusRatio: 0.68,
  exitVh: 1,
  exitRadius: 3,
  copyStepVh: 2,
  turns: 0.12,
  spreadVh: 1.2,
};

/** angle (rad), radiusScale, speedScale, sizeVh, verbatim from the reference. Slot 0 is the centre slot. */
export const ORBIT_SLOTS = [
  { angle: 0.35, radius: 0.9, speed: 0.92, size: 28 },
  { angle: 1.25, radius: 1.1, speed: 1.1, size: 15 },
  { angle: 2.1, radius: 0.92, speed: 0.9, size: 18 },
  { angle: 3.05, radius: 1.12, speed: 1.15, size: 14 },
  { angle: 3.95, radius: 0.88, speed: 0.95, size: 20 },
  { angle: 4.75, radius: 1.05, speed: 1.08, size: 16 },
  { angle: 5.65, radius: 1.15, speed: 0.85, size: 17 },
] as const;

/** The section's length follows from the number of copy blocks, so adding one lengthens the track. */
export function introPhases(blocks: number) {
  const copyIn = Array.from({ length: blocks }, (_, i) => 1 + i * ORBIT.copyStepVh);
  const last = (copyIn[copyIn.length - 1] ?? 1) + 1 + ORBIT.exitVh;
  return { copyIn, last, sectionVh: (last + 1) * 100 };
}

/** Scroll progress through the intro in screens: 0 when its stage pins, `height/vh − 1` when it releases. */
export function introProgress(sso: number, heightVh: number) {
  const e = clamp(sso - 1, 0, heightVh - 1);
  return { e, exit: smoothstep(e, heightVh - 2, heightVh - 1) };
}

/** Where one orbiting image sits: spread out from the centre, turning, then flung outward on exit. */
export function orbitItem(slot: number, e: number, exit: number, vw: number, vh: number) {
  const cfg = ORBIT_SLOTS[slot];
  const n = smoothstep(e, slot * 0.025, slot * 0.025 + ORBIT.spreadVh);
  const angle = cfg.angle + e * ORBIT.turns * cfg.speed * PI2;
  const r = ORBIT.radiusRatio * Math.min(vw, vh) * cfg.radius;
  const l = r * n * (slot === 0 ? mix(1, 0, exit) : mix(1, ORBIT.exitRadius, exit));
  return { x: Math.cos(angle) * l, y: Math.sin(angle) * l, scale: n, opacity: n };
}

/**
 * One line of an intro paragraph, on the copy timeline (1 unit = 1 screen of
 * scroll). Lines rise in from below their mask at `n − 0.5` and carry on up
 * and out at `n + 0.4`: one continuous upward conveyor.
 */
export function introLine(e: number, n: number, line: number) {
  const inP = tween(e, n - 0.5 + line * 0.08, 0.45, ease.power3Out);
  const outP = tween(e, n + 0.4 + line * 0.05, 0.3, ease.power2In);
  return roll(inP, outP);
}

/* ---- Works (450vh track, 150vh panel per study) ---- */

/** 0 at a study's moment: its panel centred on the screen. */
export function worksT(ssoPanel: number) {
  return ssoPanel - 1.25;
}

/** Symmetric proximity falloff; deeper elements (k) resolve in tighter windows. */
export function worksFalloff(t: number, k: number) {
  return 1 - smoothstep(Math.abs(t), 0.3 - k * 0.1, 0.7 - k * 0.1);
}

/** Title (k 0, 60px), type (k 1, 60px), button (k 2, 40px): arriving items travel down into place, leaving ones carry on up. */
export function worksElement(t: number, k: number, travel: number) {
  const K = worksFalloff(t, k);
  return { opacity: K, y: -Math.sign(t) * (1 - K) * travel };
}

export function worksImageScale(t: number) {
  return mix(0.5, 1, 1 - smoothstep(Math.abs(t), 0, 1));
}

/** The study's button only takes the pointer at its moment. */
export function worksButtonLive(t: number) {
  return Math.abs(t) < 0.15;
}

/* ---- Values (110vh per value) ---- */

/** x: the value image's top above the top of the screen, in screens (0 when aligned). */
export function valuesImage(x: number, fade: number) {
  const c = 1 - smoothstep(Math.abs(x), 0, 1);
  return { scale: mix(0.5, 1, c), brightness: mix(1, 0.5, fade) };
}

/** Title enters over 0.2 of a screen and leaves over 0.4; the description travels twice as far on the way out. */
export function valuesText(x: number) {
  const a = fit(x, -0.2, 0, 0, 1);
  const b = fit(x, 0.3, 0.4, 0, 1);
  const n = fit(x, 0, 0.4, 0, 1);
  return { a, b, titleOpacity: a - b, titleY: 20 + (a * -20 + n * -80), descOpacity: 1 - b, descY: n * -160 };
}

/** One description line, scrubbed by the entry ramp `a` over a 0.6s, 0.1-staggered timeline. */
export function valuesLine(a: number, line: number, lines: number) {
  const total = 0.6 + Math.max(0, lines - 1) * 0.1;
  return { yPercent: roll(tween(a * total, line * 0.1, 0.6, ease.power1Out), 0) };
}

/* ---- Page ground ---- */

export const CREAM = 0xf4f1eb;
export const STONE = 0xece7df;
export const NIGHT = 0x191918;

/**
 * The page ground, one material per section: cream, stone under Works (in
 * as Works rises over the top half of the screen, out over its last 0.35
 * screen), cream again for Values, then dusk falls over the first content
 * of Services (sso 0.25 → 0.55), blended in OKLab so the middle stays warm.
 * It stays night under Contact's own ivory and the footer.
 */
export function pageGround(ssoWorks: number, hsoWorks: number, ssoServices: number) {
  const stone = smoothstep(ssoWorks, 0.55, 0.95) * (1 - smoothstep(hsoWorks, -0.35, 0));
  const fade = smoothstep(ssoServices, 0.25, 0.55);
  return { fade, color: mixColorOklab(mixColorNum(CREAM, STONE, stone), NIGHT, fade) };
}

/**
 * What the header sits on, read where its tone is read (64px down, the lower
 * half of the button; MainNav): the ground, until Contact's own ivory
 * reaches that line (`contactTop` is Contact's top from the top of the
 * screen). The body stays night behind Contact, but the visitor sees ivory
 * there, so the phone bar must too. Night turns the header light-on-dark.
 */
export function headerGround(ground: { fade: number; color: number }, contactTop: number) {
  const onContact = contactTop <= 64;
  return { night: ground.fade > 0.5 && !onContact, color: onContact ? CREAM : ground.color };
}

/* ---- Services ---- */

/** The image frame wipes up from the bottom and settles from a slight zoom. */
export function servicesReveal(ssoFrame: number) {
  const r = smoothstep(ssoFrame, 0.1, 0.55);
  return { r, inset: (1 - r) * 100, scale: mix(1.15, 1, r) };
}

/** A scroll-distance stagger: each item's window starts 0.04 of a screen after the last. */
export function servicesW(x: number, k: number) {
  return smoothstep(x, 0.2 + k * 0.04, 0.8 + k * 0.04);
}

/** One heading line, on a 1s, 0.1-staggered timeline scrubbed by W(sso, 0). */
export function servicesHeadingLine(w: number, line: number, lines: number) {
  const total = 1 + Math.max(0, lines - 1) * 0.1;
  return { yPercent: roll(tween(w * total, line * 0.1, 1, ease.power3Out), 0) };
}

/* ---- Contact ---- */

export function contactReveal(sso: number) {
  const o = smoothstep(sso, 0.08, 0.42);
  return { opacity: o, y: (1 - o) * 28 };
}
