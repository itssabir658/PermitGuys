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

/* ---- Hero (250vh track, 100vh sticky stage, pinned for 1.5 screens) ---- */

/**
 * The hero as the intro's ivory sheet rises over it (from 0.5 to 1.5
 * screens; Intro.tsx). The statement leaves upward through its masks first,
 * since the sheet arrives at its edge (0.02 → 0.37); the name follows,
 * gone by 0.72, before the sheet reaches it, lifting 0.08 screen as it
 * goes. The caption fades by 0.3. The picture recedes under the sheet the
 * whole time: it drifts up, grows 8% and darkens.
 */
export function heroState(scroll: number, top: number, vh: number) {
  const s = Math.max(0, (scroll - top) / vh);
  const name = tween(s, 0.12, 0.6, ease.power2In);
  const pic = tween(s, 0, 1.5, ease.power1InOut);
  return {
    nameRoll: roll(1, name),
    headingY: -0.08 * vh * name,
    subRoll: [0, 1].map((i) => roll(1, tween(s, 0.02 + i * 0.05, 0.3, ease.power2In))),
    figOpacity: 1 - tween(s, 0, 0.3),
    imageScale: 1 + 0.08 * pic,
    imageY: -0.04 * vh * pic,
    dim: 0.45 * pic,
  };
}

/* ---- Intro orbit (510vh track for two paragraphs, 100vh sticky stage) ---- */

/**
 * The intro's timeline, in screens of scroll from the moment its stage pins
 * (e = 0; it rises over the hero from e = −1). Paragraph i is composed at
 * firstCopy + i × copyStepVh; the ring is flung outward from exitAfter past
 * the last one, over exitVh, and the stage releases releaseIntoExit into
 * the fling, so the images are still leaving as Works comes up beneath.
 */
export const ORBIT = { firstCopy: 1.0, copyStepVh: 1.75, exitAfter: 0.95, exitVh: 1, releaseIntoExit: 0.4, exitRadius: 1.9, turnsPerScreen: 0.075 };

/**
 * Six slots around one squircle path: u is the position along the path (0
 * top centre, spaced by arc length, a sixth apart with a slight jitter), d
 * the size on wide screens × vh, p the size on portrait screens ×
 * min(vw, 0.5 vh).
 */
export const ORBIT_SLOTS = [
  { u: 0.01, d: 0.24, p: 0.28 },
  { u: 1 / 6 - 0.013, d: 0.19, p: 0.24 },
  { u: 2 / 6 + 0.016, d: 0.22, p: 0.29 },
  { u: 0.5 - 0.008, d: 0.18, p: 0.25 },
  { u: 4 / 6 + 0.013, d: 0.23, p: 0.28 },
  { u: 5 / 6 - 0.016, d: 0.2, p: 0.26 },
] as const;

/** The section's length follows from the number of copy blocks, so adding one lengthens the track. For two: copyIn [1, 2.75], exitStart 3.7, 510vh. */
export function introPhases(blocks: number) {
  const copyIn = Array.from({ length: blocks }, (_, i) => ORBIT.firstCopy + i * ORBIT.copyStepVh);
  const exitStart = (copyIn[copyIn.length - 1] ?? ORBIT.firstCopy) + ORBIT.exitAfter;
  const release = exitStart + ORBIT.releaseIntoExit;
  return { copyIn, exitStart, sectionVh: Math.round((release + 1) * 100) };
}

/**
 * Progress through the intro in screens: −1 as its sheet starts to rise
 * over the hero, 0 when its stage pins, `height/vh − 1` when it releases.
 * The fling reads the unclamped value, so it finishes while the stage
 * scrolls away.
 */
export function introProgress(sso: number, heightVh: number, exitStart: number) {
  const raw = sso - 1;
  return { e: clamp(raw, -1, heightVh - 1), exit: smoothstep(raw, exitStart, exitStart + ORBIT.exitVh), raw };
}

/**
 * How much copy is at the centre, 0–1, from the unclamped progress (introProgress
 * raw), so it can finish after the stage releases. It leads the text in and
 * follows it out, so a study is never seen fading behind a readable line:
 * whole just as the first paragraph's first line starts to show (the lines
 * rise from copyIn − 0.65), and down only once the last one's lines have
 * all but left (they leave from + 0.85, the seventh more than half gone by
 * + 1.2). A paragraph is on screen for 1.9 screens and the next starts 1.75
 * after it (copyStepVh), so the handover never leaves the centre bare in
 * between.
 */
export function introCopy(raw: number, copyIn: number[]) {
  const first = copyIn[0] ?? ORBIT.firstCopy;
  const last = copyIn[copyIn.length - 1] ?? first;
  return tween(raw, first - 0.9, 0.3) * (1 - tween(raw, last + 1.2, 0.3));
}

export interface OrbitPath {
  portrait: boolean;
  /** The stage's height (100svh, so it holds still as a phone's toolbar comes and goes) and the screen's (100lvh, the timeline's unit), in px. */
  h: number;
  vh: number;
  /** Each slot's size in px. */
  sizes: number[];
  /** Half the height of the copy at the centre, in px (0 if unknown): on portrait screens a study shows only once clear of it. */
  clear: number;
  /** The ring's vertical centre from the stage's centre, and its half height, in px. */
  cy: number;
  ry: number;
  /** 513 points from the top centre, clockwise, with the cumulative length at each. */
  xs: Float64Array;
  ys: Float64Array;
  cum: Float64Array;
}

const PATH_SAMPLES = 512;
const sgnSqrt = (v: number) => Math.sign(v) * Math.sqrt(Math.abs(v));

