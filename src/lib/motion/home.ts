import { PI2, clamp, ease, mix, mixColorNum, mixColorOklab, smoothstep, tween } from "./math";

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

/**
 * Where each section's label (its heading and note, each one mask) starts
 * to roll in, as its section's sso: the story's as its sheet comes up,
 * before the first chapter's lines; Works' with the first picture, as the
 * story's stage leaves; the making-of board's as its stage comes up,
 * before its first lines are drawn; Values' as the stage pins, with the
 * first word; Services' eyebrow from its track, as the ground passes
 * night.
 */
export const LABEL_IN = { story: 0.32, works: 0.3, making: 0.32, values: 0.62, services: 0.34 } as const;

/** A section label at its section's sso `s`, as a yPercent: it rolls in over 0.3 screens from `from` (LABEL_IN), and leaves with the released stage. */
export function sectionLabel(s: number, from: number) {
  return roll(tween(s, from, 0.3, ease.power3Out), 0);
}

/* ---- Hero (250vh track, 100vh sticky stage, pinned for 1.5 screens) ---- */

/**
 * The hero as the intro's ivory sheet rises over it (from 0.5 to 1.5
 * screens; Intro.tsx). The statement leaves upward through its masks first,
 * since the sheet arrives at its edge (0.02 → 0.37); the name follows,
 * gone by 0.72, before the sheet reaches it, lifting 0.08 screen as it
 * goes. The caption fades by 0.3. The picture recedes under the sheet the
 * whole time, each plane at its own depth: the house drifts up 0.04 screen,
 * grows 8% and darkens, the sky drifts 0.015 screen and grows 3%, so the
 * sky slides behind the roof. Each plane's growth covers its drift, so no
 * edge ever shows.
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
    skyScale: 1 + 0.03 * pic,
    skyY: -0.015 * vh * pic,
    dim: 0.45 * pic,
  };
}

/**
 * The hero's depth under a fine pointer (HomeMotion, hero module): at full
 * deflection the house (the near plane) moves against the pointer by these
 * fractions of the stage's width and height, and the sky with it, while the
 * name holds still between them. The planes follow at `rate` (an
 * exponential approach, per second) and settle back when the pointer leaves
 * the window. Keep nearX and nearY in step with --sway and --sway-y in
 * globals.css, which keep the roof's wedge under R to T as the house moves,
 * and the overscan there (--z, 1.04) at least 1 + 2 × each amount.
 */
export const HERO_DEPTH = { nearX: 0.015, nearY: 0.008, farX: 0.009, farY: 0.005, rate: 5 };

/* ---- Intro orbit (510vh track for two paragraphs, 100vh sticky stage) ---- */

/**
 * The intro's timeline, in screens of scroll from the moment its stage pins
 * (e = 0; it rises over the hero from e = −1). Paragraph i is composed at
 * firstCopy + i × copyStepVh; the ring is flung outward from exitAfter past
 * the last one, over exitVh, and the stage releases releaseIntoExit into
 * the fling, so the images are still leaving as the story comes up beneath.
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
 * carries the lower pictures down onto it. They dissolve before they reach
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

/* ---- Story (580vh track: four 1.2-screen chapters under one pinned 100vh stage) ---- */

/**
 * The story's timeline, in screens of scroll since its stage pinned (e,
 * sso − 1). Chapter i owns [i, i + 1] × `step` and the stage releases at
 * e = chapters × step. One house goes through four states on one drawing
 * sheet:
 *   - Vision: the sheet rises with the stage (`sheet`) and the elevation is
 *     sketched on it line by line (`sketch`);
 *   - Design: the rendering wipes up from the ground line (`render`); the
 *     sketch gives way to the picture as the edge passes each line;
 *   - Engineering: trace rises over the picture (`veil`) and the grid,
 *     levels and structure are drawn on it (`eng`);
 *   - Permit: the trace turns to paper and the structure goes (`paper`),
 *     the lines come back in ink (`ink`) and straighten from the picture's
 *     perspective into a true elevation (`rectify`), and the title block
 *     is filled in (storyField).
 * Each change starts as its chapter's text hands over, so word and picture
 * turn together, and each state is held, whole, while its text is read: a
 * chapter's text is composed for 0.6 screens or more.
 */
export const STORY = {
  chapters: 4,
  step: 1.2,
  sheetIn: -0.9,
  sheetVh: 0.6,
  sketchIn: -0.42,
  sketchVh: 1.12,
  renderIn: 1.02,
  renderVh: 0.48,
  veilIn: 2.24,
  veilVh: 0.36,
  engIn: 2.46,
  engVh: 0.66,
  paperIn: 3.44,
  paperVh: 0.26,
  inkIn: 3.54,
  inkVh: 0.22,
  rectifyIn: 3.58,
  rectifyVh: 0.5,
  fieldsIn: 3.86,
  /** How much of the picture the trace lets through. */
  trace: 0.84,
} as const;

/** The section's length in vh: `step` screens per chapter, and one for the stage to arrive. */
export function storySectionVh(chapters: number = STORY.chapters) {
  return Math.round((chapters * STORY.step + 1) * 100);
}

