/*
 * The drawing in the homepage story (src/components/home/Story.tsx): an
 * elevation of the narrow contemporary house, traced from its client
 * rendering (plates.narrow, 2800 × 2479), with the engineering laid over it.
 *
 * How it was measured (docs/IMAGES.md, "The story drawing"):
 * the rendering is a one-point perspective. Its verticals are vertical and
 * every horizontal edge of the facade runs to one vanishing point far to the
 * left, VP below (a least-squares fit to 132 edges, within 0.04°). The
 * homography that keeps verticals vertical and sends that point to infinity
 * turns the facade into a true elevation; every line here was measured on
 * the rendering rectified that way, in its pixels (the elevation space).
 *
 * Every line therefore has two places, both in the rendering's 2800 × 2479
 * box:
 *   - `p`, over the picture: mapped back through the homography, so it
 *     lands on the picture's own edges;
 *   - `q`, on the drawing sheet: the elevation itself, square and level,
 *     scaled into the box beside its levels and grid.
 * Where depth shows the picture something an elevation would not (the
 * porch floor seen from above, the steps coming forward, the window deep in
 * its surround), the line's sheet position (`e`) differs from where it was
 * measured. The story animates every line from one place to the other.
 *
 * Nothing here is a real measurement of the project: the levels, grid and
 * structure are placed to explain how a house is engineered, and the
 * section's caption says the linework is drawn for illustration.
 */

export const STORY_W = 2800;
export const STORY_H = 2479;

/** The vanishing point of the facade's horizontals, in the rendering's pixels. */
export const STORY_VP = { x: -9058.06, y: 1916.24 } as const;
/** The column the rectification keeps at the picture's own scale and proportions (near the house's right edge). */
const REF = 2480;
/** The elevation space is the rectified picture shifted by this much (its canvas started at (−300, −200)). */
const U0 = -300;
const V0 = -200;

const K = 1 / (STORY_VP.x - 2 * REF);
const A = K * STORY_VP.x;
const B = REF * (K * (REF - STORY_VP.x) + 1);
const S = K * REF + 1;

export type Pt = readonly [number, number];
export type Seg = readonly [number, number, number, number];

/** A point of the elevation, where the rendering shows it. */
export function toPicture(x: number, y: number): Pt {
  const u = x + U0;
  const v = y + V0;
  const den = K * u + 1;
  return [(A * u + B) / den, STORY_VP.y + (S * (v - STORY_VP.y)) / den];
}

/** A point of the rendering, in the elevation (the inverse of toPicture). */
export function toElevation(x: number, y: number): Pt {
  const u = (B - x) / (x * K - A);
  const den = K * u + 1;
  return [u - U0, STORY_VP.y + ((y - STORY_VP.y) * den) / S - V0];
}

/** What the sheet shows of the elevation: the house with its levels' markers, grid bubbles and footings. */
const BOUNDS = { x0: 20, y0: 40, x1: 2880, y1: 2680 } as const;
const MARGIN = 70;
const SCALE = Math.min((STORY_W - 2 * MARGIN) / (BOUNDS.x1 - BOUNDS.x0), (STORY_H - 2 * MARGIN) / (BOUNDS.y1 - BOUNDS.y0));
const TX = (STORY_W - SCALE * (BOUNDS.x1 + BOUNDS.x0)) / 2;
const TY = (STORY_H - SCALE * (BOUNDS.y1 + BOUNDS.y0)) / 2;