/**
 * The ring for one stage: a squircle inside the safe box (clear of the
 * header on portrait screens, of the caption below), inset by half the
 * largest image, so every image stays whole on the stage. `h` is the
 * stage's height and `vh` the screen's (they differ while a phone shows its
 * toolbar). Sampled once per measure, so the images can be spaced along it
 * by arc length: evenly spaced angles crowd the squircle's flat sides.
 * `clear` is half the height of the copy block, for the portrait fade.
 */
export function orbitPath(vw: number, h: number, clear = 0, vh = h): OrbitPath {
  const portrait = vw < 0.8 * h;
  const sizes = ORBIT_SLOTS.map((s) => (portrait ? s.p * Math.min(vw, 0.5 * h) : s.d * h));
  const big = Math.max(...sizes);
  const padX = portrait ? 12 : Math.max(32, 0.04 * vw);
  const padTop = portrait ? 96 : 40;
  // Above the caption, with room for the 3% breathing (it sets on two lines on phones).
  const padBot = portrait ? 88 : 72;
  const rx = vw / 2 - big / 2 - padX;
  const ry = (h - padTop - padBot) / 2 - big / 2;
  const cy = (padTop - padBot) / 2;
  const xs = new Float64Array(PATH_SAMPLES + 1);
  const ys = new Float64Array(PATH_SAMPLES + 1);
  const cum = new Float64Array(PATH_SAMPLES + 1);
  for (let i = 0; i <= PATH_SAMPLES; i++) {
    const a = -Math.PI / 2 + (i / PATH_SAMPLES) * PI2;
    xs[i] = rx * sgnSqrt(Math.cos(a));
    ys[i] = cy + ry * sgnSqrt(Math.sin(a));
    if (i) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  }
  return { portrait, h, vh, sizes, clear, cy, ry, xs, ys, cum };
}

/** The point at `u` of the way along the path (any number; it wraps), in px from the stage's centre. */
export function pathAt(path: OrbitPath, u: number): [number, number] {
  const { xs, ys, cum } = path;
  const s = (((u % 1) + 1) % 1) * cum[PATH_SAMPLES];
  let lo = 0;
  let hi = PATH_SAMPLES;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] <= s) lo = m;
    else hi = m;
  }
  const t = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return [mix(xs[lo], xs[hi], t), mix(ys[lo], ys[hi], t)];
}

/** A study flung down dissolves over this many px (widening with the fling) before its lower edge would meet the stage's; at rest the ring's lowest study keeps 57px or more above that edge, up to 2560×1440. */
export const ORBIT_EDGE_FADE = 44;

/**
 * Where one study sits: travelling along the path at one speed for all, so
 * neighbours never close up. It glides in from 1.8× the ring as the sheet
 * rises (e −1 to 0), starting just before its own part of the sheet comes
 * up over the bottom edge, so the top of the ring arrives first and the
 * sheet is never blank. It breathes 3%, and is flung out to exitRadius ×
 * the ring at the end.
 *
 * On portrait screens the copy fills the width, so while there is copy at
 * the centre (`copy`, introCopy) a study shows only once clear of it, above
 * or below: a ring tilting behind the text. With no copy, all of it shows.
 *
 * The stage clips at its bottom edge, and once it releases that edge is a
 * line across the middle of the screen with ivory on both sides; the fling
 * carries the lower studies down onto it. They dissolve before they reach
 * it, so none is ever cut by an edge nobody can see. At rest the ring keeps
 * clear of that band, so this changes nothing until the fling.
 */
export function orbitItem(path: OrbitPath, slot: number, e: number, exit: number, copy = 1) {
  const [x0, y0] = pathAt(path, ORBIT_SLOTS[slot].u + e * ORBIT.turnsPerScreen);
  const size = path.sizes[slot];
  // The stage's top edge is −e screens down the screen while the sheet rises, so this place comes into view at e = (h/2 + y0)/vh − 1.
  const enter = (path.h / 2 + y0) / path.vh - 1.25;
  const arrive = ease.power3Out(clamp((e - enter) / 1.1));
  const breathe = 1 + 0.03 * Math.sin(e * 1.7 + slot * 1.3);
  const k = mix(1.8, 1, arrive) * breathe * (1 + (ORBIT.exitRadius - 1) * ease.power2In(exit));
  const x = x0 * k;
  const y = path.cy + (y0 - path.cy) * k;
  let side = 1;
  if (path.portrait) {
    const clearOfCopy = path.clear > 0 ? smoothstep(Math.abs(y) - size / 2 - path.clear, 4, 52) : smoothstep(Math.abs(y0 - path.cy) / path.ry, 0.45, 0.65);
    side = 1 - clamp(copy) * (1 - clearOfCopy);
  }
  // The band widens with the fling, so a study dissolves over about a quarter of a screen rather than in one notch.
  const edge = 1 - smoothstep(y + size / 2, path.h / 2 - ORBIT_EDGE_FADE * (1 + 3 * exit), path.h / 2);
  return { x, y, opacity: arrive * side * edge, imgScale: mix(1.18, 1, arrive), arrive };
}

/**
 * One line of an intro paragraph composed at `n` on the timeline: the lines
 * rise from their masks 0.05 apart (n − 0.65), hold, and leave upward 0.02
 * apart (n + 0.85). Five lines stay composed for 0.8 screens, seven for
 * 0.7; the next paragraph starts rising as this one leaves.
 */
export function introLine(e: number, n: number, line: number) {
  const inP = tween(e, n - 0.65 + line * 0.05, 0.5, ease.power3Out);
  const outP = tween(e, n + 0.85 + line * 0.02, 0.28, ease.power2In);
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