/** Every state of the drawing at `e` (see STORY), each 0 → 1. */
export function storyState(e: number) {
  return {
    sheet: tween(e, STORY.sheetIn, STORY.sheetVh, ease.power3Out),
    sketch: tween(e, STORY.sketchIn, STORY.sketchVh),
    render: tween(e, STORY.renderIn, STORY.renderVh, ease.power2InOut),
    veil: tween(e, STORY.veilIn, STORY.veilVh, ease.power2InOut),
    eng: tween(e, STORY.engIn, STORY.engVh),
    paper: tween(e, STORY.paperIn, STORY.paperVh, ease.power2InOut),
    ink: tween(e, STORY.inkIn, STORY.inkVh, ease.power2Out),
    rectify: tween(e, STORY.rectifyIn, STORY.rectifyVh, ease.power2InOut),
  };
}

/** Field k of the title block (project, drawing, sheet, issued): its value rolls in through its mask as the drawing finishes straightening, the masked-line rhythm. */
export function storyField(e: number, k: number) {
  return roll(tween(e, STORY.fieldsIn + k * WORKS.stagger, 0.26, ease.power3Out), 0);
}

/** The chapter the reader is in: it turns over with the text, just before the boundary. */
export function storyChapter(e: number, n: number = STORY.chapters) {
  return Math.min(n - 1, Math.max(0, Math.floor((e + 0.05) / STORY.step)));
}

/** How far through chapter i the reader is, 0 → 1 (the contents' bars). */
export function storyFill(e: number, i: number) {
  return clamp((e - i * STORY.step) / STORY.step);
}

/** A share of the sketch each line takes to draw. */
export const STORY_LINE_DUR = 0.14;

/** Line i of n of the sketch, 0 → 1: the lines start one after another through the sketch, each drawn on power1InOut over `dur` of it, as a hand draws. */
export function storyLineDraw(sketch: number, i: number, n: number, dur: number = STORY_LINE_DUR) {
  const start = n > 1 ? (i / (n - 1)) * (1 - dur) : 0;
  return tween(sketch, start, dur, ease.power1InOut);
}

/** How far a sketched line runs past its ends, in the drawing's units (2800 across): a quarter of its length at most, so small details stay neat. */
export const STORY_OVERSHOOT = 30;

type Seg4 = readonly [number, number, number, number];

/**
 * Where a line is drawn: `t` of the way from its place over the picture
 * (`p`) to its place on the sheet (`q`), run past both ends by `over`
 * (sketching), and drawn `draw` of the way from its first end.
 */
export function storySeg(p: Seg4, q: Seg4, t: number, over: number, draw: number): [number, number, number, number] {
  let x1 = mix(p[0], q[0], t);
  let y1 = mix(p[1], q[1], t);
  let x2 = mix(p[2], q[2], t);
  let y2 = mix(p[3], q[3], t);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const o = Math.min(over, len / 4);
  if (o > 0) {
    const ux = ((x2 - x1) / len) * o;
    const uy = ((y2 - y1) / len) * o;
    x1 -= ux;
    y1 -= uy;
    x2 += ux;
    y2 += uy;
  }
  return [x1, y1, mix(x1, x2, draw), mix(y1, y2, draw)];
}

/**
 * The engineering, drawn as `eng` runs 0 → 1: the three grid lines from
 * their bubbles down (0.06 apart), the four levels from their markers
 * across, then, once the levels are well under way, each structural member
 * round its outline, and the labels fading in behind them (they are
 * labels, so they may fade).
 */
export function storyOverlay(eng: number, members: number) {
  return {
    grid: [0, 1, 2].map((i) => tween(eng, i * 0.06, 0.34, ease.power2InOut)),
    bubbles: [0, 1, 2].map((i) => tween(eng, 0.04 + i * 0.06, 0.18)),
    levels: [0, 1, 2, 3].map((i) => tween(eng, 0.18 + i * 0.06, 0.34, ease.power2InOut)),
    levelLabels: [0, 1, 2, 3].map((i) => tween(eng, 0.26 + i * 0.06, 0.2)),
    members: Array.from({ length: members }, (_, k) => tween(eng, 0.52 + k * (0.26 / Math.max(1, members - 1)), 0.22, ease.power1InOut)),
    memberLabels: tween(eng, 0.72, 0.22),
  };
}

/** Side s (0–3) of a member drawn `m` of the way round its outline. */
export function storySide(m: number, s: number) {
  return clamp(m * 4 - s);
}

/**
 * One masked line of chapter i's text (k: 0 the chapter's label, then its
 * title's lines, then its body's), on the Works rhythm: the lines rise
 * 0.035 apart from just before the chapter's boundary and leave 0.02 apart
 * from 0.2 before the next, so in any rank one line has gone before the
 * next one moves. The first chapter rises with the stage; the last never
 * leaves.
 */