/** A point of the elevation, where the drawing sheet shows it. */
export function toSheet(x: number, y: number): Pt {
  return [TX + SCALE * x, TY + SCALE * y];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const seg = (f: (x: number, y: number) => Pt, [x1, y1, x2, y2]: Seg): Seg => {
  const a = f(x1, y1);
  const b = f(x2, y2);
  return [r1(a[0]), r1(a[1]), r1(b[0]), r1(b[1])];
};

/**
 * Line kinds, in the order the sketch draws them: the ground, the volumes'
 * outlines, the openings, the details, then the joints and boards.
 */
export const LINE_KINDS = ["ground", "outline", "opening", "detail", "texture"] as const;
export type LineKind = (typeof LINE_KINDS)[number];

interface LineSpec {
  /** Where it was measured, in the elevation. */
  m: Seg;
  /** Where the elevation drawing puts it, when depth moved it in the picture. */
  e?: Seg;
  kind: LineKind;
}

const GRADE = 2540;
const specs: LineSpec[] = [];
const line = (m: Seg, kind: LineKind, e?: Seg) => specs.push({ m, kind, e });
const h = (y: number, x1: number, x2: number, kind: LineKind, e?: Seg) => line([x1, y, x2, y], kind, e);
const v = (x: number, y1: number, y2: number, kind: LineKind, e?: Seg) => line([x, y1, x, y2], kind, e);
/** A rectangle's sides (top, right, bottom, left; a subset with `sides`), each drawn as its own line. `e` moves the whole rectangle on the sheet. */
function box(x1: number, y1: number, x2: number, y2: number, kind: LineKind, sides = "trbl", e?: Seg) {
  const [a, b, c, d] = e ?? [x1, y1, x2, y2];
  if (sides.includes("t")) h(y1, x1, x2, kind, e && [a, b, c, b]);
  if (sides.includes("r")) v(x2, y1, y2, kind, e && [c, b, c, d]);
  if (sides.includes("b")) h(y2, x2, x1, kind, e && [c, d, a, d]);
  if (sides.includes("l")) v(x1, y2, y1, kind, e && [a, d, a, b]);
}

// The ground: stepped in the picture (the walk in front of the steps is nearer, so lower), one grade line on the sheet.
h(2539, 1644, 2900, "ground", [1644, GRADE, 2900, GRADE]);
h(2610, 1644, 330, "ground", [1644, GRADE, 30, GRADE]);

// The white box: coping, faces, window opening and frame.
box(605, 275, 1693, 299, "outline");
v(612, 299, 1210, "outline");
v(1689, 299, 1210, "outline");
box(843, 463, 1463, 1141, "opening");
box(868, 492, 1450, 1134, "opening");

// The panelled strip between the boxes.
h(338, 1711, 1822, "outline");
v(1711, 338, 1210, "outline");
for (const y of [401, 527, 655, 780, 905, 1030, 1155, 1279, 1402]) h(y, 1711, 1822, "texture");
for (const [y1, y2] of [
  [401, 527],
  [655, 780],
  [905, 1030],
  [1155, 1279],
]) {
  v(1766, y1, y2, "texture");
}

// The dark box: coping, faces, underside, the deep surround and its window (set evenly in its surround on the sheet).
box(1815, 275, 2742, 297, "outline");
v(1822, 297, 1483, "outline");
v(2732, 297, 1483, "outline");
h(1483, 1822, 2732, "outline");
box(1963, 405, 2716, 1345, "opening");
box(2069, 545, 2650, 1282, "opening", "trbl", [2035, 477, 2644, 1273]);
box(2090, 590, 2635, 1270, "opening", "trbl", [2057, 499, 2622, 1251]);
line([1963, 405, 2069, 545], "detail", [1963, 405, 2035, 477]);
line([2716, 405, 2650, 545], "detail", [2716, 405, 2644, 477]);
line([2716, 1345, 2650, 1282], "detail", [2716, 1345, 2644, 1273]);
line([1963, 1345, 2069, 1282], "detail", [1963, 1345, 2035, 1273]);

// The porch canopy: cap, two fascias, the beam between the posts.
box(417, 1210, 1682, 1239, "outline");
v(417, 1239, 1305, "outline");
h(1305, 417, 1682, "outline");
v(1682, 1239, 1305, "outline");
v(441, 1305, 1380, "outline");
h(1380, 441, 1669, "outline");
v(1669, 1305, 1380, "outline");
h(1467, 689, 1531, "detail");
h(1497, 689, 1531, "detail");

// The posts.
box(544, 1380, 689, 2416, "outline", "rl");
v(581, 1380, 2416, "texture");
box(1531, 1380, 1641, 2416, "outline", "rl");

// The entry: the porch's back wall, the door with its transom and sidelights, a wall light (the door stands on the porch floor on the sheet).
v(872, 1560, 2345, "detail", [872, 1560, 872, 2416]);
box(1068, 1634, 1531, 2345, "opening", "tl", [1068, 1634, 1531, 2416]);
h(1808, 1068, 1531, "opening");
v(1206, 1808, 2345, "opening", [1206, 1808, 1206, 2416]);
v(1466, 1808, 2345, "opening", [1466, 1808, 1466, 2416]);
box(984, 1755, 1011, 1965, "detail");

// The porch floor and steps (the steps come down to grade on the sheet).
box(593, 2416, 1645, 2465, "outline", "tlb");
box(697, 2476, 1406, 2550, "outline", "tlr", [697, 2465, 1406, 2503]);
box(645, 2550, 1382, 2610, "outline", "tlr", [645, 2503, 1382, GRADE]);

// The garage wall and its stone joints.
v(1644, 1483, 2539, "outline", [1644, 1483, 1644, GRADE]);
v(2732, 1483, 2539, "outline", [2732, 1483, 2732, GRADE]);
for (const y of [1525, 1648, 1771]) h(y, 1644, 2732, "texture");
for (const y of [1888, 2011, 2133, 2256, 2378]) {
  h(y, 1644, 1761, "texture");
  h(y, 2588, 2732, "texture");
}
v(1985, 1525, 1648, "texture");
v(2470, 1525, 1648, "texture");
v(2370, 1648, 1771, "texture");

// The garage door: trim, door, its sections, every other board, and the light above it.
box(1761, 1797, 2588, 2539, "opening", "ltr", [1761, 1797, 2588, GRADE]);
box(1789, 1820, 2561, 2539, "opening", "ltr", [1789, 1820, 2561, GRADE]);
for (const y of [2001, 2181, 2361]) h(y, 1789, 2561, "detail");
for (let y = 1834.6; y < 2530; y += 26.8) if ([2001, 2181, 2361].every((s) => Math.abs(y - s) > 8)) h(r1(y), 1789, 2561, "texture");
box(2172, 1520, 2184, 1765, "detail");

export interface StoryLine {
  kind: LineKind;
  /** Over the picture. */
  p: Seg;
  /** On the drawing sheet. */
  q: Seg;
}

/** Every line, in the order the sketch draws them: by kind, then as listed. */
export const storyLines: StoryLine[] = LINE_KINDS.flatMap((kind) =>
  specs.filter((s) => s.kind === kind).map((s) => ({ kind, p: seg(toPicture, s.m), q: seg(toSheet, s.e ?? s.m) })),
);

/* ---- The engineering, laid over the picture and kept on the sheet ---- */

/** Picture-space y of the grid bubbles' centres: the rendering has no sky above the dark box, so over the picture they sit in a row near its top edge. */
const BUBBLE_PICTURE_Y = 74;
/** Elevation y of the bubbles' centres on the sheet, above the roofs. */
const BUBBLE_SHEET_Y = 120;
/** Where the grid lines end below grade, in the elevation. */
const GRID_FOOT = 2680;

export interface StoryAxis {
  label: string;
  /** The grid line, from under its bubble to below grade. */
  p: Seg;
  q: Seg;
  /** The bubble's centre. */
  pb: Pt;
  qb: Pt;
}

/** Structural grid lines on the main walls: the white box's outer face, the party line between the boxes, the dark box's outer face. */
export const storyGrid: StoryAxis[] = [
  { label: "1", x: 612 },
  { label: "2", x: 1766 },
  { label: "3", x: 2732 },
].map(({ label, x }) => {
  const [px] = toPicture(x, 0);
  return {
    label,
    p: [r1(px), BUBBLE_PICTURE_Y, r1(px), r1(toPicture(x, GRID_FOOT)[1])],
    q: seg(toSheet, [x, BUBBLE_SHEET_Y, x, GRID_FOOT]),
    pb: [r1(px), BUBBLE_PICTURE_Y],
    qb: toSheet(x, BUBBLE_SHEET_Y).map(r1) as unknown as Pt,
  };
});

export interface StoryLevel {
  label: string;
  /** A shorter label for a small sheet, where the full one would run into the house. */
  short?: string;
  /** The datum line, from its marker across the house. */
  p: Seg;
  q: Seg;
}

/**
 * Levels: the top of the roofs, the second floor, the ground floor (the
 * porch floor) and grade. On the sheet each runs from its marker past the
 * house; over the picture it stops at the last grid line, under that
 * line's bubble (the picture has no sky there, so the roof's line meets
 * the bubble).
 */
const LEVEL_X = [70, 2860] as const;
const LEVEL_PICTURE_END = 2732;
export const storyLevels: StoryLevel[] = [
  { label: "Roof", y: 275 },
  { label: "Level 2", short: "L2", y: 1406 },
  { label: "Level 1", short: "L1", y: 2416 },
  { label: "Grade", y: GRADE },
].map(({ label, short, y }) => ({ label, short, p: seg(toPicture, [LEVEL_X[0], y, LEVEL_PICTURE_END, y]), q: seg(toSheet, [LEVEL_X[0], y, LEVEL_X[1], y]) }));

export interface StoryMember {
  label: string;
  /** Outline sides, each its own line, so it draws round. */
  p: Seg[];
  q: Seg[];
  /** Where its label sits (start of the text's baseline). */
  pl: Pt;
  ql: Pt;
  /** Below grade, drawn dashed. */
  hidden: boolean;
}

const outline = ([x1, y1, x2, y2]: Seg): Seg[] => [
  [x1, y1, x2, y1],
  [x2, y1, x2, y2],
  [x2, y2, x1, y2],
  [x1, y2, x1, y1],
];

/** The structure the story points out: the header over the garage, the porch beam and posts, and their footings. The labels say what each is, never a size. */
export const storyMembers: StoryMember[] = [
  { label: "Beam", r: [1700, 1700, 2650, 1792] as Seg, at: [1712, 1676] as Pt, hidden: false },
  { label: "Beam", r: [544, 1384, 1641, 1497] as Seg, at: [712, 1458] as Pt, hidden: false },
  { label: "Post", r: [544, 1497, 689, 2416] as Seg, at: [712, 1990] as Pt, hidden: false },
  { label: "", r: [1531, 1497, 1641, 2416] as Seg, at: [0, 0] as Pt, hidden: false },
  { label: "Footing", r: [474, 2596, 759, 2664] as Seg, at: [800, 2645] as Pt, hidden: true },
  { label: "", r: [1446, 2596, 1726, 2664] as Seg, at: [0, 0] as Pt, hidden: true },
  { label: "", r: [1726, 2596, 2782, 2664] as Seg, at: [0, 0] as Pt, hidden: true },
].map(({ label, r, at, hidden }) => ({
  label,
  hidden,
  p: outline(r).map((s) => seg(toPicture, s)),
  q: outline(r).map((s) => seg(toSheet, s)),
  pl: toPicture(...at).map(r1) as unknown as Pt,
  ql: toSheet(...at).map(r1) as unknown as Pt,
}));