export function storyLine(e: number, i: number, n: number, k: number) {
  const a = i * STORY.step;
  const inP = i === 0 ? tween(e, -0.36 + k * WORKS.stagger, 0.26, ease.power3Out) : tween(e, a - 0.03 + k * WORKS.stagger, 0.22, ease.power3Out);
  const outP = i === n - 1 ? 0 : tween(e, a + STORY.step - 0.2 + k * WORKS.outStagger, 0.14, ease.power2In);
  return roll(inP, outP);
}

/* ---- Works (420vh track: three 140vh panels under one pinned 100vh stage) ---- */

/**
 * The Works viewer's timeline. `e` is screens of scroll since the stage
 * pinned (sso(section) − 1), `D` the length it stays pinned (the section's
 * height in screens − 1: 3.2), shared by the n projects, so project i owns
 * [i, i + 1] × D/n. Projects hand over in `hand` screens, centred on the
 * boundary. A project's lines rise `stagger` apart and leave `outStagger`
 * apart, top line first both ways (eyebrow, title lines, button).
 *
 * The first project arrives while the stage is still coming up and the
 * story's stage is leaving above it, so the two overlap: its picture rises
 * from the bottom of the screen from `firstIn` (power3Out, an entrance)
 * over `firstInVh`, and its lines from `firstLines`.
 */
export const WORKS = { hand: 0.3, stagger: 0.035, outStagger: 0.02, firstIn: -0.92, firstInVh: 0.6, firstLines: -0.3 };

/**
 * One project's picture: `inP` its wipe up over the picture before
 * (power2InOut, scrubbed), `outP` the next one's wipe over it, as it dims
 * to 0.72; `drift` runs 0 → 1 over the whole time it is on screen, for a
 * slow parallax inside the frame. `live` is the project in front. The last
 * project never leaves: it scrolls away with the stage.
 */
export function worksShot(e: number, i: number, n: number, D: number) {
  const step = D / n;
  const a = i * step;
  const b = a + step;
  const H = WORKS.hand;
  const inStart = i === 0 ? WORKS.firstIn : a - H / 2;
  const inP = i === 0 ? tween(e, WORKS.firstIn, WORKS.firstInVh, ease.power3Out) : tween(e, a - H / 2, H, ease.power2InOut);
  const outP = i === n - 1 ? 0 : tween(e, b - H / 2, H, ease.power2InOut);
  return { inP, outP, live: inP > 0.5 && outP < 0.5, drift: clamp((e - inStart) / (b + H / 2 - inStart)) };
}

/**
 * One masked line of study i (k: 0 the eyebrow, then the title's lines, then
 * the button), as a yPercent for roll(). The outgoing lines leave just
 * before the wipe begins (power2In) and the incoming ones rise from about
 * its midpoint (power3Out), so in every row, and in the clip margin each row shares with
 * the next, one line has gone before the next one moves: two lines never
 * print over each other. A study with two title lines stays fully composed
 * for about 0.57 screens.
 */
export function worksLine(e: number, i: number, n: number, D: number, k: number) {
  const step = D / n;
  const a = i * step;
  const b = a + step;
  const inP = i === 0 ? tween(e, WORKS.firstLines + k * WORKS.stagger, 0.26, ease.power3Out) : tween(e, a - 0.03 + k * WORKS.stagger, 0.22, ease.power3Out);
  const outP = i === n - 1 ? 0 : tween(e, b - 0.2 + k * WORKS.outStagger, 0.14, ease.power2In);
  return roll(inP, outP);
}

/** How much farther than a line the button travels, so its focus ring clears the mask too. */
export const WORKS_BUTTON = 1.3;

/**
 * A study's button, from its line's roll (worksLine): its yPercent, and its
 * opacity. Being a block rather than display type, the dark plate fades
 * with how much of it shows past the mask's edge: fully clear by the time
 * its label is, and gone while only the plate's padding would show, so a
 * sliver of it never reads as a bare bar (the label's capitals sit between
 * 39% and 59% of its height).
 */
export function worksButton(y: number) {
  const shown = clamp(1 - Math.abs(y * WORKS_BUTTON) / 100);
  return { y: y * WORKS_BUTTON, opacity: smoothstep(shown, 0.36, 0.72) };
}

/* ---- The making of a house (820vh track: five chapters under one pinned 100vh stage) ---- */

/**
 * The making-of section's timeline, in screens of scroll since its stage
 * pinned (e, sso − 1). The chapters start at `starts` and the stage
 * releases at `release`. One board shows the big house's project from its
 * site to its permit set:
 *   - `draw`: when a line drawing is drafted, a segment at a time (start,
 *     length): the site plan, the floor plan, the front elevation, the
 *     structure over it, the sheet's border and title block;
 *   - `fade`: each layer's opacity as keyframes [e, opacity], eased from
 *     one to the next: the site's footprint, the plan's poché and room
 *     names, the windows lit, the rendering by day, the paper veil laid
 *     over it for the engineering, the title block, the rendering at dusk;
 *   - `zoom`: the site plan drawn closer until its house is the floor plan
 *     (MK_SITE_ZOOM), as it fades.
 * Each chapter's changes come together as its text hands over, and what
 * they leave is held whole while it is read: each chapter's text is
 * composed for 0.6 screens or more, and the board rests for 0.4 screens or
 * more after each chapter's changes and 0.6 after the house is shown at
 * dusk, so a touch screen settling the page never carries it past one
 * (settle.ts). A drawing being drafted is whole at every moment.
 */
export const MAKING = {
  starts: [0, 1.15, 2.45, 4.2, 5.45],
  release: 7.2,
  draw: {
    siteLot: [-0.42, 0.4],
    siteFine: [-0.24, 0.36],
    siteWays: [-0.08, 0.26],
    planWalls: [1.2, 0.26],
    planOpenings: [1.3, 0.18],
    planDoors: [1.34, 0.16],
    planFittings: [1.38, 0.14],
    elevGround: [2.38, 0.12],
    elevOutline: [2.41, 0.26],
    elevPanels: [2.53, 0.22],
    elevOpenings: [2.62, 0.24],
    elevMullions: [2.72, 0.2],
    elevJoints: [2.78, 0.18],
    engSolid: [4.22, 0.3],
    engHidden: [4.28, 0.28],
    sheet: [5.45, 0.24],
  },
  fade: {
    siteHouse: [[0.14, 0], [0.3, 1], [1.22, 1], [1.38, 0]],
    siteLabels: [[0.16, 0], [0.3, 1], [0.98, 1], [1.1, 0]],
    site: [[1.22, 1], [1.38, 0]],
    planPoche: [[1.46, 0], [1.58, 1]],
    planLabels: [[1.48, 0], [1.6, 1]],
    plan: [[2.35, 1], [2.53, 0]],
    glass: [[2.94, 0], [3.08, 1], [6.3, 1], [6.48, 0]],
    day: [[3.08, 0], [3.28, 1]],
    lines: [[3.22, 1], [3.4, 0], [4.12, 0], [4.26, 0.5], [6.3, 0.5], [6.48, 0]],
    veil: [[4.12, 0], [4.26, 0.86], [6.3, 0.86], [6.5, 0]],
    engLabels: [[4.5, 0], [4.64, 1]],
    eng: [[6.3, 1], [6.48, 0]],
    sheet: [[6.3, 1], [6.48, 0]],
    title: [[5.61, 0], [5.75, 1], [6.3, 1], [6.48, 0]],
    dusk: [[6.3, 0], [6.55, 1]],
  },
  zoom: [1.0, 0.38],
} as const;

export type MakingDraw = keyof typeof MAKING.draw;
export type MakingFade = keyof typeof MAKING.fade;

/** A share of a drawing each line takes to draw (storyLineDraw). */
export const MAKING_LINE_DUR = 0.08;
/** How far a drafted line runs past its ends, in the board's units (3547 across). */
export const MAKING_OVERSHOOT = 14;
/** From here the house at dusk may play its film; below it the film rests at its first frame. */
export const MAKING_FILM_AT = 6.55;

/** The section's length in vh: the stage pinned until it releases, and one screen for it to arrive. */
export function makingSectionVh() {
  return Math.round((MAKING.release + 1) * 100);
}

/** How much of drawing `k` is drafted at `e`, 0 → 1. */
export function makingDraw(e: number, k: MakingDraw) {
  const [start, length] = MAKING.draw[k];
  return tween(e, start, length);
}

/** Layer `k`'s opacity at `e`, eased between its keyframes, and whether it is changing there. */
export function makingFade(e: number, k: MakingFade): { value: number; moving: boolean } {
  const keys = MAKING.fade[k] as readonly (readonly [number, number])[];
  if (e <= keys[0][0]) return { value: keys[0][1], moving: false };
  for (let i = 0; i + 1 < keys.length; i++) {
    const [a, va] = keys[i];
    const [b, vb] = keys[i + 1];
    if (e < b) {
      if (va === vb) return { value: va, moving: false };
      return { value: mix(va, vb, ease.power2InOut(clamp((e - a) / (b - a)))), moving: true };
    }
  }
  return { value: keys[keys.length - 1][1], moving: false };
}

/** How far the site plan has been drawn in to the floor plan, 0 → 1. */
export function makingZoom(e: number) {
  return tween(e, MAKING.zoom[0], MAKING.zoom[1], ease.power2InOut);
}

/**
 * One masked line of chapter i's text (k: 0 the chapter's label, then its
 * title's lines, then its body's), on the story's rhythm: the lines rise
 * 0.035 apart from just before the chapter starts and leave 0.02 apart
 * from 0.2 before the next; the first chapter rises with the stage, the
 * last never leaves.
 */
export function makingLine(e: number, i: number, n: number, k: number) {
  const a = MAKING.starts[i] ?? 0;
  const inP = i === 0 ? tween(e, -0.36 + k * WORKS.stagger, 0.26, ease.power3Out) : tween(e, a - 0.03 + k * WORKS.stagger, 0.22, ease.power3Out);
  const outP = i === n - 1 ? 0 : tween(e, (MAKING.starts[i + 1] ?? Infinity) - 0.2 + k * WORKS.outStagger, 0.14, ease.power2In);
  return roll(inP, outP);
}

/** The chapter the reader is in: it turns over with the text, just before the boundary. */
export function makingChapter(e: number) {
  let c = 0;
  MAKING.starts.forEach((a, i) => {
    if (e + 0.05 >= a) c = i;
  });
  return c;
}

/** How far through chapter i the reader is, 0 → 1 (the contents' bars): the last runs to the release. */
export function makingFill(e: number, i: number) {
  const a = MAKING.starts[i] ?? 0;
  const b = MAKING.starts[i + 1] ?? MAKING.release;
  return clamp((e - a) / (b - a));
}

/*
 * ---- Values (400vh track: four 100vh blocks under one pinned 100vh stage) ----
 *
 * x: screens of scroll since value i's block reached the top of the screen,
 * so its picture is centred at x = 0 and the pictures either side are at
 * ±1. At every handover (x = ±0.5) the word sits on clean ivory between two
 * pictures.
 */

/**
 * One value's word, as a yPercent for roll(): it rolls like an odometer.
 * At each handover the outgoing word leads by 0.02 screens and both travel
 * on the same scrubbed ease (power2InOut, 0.16 screens), so the incoming
 * word is always at least a full mask (MASK %) below the outgoing one and
 * the two never print over each other. The first word rises as the stage
 * comes up (power3Out) and the last leaves as dusk falls (power2In); its x
 * equals sso(services), the axis the page ground reads.
 */
export function valuesTitle(x: number, i: number, n: number) {
  const inP = i === 0 ? tween(x, -0.45, 0.28, ease.power3Out) : tween(x, -0.56, 0.16, ease.power2InOut);
  const outP = i === n - 1 ? tween(x, 0.2, 0.16, ease.power2In) : tween(x, 0.42, 0.16, ease.power2InOut);
  return roll(inP, outP);
}

/**
 * Line k of value i's description: the lines leave 0.012 apart, top first,
 * and have all gone (six of them, as on the narrowest phones) by the time
 * the word is half-way through its roll; the next value's lines rise 0.03
 * apart from that moment. So the old description never lingers under a new
 * word, and in no row (or the clip margin two rows share) do two lines ever
 * move at once.
 */
export function valuesDescLine(x: number, i: number, n: number, k: number) {
  const inP = i === 0 ? tween(x, -0.38 + 0.03 * k, 0.26, ease.power3Out) : tween(x, -0.5 + 0.03 * k, 0.2, ease.power3Out);
  const outP = tween(x, (i === n - 1 ? 0.12 : 0.32) + 0.012 * k, 0.12, ease.power2In);
  return roll(inP, outP);
}

/** The picture grows from 0.72 to full size as it reaches the centre and shrinks again after; it dims as dusk falls (`fade`, the page ground's). */
export function valuesImage(x: number, fade: number) {
  return { scale: mix(0.72, 1, 1 - smoothstep(Math.abs(x), 0, 0.75)), brightness: mix(1, 0.5, fade) };
}

/** Where the wordmark face's cap line sits, in em above the middle of a word's line (line-height 0.9, in a 0.92em mask). */
export const VALUES_CAP = 0.32;

/**
 * A pinned word's size in px, so it keeps clear of the section's corner
 * label (px in the stage: the bottom of its block and the right edge of its
 * text) by `gap` (1.25rem; about 1.5rem from the note's letters, under its
 * last line's leading). The words are centred together on one line, `mid`,
 * which does not move with their size, so a smaller word's cap line sits
 * lower: a word clears the label either below it or beside it (centred on a
 * screen `vw` wide). Returns `size` when it already clears, else the larger
 * of the two sizes that do, and never less than 0.6 × `size` (a short
 * phone, where neither is possible, keeps most of its word).
 */
export function valuesWordSize(size: number, width: number, mid: number, vw: number, label: { bottom: number; right: number }, gap = 20) {
  const below = (mid - label.bottom - gap) / VALUES_CAP;
  const beside = width > 0 ? (size * (vw - 2 * (label.right + gap))) / width : size;
  return Math.max(0.6 * size, Math.min(size, Math.max(below, beside)));
}

/* ---- Page ground ---- */

export const CREAM = 0xf4f1eb;
export const STONE = 0xece7df;
export const NIGHT = 0x191918;

/**
 * The page ground, one material per section: cream, stone under Works (in
 * as Works rises over the top half of the screen, out over its last 0.35
 * screen), cream again for Values, then dusk falls quickly as Services
 * comes up (sso 0.24 → 0.46), blended in OKLab so the middle stays warm:
 * after the last Values word has gone and before the Services heading
 * rises, while the two sections' pictures fill the screen between them.
 * It stays night under Contact's own ivory and the footer.
 */
export function pageGround(ssoWorks: number, hsoWorks: number, ssoServices: number) {
  const stone = smoothstep(ssoWorks, 0.55, 0.95) * (1 - smoothstep(hsoWorks, -0.35, 0));
  const fade = dusk(ssoServices);
  return { fade, color: mixColorOklab(mixColorNum(CREAM, STONE, stone), NIGHT, fade) };
}

/** How far dusk has fallen, 0–1, from Services' sso (pageGround). */
export function dusk(ssoServices: number) {
  return smoothstep(ssoServices, 0.24, 0.46);
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

/* ---- Services (300vh track: a stage pinned for two screens, on screens from 768px wide and 720px tall; elsewhere it flows) ---- */

/**
 * A wipe that rises from a frame's bottom edge, or from the bottom of the
 * screen while that edge is still below it, as the inset from the frame's
 * top in %. `p` runs the wipe 0 → 1; `top` and `height` are the frame's on
 * the screen, in px. Until a frame is all on screen only the part above
 * the bottom of the screen is wiped, so the rising edge is always seen.
 */
export function riseInset(p: number, top: number, height: number, vh: number) {
  const run = height > 0 ? clamp((Math.min(vh, top + height) - top) / height) : 1;
  return (1 - p) * run * 100;
}

/**
 * The Services picture as it comes up: `rise` is how far the frame's top
 * has risen above the bottom of the screen, in screens. Its sheet wipes up
 * from the bottom (riseInset) from the moment it shows, while the picture
 * settles from 1.2 and 6% low; over in half a screen, an entrance ease, so
 * the last of it settles slowly. With the stage's lead (servicesLead) it
 * starts while the last Values picture is still centred, just below it.
 */
export function servicesReveal(rise: number) {
  return servicesRevealAt(tween(rise, 0.02, 0.5, ease.power3Out));
}

/** The Services picture `r` of the way in (servicesReveal), however `r` is driven: by the scroll, or on touch screens by its own clock. */
export function servicesRevealAt(r: number) {
  return { r, scale: mix(1.2, 1, r), y: (1 - r) * 6 };
}

/**
 * How far the stage rides above its place in the track as it comes up, in
 * screens: 0.3 until sso 0.4, so the picture follows close under the last
 * Values picture and the heading is in the middle of the screen as the
 * dusk ends; then it eases back to its place on power2In, which brings the
 * stage's speed to 0 just as it pins (0.3 × 2 / 0.6 = one screen per
 * screen), so it settles into the hold rather than stopping dead.
 */
export const SERVICES_LEAD = 0.3;
export function servicesLead(s: number) {
  const u = clamp((s - 0.4) / 0.6);
  return SERVICES_LEAD * (1 - u * u);
}

/** Heading line j rises from its mask from sso 0.36 of the track, 0.06 apart: as the ground passes night 0.5, so ivory type never sits on a pale ground. */
export function servicesHeading(s: number, j: number) {
  return roll(tween(s, 0.36 + j * 0.06, 0.34, ease.power3Out), 0);
}

/** How far a row's label is up when its scope and arrow start to fade in. */
export const SERVICES_META_ON = 0.6;

/**
 * Slot k of the list on the pinned track, from the track's sso: the list
 * in order, each group's label and then its rows (two labels and seven
 * rows), 0.03 apart. A label or a row's name rises from its mask (`y`, a
 * yPercent) and a row's rule draws across (`t`). A row's scope and arrow
 * (`meta`) are switched on once its name is most of the way up, and fade
 * in on their own just behind it (a 0.3s transition in globals.css, not
 * written frame by frame). The last row (slot 8) is in place at sso 0.98,
 * as the stage pins, so the composition is whole for all of the hold.
 */
export function servicesRow(s: number, k: number) {
  const t = tween(s, 0.44 + k * 0.03, 0.3, ease.power3Out);
  return { t, y: roll(t, 0), meta: t >= SERVICES_META_ON };
}

/** On the pinned track, the row that scrolling has reached: the hold is shared out evenly between the n rows. */
export function servicesIndex(scroll: number, top: number, height: number, vh: number, n: number) {
  return Math.min(n - 1, Math.floor(clamp((scroll - top) / Math.max(1, height - vh)) * n));
}

/** Whether the pinned stage is holding: from the moment it pins to the moment it releases. Only then may a hover choose the picture; before, the list is still rising under the pointer. */
export function servicesHold(scroll: number, top: number, height: number, vh: number) {
  return scroll >= top && scroll <= top + Math.max(0, height - vh);
}

/** Seconds a picture takes to wipe up over the last one. */
export const SERVICES_WIPE = 0.7;

/**
 * One picture in the Services frame's stack (bottom first): `from` is how
 * far its sheet had risen when it last changed direction at `t0` (seconds),
 * `dir` 1 while it rises over the pictures below, −1 while it slides back
 * down off them.
 */
export interface SwapLayer {
  i: number;
  from: number;
  t0: number;
  dir: 1 | -1;
}

/** How far a layer's sheet has risen, 0–1, at `time`: SERVICES_WIPE seconds from its last change, on an entrance ease; `instant` (reduced motion) jumps to the end. */
export function swapK(layer: SwapLayer, time: number, instant = false) {
  const e = instant ? 1 : tween(time - layer.t0, 0, SERVICES_WIPE, ease.power3Out);
  return layer.dir > 0 ? mix(layer.from, 1, e) : layer.from * (1 - e);
}

/**
 * The stack once the frame is asked to show picture `target`. A new
 * picture's sheet rises from the bottom over whatever is showing, and every
 * sheet already rising keeps rising on its own clock underneath, so a quick
 * run over the rows never cuts from one picture to another. Asked for a
 * picture still in the stack, the sheets above it slide back down from
 * wherever they are, uncovering it (a hover onto a row and straight back).
 */
export function swapTo(stack: SwapLayer[], target: number, time: number, instant = false): SwapLayer[] {
  const at = stack.findIndex((l) => l.i === target);
  if (at < 0) return [...stack, { i: target, from: 0, t0: time, dir: 1 }];
  return stack.map((l, j) => {
    const want: 1 | -1 = j > at ? -1 : 1;
    return j < at || l.dir === want ? l : { ...l, from: swapK(l, time, instant), t0: time, dir: want };
  });
}

/** Drops the sheets that have slid back down, and every picture under one that is fully up: the bottom of the stack is always a whole picture. */
export function swapSettle(stack: SwapLayer[], time: number, instant = false): SwapLayer[] {
  const live = stack.filter((l) => l.dir > 0 || swapK(l, time, instant) > 0);
  let base = 0;
  live.forEach((l, j) => {
    if (l.dir > 0 && swapK(l, time, instant) >= 1) base = j;
  });
  return base ? live.slice(base) : live;
}

/** How one layer is drawn: its sheet's inset from the top (%), its settle from 1.08, and its darkening to 0.7 as the sheet above it (kAbove) rises over it. */
export function swapLayer(k: number, kAbove: number) {
  return { clip: (1 - k) * 100, scale: 1.08 - 0.08 * k, brightness: 1 - 0.3 * kAbove };
}

/* ---- Services to Contact: the ivory sheet ---- */

/** As Contact's sheet rises over it (x, Contact's sso, 0 → 1), Services lags 0.35 screen behind the scroll and dims to 0.45: it recedes into the night. */
export function servicesHandover(x: number) {
  const c = clamp(x);
  return { lift: 0.35 * c, opacity: 1 - 0.55 * c };
}

/* ---- Contact ---- */

/**
 * A masked line of the close, from its block's own sso: the label, each
 * line of the heading and each line of the paragraph rise from their
 * masks, line j 0.04 after the one above it, each over 0.3, so a block's
 * lines are all in place by the time its top is halfway up the screen.
 */
export function contactLine(s: number, j: number) {
  return roll(tween(s, 0.06 + j * 0.04, 0.3, ease.power3Out), 0);
}

/**
 * A block of the close (the actions, a cell of the title block), from its
 * own sso: it rises `rise` px and fades in over the first 40% of its run (a
 * block may fade; its type never does on its own), starting `delay` after
 * 0.06 and taking `duration`.
 */
export function contactRise(s: number, delay = 0, rise = 24, duration = 0.3) {
  return contactRiseAt(tween(s, 0.06 + delay, duration, ease.power3Out), rise);
}

/** A block of the close `t` of the way up (contactRise), however `t` is driven. */
export function contactRiseAt(t: number, rise = 24) {
  return { t, y: (1 - t) * rise, opacity: Math.min(1, t * 2.5) };
}

/** The picture, from its frame's own sso: its sheet wipes up as `t` runs (riseInset) while the picture settles from 1.12. */
export function contactPicture(s: number) {
  return contactPictureAt(tween(s, 0.04, 0.4, ease.power3Out));
}

/** The picture `t` of the way in (contactPicture), however `t` is driven. */
export function contactPictureAt(t: number) {
  return { t, scale: mix(1.12, 1, t) };
}

/**
 * The title block, from its own sso: drawn in from the left (the share of
 * its width shown), over 0.24 from 0.02. The block sits low in the
 * section, so everything in it is done by 0.38: at 1440×900, as the
 * section's top reaches the top of the screen.
 */
export function contactBlock(s: number) {
  return tween(s, 0.02, 0.24, ease.power2InOut);
}

/**
 * A cell of the title block, from its own sso: it rises 12px and fades in
 * behind the drawing's edge, cells in one row left to right, `rank` 0.02
 * apart; the last of six is done by 0.38.
 */
export function contactCell(s: number, rank: number) {
  return contactRise(s, rank * 0.02, 12, 0.22);
}

/* ---- Touch screens: where a scene is part way (settle.ts) ---- */

/*
 * On touch screens the page is never left at rest part way through a
 * change: each scene says where that would be (its module's zones, found
 * with these), and the engine settles the page out of them. A change is
 * part way while a masked line is cut by its mask, some of it showing and
 * some hidden, or while a wipe, the ring's fling, the trace turning to
 * paper or the dusk has begun and not finished. The rest is whole at every
 * moment, so the page may stop among it: drawings in progress (the story's
 * sketch and engineering, each stroke a finished line), pictures on the
 * move (the ring, the drifts, the Values pictures' growth) and the sheets
 * that rise with the page between sections.
 */

/** How far a masked line may stand off its place, or below its mask, in % of its height, and still be at rest. */
export const LINE_REST = 3;

/** Whether a masked line at yPercent `y` (roll()) is cut by its mask. */
export function lineCut(y: number) {
  const a = Math.abs(y);
  return a > LINE_REST && a < MASK - LINE_REST;
}

/** Whether a wipe, or any change that runs 0 → 1, is part way: more than half a percent from either end. */
export function partWay(p: number) {
  return p > 0.005 && p < 0.995;
}

const anyOf = (n: number, test: (k: number) => boolean) => {
  for (let k = 0; k < n; k++) if (test(k)) return true;
  return false;
};

/** The hero (heroState): the name or a line of the statement part way out through its mask. */
export function heroPartWay(scroll: number, top: number, vh: number) {
  const st = heroState(scroll, top, vh);
  return lineCut(st.nameRoll) || st.subRoll.some((y) => lineCut(y));
}

/** The intro at its sso `s`, with `lines[i]` lines in paragraph i: a line part way through its mask, or the ring part way through its fling. */
export function introPartWay(s: number, lines: readonly number[]) {
  const { copyIn, exitStart, sectionVh } = introPhases(lines.length);
  const { e, exit } = introProgress(s, sectionVh / 100, exitStart);
  return partWay(exit) || lines.some((count, i) => anyOf(count, (j) => lineCut(introLine(e, copyIn[i], j))));
}

/**
 * The story at `e` (storyState), with `lines[i]` masked lines in chapter i
 * (its label, its title's lines, its body's) and `fields` values in the
 * title block: the section's label (if it has one), a line or a value part
 * out of its mask; or the sheet's, the rendering's or the trace's wipe, the
 * trace turning to paper, or the drawing coming back in ink and
 * straightening, part way.
 */
export function storyPartWay(e: number, lines: readonly number[], fields: number, label = true) {
  const st = storyState(e);
  const n = lines.length;
  return (
    (label && lineCut(sectionLabel(e + 1, LABEL_IN.story))) ||
    [st.sheet, st.render, st.veil, st.paper, st.ink, st.rectify].some((p) => partWay(p)) ||
    lines.some((count, i) => anyOf(count, (k) => lineCut(storyLine(e, i, n, k)))) ||
    anyOf(fields, (k) => lineCut(storyField(e, k)))
  );
}

/**
 * The making-of board at `e` (MAKING), with `lines[i]` masked lines in
 * chapter i: the section's label (if it has one) or a line part out of its
 * mask; or a layer part faded, or the site part drawn in. A drawing part
 * drafted is whole.
 */
export function makingPartWay(e: number, lines: readonly number[], label = true) {
  const n = lines.length;
  return (
    (label && lineCut(sectionLabel(e + 1, LABEL_IN.making))) ||
    (Object.keys(MAKING.fade) as MakingFade[]).some((k) => makingFade(e, k).moving) ||
    partWay(makingZoom(e)) ||
    lines.some((count, i) => anyOf(count, (k) => lineCut(makingLine(e, i, n, k))))
  );
}

/** Works at `e`, pinned for `D` screens (worksShot), with `titles[i]` lines in project i's title: the label, the project's eyebrow, a title line or its button (which travels farther, worksButton) part out of its mask, or a picture's wipe part way. */
export function worksPartWay(e: number, D: number, titles: readonly number[], label = true) {
  const n = titles.length;
  const project = (i: number) => {
    const last = titles[i] + 1;
    return partWay(worksShot(e, i, n, D).inP) || anyOf(last, (k) => lineCut(worksLine(e, i, n, D, k))) || lineCut(worksButton(worksLine(e, i, n, D, last)).y);
  };
  return (label && lineCut(sectionLabel(e + 1, LABEL_IN.works))) || anyOf(n, project);
}

/** Values with value i at `xs[i]` (valuesTitle) and the section at sso `s`, `lines[i]` lines in value i's description: the label, a word or a line of description part out of its mask. */
export function valuesPartWay(xs: readonly number[], s: number, lines: readonly number[], label = true) {
  const n = xs.length;
  return (label && lineCut(sectionLabel(s, LABEL_IN.values))) || xs.some((x, i) => lineCut(valuesTitle(x, i, n)) || anyOf(lines[i] ?? 0, (k) => lineCut(valuesDescLine(x, i, n, k))));
}

/** The page ground, from Services' sso: dusk part fallen. */
export function duskPartWay(ssoServices: number) {
  return partWay(dusk(ssoServices));
}

/** Services from its track's sso `s`, with `heading` lines in its heading and, on the pinned track, `slots` labels and rows in the list (0 where it flows): the eyebrow (if there is one), a heading line or a slot part out of its mask. */
export function servicesPartWay(s: number, heading: number, slots: number, eyebrow = true) {
  return (eyebrow && lineCut(sectionLabel(s, LABEL_IN.services))) || anyOf(heading, (j) => lineCut(servicesHeading(s, j))) || anyOf(slots, (k) => lineCut(servicesRow(s, k).y));
}
