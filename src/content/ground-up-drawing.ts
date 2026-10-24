/*
 * The drawing for "From the ground up" (GroundUp.tsx): an illustrative
 * two-storey house with a basement, not a client project, drawn as an
 * axonometric in five layers: the ground with the foundation in it, the
 * ground floor's framing, the ground floor, the second floor and the roof.
 *
 * The house is modelled in metres (x along the front, y back from it, z
 * up from grade) as boxes and the roof's planes, and seen from above its
 * front left corner in an orthographic view. Each layer is drawn on its
 * own with its hidden lines removed: its parts are painted back to front
 * on paper fills, every face with its edges, an edge between two faces of
 * one surface left out, and whatever shows through an opening (its
 * reveals, its glass) clipped to the opening. Parts that cannot hide one
 * another are painted together, so a layer is a few dozen paths. The
 * layers stack with a gap between them (the exploded drawing, the still
 * layout's), and close up into the house when the gaps are taken out.
 *
 * Every layer also has a draft: all of its edges, the hidden ones too,
 * from the ground up, as one path that HomeMotion draws line by line
 * before the layer fills in.
 *
 * None of it is a design for a real house: no sizes are shown, and the
 * caption says it is illustrative.
 */

type V3 = readonly [number, number, number];
type P2 = readonly [number, number];
type Seg2 = readonly [number, number, number, number];

/** Drawing units per metre. */
export const GU_UNIT = 100;
/** The view: the plan turned 30° and seen from 35° above the horizon. */
const AZ = (30 * Math.PI) / 180;
const EL = (35 * Math.PI) / 180;
const CA = Math.cos(AZ);
const SA = Math.sin(AZ);
const CE = Math.cos(EL);
const SE = Math.sin(EL);

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A point of the model on the drawing, in drawing units (y down). */
function proj(p: V3): P2 {
  return [(p[0] * CA - p[1] * SA) * GU_UNIT, -((p[0] * SA + p[1] * CA) * SE + p[2] * CE) * GU_UNIT];
}

/** How far up the drawing a metre of height moves a point, in drawing units. */
export const GU_RISE = CE * GU_UNIT;

/* ---- Materials and lines ---- */

/**
 * What a face is painted with (globals.css, .gu-solid): walls lit from the
 * front and in shade at the side, floors, wall tops cut through (poché),
 * the ground and the earth cut at its edges, steel, timber, the roof,
 * glass and the reveals of openings.
 */
export const GU_FILLS = ["lit", "shade", "floor", "cut", "ground", "earth", "steel", "timber", "roof", "glass"] as const;
export type GuFill = (typeof GU_FILLS)[number];
/** Lines: edges in ink, fine detail (glazing bars, seams, joists' edges), the earth's hatch, steel in red. */
export const GU_LINES = ["edge", "fine", "hatch", "steel"] as const;
export type GuLine = (typeof GU_LINES)[number];

interface Face {
  pts: V3[];
  holes: V3[][];
  fill: GuFill;
  line: GuLine;
  /** Shows only through `clip` (an opening's outline on the drawing): reveals, sills, glass. */
  inner?: boolean;
  clip?: P2[];
  /** Detail lines on the face, in its line's kind or `fine`. */
  marks?: [V3, V3][];
  markLine?: GuLine;
}

interface Prim {
  min: V3;
  max: V3;
  faces: Face[];
}

/* ---- Geometry helpers ---- */

const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** The convex hull of points on the drawing (monotone chain), anticlockwise in y-down terms. */
function hull(points: P2[]): P2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const lower: P2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Whether two convex outlines overlap by more than `eps` drawing units (separating axes). */
function overlaps(a: P2[], b: P2[], eps = 0.5) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const nx = q[1] - p[1];
      const ny = p[0] - q[0];
      const len = Math.hypot(nx, ny) || 1;
      let aMin = Infinity;
      let aMax = -Infinity;
      let bMin = Infinity;
      let bMax = -Infinity;
      for (const v of a) {
        const d = (v[0] * nx + v[1] * ny) / len;
        aMin = Math.min(aMin, d);
        aMax = Math.max(aMax, d);
      }
      for (const v of b) {
        const d = (v[0] * nx + v[1] * ny) / len;
        bMin = Math.min(bMin, d);
        bMax = Math.max(bMax, d);
      }
      if (aMax - eps <= bMin || bMax - eps <= aMin) return false;
    }
  }
  return true;
}

/** The part of segment ab inside convex polygon `clip` (Cyrus–Beck), or null. */
function clipSeg(a: P2, b: P2, clip: P2[]): Seg2 | null {
  // Orientation of the polygon, so "inside" is on the right side of every edge.
  let area = 0;
  for (let i = 0; i < clip.length; i++) area += cross([0, 0], clip[i], clip[(i + 1) % clip.length]);
  const s = area > 0 ? 1 : -1;
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (let i = 0; i < clip.length; i++) {
    const p = clip[i];
    const q = clip[(i + 1) % clip.length];
    // Inside: s × cross(p, q, x) >= 0.
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const num = s * (ex * (a[1] - p[1]) - ey * (a[0] - p[0]));
    const den = s * (ex * dy - ey * dx);
    if (Math.abs(den) < 1e-9) {
      if (num < 0) return null;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  if (t1 - t0 < 1e-6) return null;
  return [a[0] + dx * t0, a[1] + dy * t0, a[0] + dx * t1, a[1] + dy * t1];
}

const rect = (axis: 0 | 1 | 2, at: number, u0: number, u1: number, v0: number, v1: number): V3[] => {
  // A rectangle in the plane axis = at, spanning the other two axes in order (x, y, z without `axis`).
  const pt = (u: number, v: number): V3 => (axis === 0 ? [at, u, v] : axis === 1 ? [u, at, v] : [u, v, at]);
  return [pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)];
};

/* ---- Parts ---- */

interface Opening {
  /** Along the wall: x for a wall along x, y for a wall along y. */
  a: number;
  b: number;
  /** Sill and head heights (absolute z). */
  s: number;
  h: number;
  glass?: boolean;
}

interface BoxOptions {
  /** Fills for the front (y = min), side (x = min) and top faces. */
  front?: GuFill;
  side?: GuFill;
  top?: GuFill;
  line?: GuLine;
  /** Openings through the wall: in its front face for a wall along x, its side face for a wall along y. */
  openings?: Opening[];
  /** Which faces to draw (some are always hidden by a neighbour). */
  faces?: { front?: boolean; side?: boolean; top?: boolean };
  /** Detail lines on the top face (a stair's nosing, a joist's arris). */
  topMarks?: [V3, V3][];
}

/**
 * An axis-aligned box: its three faces that can be seen (front, side,
 * top), and through any openings in its long face the reveals that can be
 * seen (one jamb, the sill) and the glass, set at mid-depth.
 */
function box(min: V3, max: V3, o: BoxOptions = {}): Prim {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const line = o.line ?? "edge";
  const faces: Face[] = [];
  const show = { front: true, side: true, top: true, ...o.faces };
  const alongX = x1 - x0 >= y1 - y0;
  const front: Face = { pts: rect(1, y0, x0, x1, z0, z1), holes: [], fill: o.front ?? "lit", line };
  const side: Face = { pts: rect(0, x0, y0, y1, z0, z1), holes: [], fill: o.side ?? "shade", line };
  for (const op of o.openings ?? []) {
    if (alongX) {
      // Through the front face: the jamb at b faces the viewer's side, the sill faces up.
      const hole = rect(1, y0, op.a, op.b, op.s, op.h);
      front.holes.push(hole);
      const clip = hull(hole.map(proj));
      faces.push({ pts: rect(0, op.b, y0, y1, op.s, op.h), holes: [], fill: "shade", line, inner: true, clip });
      if (op.s > z0 + 1e-6) faces.push({ pts: rect(2, op.s, op.a, op.b, y0, y1), holes: [], fill: "floor", line, inner: true, clip });
      if (op.glass) faces.push({ pts: rect(1, (y0 + y1) / 2, op.a, op.b, op.s, op.h), holes: [], fill: "glass", line: "fine", inner: true, clip });
    } else {
      const hole = rect(0, x0, op.a, op.b, op.s, op.h);
      side.holes.push(hole);
      const clip = hull(hole.map(proj));
      faces.push({ pts: rect(1, op.b, x0, x1, op.s, op.h), holes: [], fill: "lit", line, inner: true, clip });
      if (op.s > z0 + 1e-6) faces.push({ pts: rect(2, op.s, x0, x1, op.a, op.b), holes: [], fill: "floor", line, inner: true, clip });
      if (op.glass) faces.push({ pts: rect(0, (x0 + x1) / 2, op.a, op.b, op.s, op.h), holes: [], fill: "glass", line: "fine", inner: true, clip });
    }
  }
  if (show.front) faces.push(front);
  if (show.side) faces.push(side);
  if (show.top) faces.push({ pts: rect(2, z1, x0, x1, y0, y1), holes: [], fill: o.top ?? "floor", line, marks: o.topMarks, markLine: "fine" });
  return { min, max, faces };
}

/* ---- Painting a layer ---- */

/** The parts' outlines on the drawing, for the overlap tests. */
function outline(p: Prim): P2[] {
  const [x0, y0, z0] = p.min;
  const [x1, y1, z1] = p.max;
  const corners: V3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push([x, y, z]);
  return hull(corners.map(proj));
}

const depth = (p: V3) => (p[0] * SA + p[1] * CA) * CE - p[2] * SE;
const centre = (p: Prim): V3 => [(p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2];

/**
 * Which of two parts is painted first where they overlap on the drawing:
 * 1 if `a`, −1 if `b`, 0 if they do not overlap. Boxes that do not
 * intersect are separated along some axis, and the one on the far side of
 * it (farther along x or y, lower in z) is behind.
 */
function order(a: Prim, b: Prim, oa: P2[], ob: P2[]): number {
  if (!overlaps(oa, ob)) return 0;
  const e = 1e-6;
  const votes: number[] = [];
  if (a.min[0] >= b.max[0] - e) votes.push(1);
  if (b.min[0] >= a.max[0] - e) votes.push(-1);
  if (a.min[1] >= b.max[1] - e) votes.push(1);
  if (b.min[1] >= a.max[1] - e) votes.push(-1);
  if (a.max[2] <= b.min[2] + e) votes.push(1);
  if (b.max[2] <= a.min[2] + e) votes.push(-1);
  if (votes.length && votes.every((v) => v === votes[0])) return votes[0];
  return depth(centre(a)) >= depth(centre(b)) ? 1 : -1;
}

/** The parts in paint order, back to front: a topological sort of `order`, the farthest first among those free. */
function paintOrder(prims: Prim[]): Prim[] {
  const n = prims.length;
  const outlines = prims.map(outline);
  const after: number[][] = prims.map(() => []);
  const blockers = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const o = order(prims[i], prims[j], outlines[i], outlines[j]);
      if (o > 0) {
        after[i].push(j);
        blockers[j]++;
      } else if (o < 0) {
        after[j].push(i);
        blockers[i]++;
      }
    }
  const far = prims.map((p) => depth(centre(p)));
  const done: Prim[] = [];
  const used = new Array<boolean>(n).fill(false);
  while (done.length < n) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!used[i] && blockers[i] === 0 && (pick < 0 || far[i] > far[pick])) pick = i;
    // A cycle (none here, but a later edit could make one): break it at the farthest part left.
    if (pick < 0) for (let i = 0; i < n; i++) if (!used[i] && (pick < 0 || far[i] > far[pick])) pick = i;
    used[pick] = true;
    done.push(prims[pick]);
    for (const j of after[pick]) blockers[j]--;
  }
  return done;
}

/** A face's plane, as a key: faces in one plane with one fill are one surface. */
function planeKey(f: Face): string | null {
  for (const axis of [0, 1, 2] as const) {
    const v = f.pts[0][axis];
    if (f.pts.every((p) => Math.abs(p[axis] - v) < 1e-6)) return `${axis}:${v.toFixed(4)}:${f.fill}`;
  }
  return null;
}

type Edge3 = { a: V3; b: V3 };

function ringEdges(ring: V3[]): Edge3[] {
  return ring.map((a, i) => ({ a, b: ring[(i + 1) % ring.length] }));
}

/**
 * The edges of a layer's faces that are drawn: every edge of every face,
 * less the stretches two faces of one surface share (where a wall meets
 * the wall it runs into, or a floor its wall's face below).
 */
function drawnEdges(faces: Face[]): Map<Face, Edge3[]> {
  const out = new Map<Face, Edge3[]>();
  const groups = new Map<string, Face[]>();
  for (const f of faces) {
    out.set(f, [...ringEdges(f.pts), ...f.holes.flatMap(ringEdges)]);
    const k = planeKey(f);
    if (k && !f.inner) groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // Axis-aligned edges on one line, as intervals; a stretch two faces both have is a seam.
    const lineOf = (e: Edge3) => {
      const d = [0, 1, 2].findIndex((k) => Math.abs(e.a[k] - e.b[k]) > 1e-6);
      if (d < 0 || [0, 1, 2].some((k) => k !== d && Math.abs(e.a[k] - e.b[k]) > 1e-6)) return null;
      const key = `${d}:${[0, 1, 2].map((k) => (k === d ? "" : e.a[k].toFixed(4))).join(",")}`;
      return { key, d, lo: Math.min(e.a[d], e.b[d]), hi: Math.max(e.a[d], e.b[d]) };
    };
    const byLine = new Map<string, { f: Face; lo: number; hi: number }[]>();
    for (const f of group)
      for (const e of out.get(f)!) {
        const l = lineOf(e);
        if (l) byLine.set(l.key, [...(byLine.get(l.key) ?? []), { f, lo: l.lo, hi: l.hi }]);
      }
    for (const f of group) {
      const kept: Edge3[] = [];
      for (const e of out.get(f)!) {
        const l = lineOf(e);
        if (!l) {
          kept.push(e);
          continue;
        }
        const others = (byLine.get(l.key) ?? []).filter((o) => o.f !== f && o.hi > l.lo + 1e-6 && o.lo < l.hi - 1e-6).sort((p, q) => p.lo - q.lo);
        let at = l.lo;
        const pt = (t: number): V3 => {
          const p = [...e.a] as [number, number, number];
          p[l.d] = t;
          return p;
        };
        for (const o of others) {
          if (o.lo > at + 1e-6) kept.push({ a: pt(at), b: pt(Math.min(o.lo, l.hi)) });
          at = Math.max(at, o.hi);
        }
        if (at < l.hi - 1e-6) kept.push({ a: pt(at), b: pt(l.hi) });
      }
      out.set(f, kept);
    }
  }
  return out;
}

/* Path data in whole units (a centimetre of the house, well under a pixel at any size it is shown), written as tightly as SVG allows: a minus sign is its own separator. */
const xy = (x: number, y: number) => {
  const b = String(Math.round(y));
  return `${Math.round(x)}${b.startsWith("-") ? "" : " "}${b}`;
};
const pathD = (ring: P2[]) => `M${ring.map((p) => xy(p[0], p[1])).join("L")}Z`;
const segD = (s: Seg2) => `M${xy(s[0], s[1])}L${xy(s[2], s[3])}`;

/** A path to paint, in order: a fill of some material, or lines of some kind. */
export interface GuPath {
  kind: "fill" | "line";
  cls: GuFill | GuLine;
  d: string;
}

interface Painted {
  paths: GuPath[];
  draft: Seg2[];
  bounds: { x: number; y: number; w: number; h: number };
}

/**
 * A layer, painted: its stages in order (each stage's parts sorted back to
 * front, a stage of the ground painted between the foundation's parts
 * below grade and above), the parts that cannot hide one another taken
 * together, each group's reveals and glass first, clipped to their
 * openings, then its faces, each with its lines over its fills.
 */
function paint(stages: Prim[][]): Painted {
  const sorted = stages.flatMap((s) => paintOrder(s));
  const edges = drawnEdges(sorted.flatMap((p) => p.faces));
  const outlines = new Map(sorted.map((p) => [p, outline(p)]));
  // Greedy groups of consecutive parts, none overlapping another in its group.
  const groups: Prim[][] = [];
  for (const p of sorted) {
    const g = groups[groups.length - 1];
    if (g && g.every((q) => !overlaps(outlines.get(q)!, outlines.get(p)!))) g.push(p);
    else groups.push([p]);
  }
  const paths: GuPath[] = [];
  const emit = (faces: Face[]) => {
    const fills = new Map<GuFill, string>();
    const lines = new Map<GuLine, string>();
    for (const f of faces) {
      const d = [f.pts, ...f.holes].map((ring) => pathD(ring.map(proj))).join("");
      fills.set(f.fill, (fills.get(f.fill) ?? "") + d);
      for (const e of edges.get(f) ?? []) {
        const a = proj(e.a);
        const b = proj(e.b);
        const s = f.clip ? clipSeg(a, b, f.clip) : ([a[0], a[1], b[0], b[1]] as Seg2);
        if (s && Math.hypot(s[2] - s[0], s[3] - s[1]) > 0.3) lines.set(f.line, (lines.get(f.line) ?? "") + segD(s));
      }
      for (const [m0, m1] of f.marks ?? []) {
        const a = proj(m0);
        const b = proj(m1);
        const s = f.clip ? clipSeg(a, b, f.clip) : ([a[0], a[1], b[0], b[1]] as Seg2);
        const k = f.markLine ?? "fine";
        if (s) lines.set(k, (lines.get(k) ?? "") + segD(s));
      }
    }
    for (const fill of GU_FILLS) if (fills.has(fill)) paths.push({ kind: "fill", cls: fill, d: fills.get(fill)! });
    for (const l of GU_LINES) if (lines.has(l)) paths.push({ kind: "line", cls: l, d: lines.get(l)! });
  };
  for (const g of groups) {
    emit(g.flatMap((p) => p.faces.filter((f) => f.inner)));
    emit(g.flatMap((p) => p.faces.filter((f) => !f.inner)));
  }
  // Merge neighbouring paths of one class (possible where nothing between them was painted).
  const merged: GuPath[] = [];
  for (const p of paths) {
    const last = merged[merged.length - 1];
    if (last && last.kind === p.kind && last.cls === p.cls) last.d += p.d;
    else merged.push({ ...p });
  }

  // The draft: every edge of every face (the hidden ones too, as on a drafting board), once, from the ground up.
  const seen = new Set<string>();
  const draft: { s: Seg2; z: number; far: number }[] = [];
  for (const p of sorted)
    for (const f of p.faces) {
      if (f.fill === "glass") continue;
      for (const e of [...ringEdges(f.pts), ...f.holes.flatMap(ringEdges)]) {
        const a = proj(e.a);
        const b = proj(e.b);
        const k = [a, b]
          .map((q) => `${r1(q[0])},${r1(q[1])}`)
          .sort()
          .join("|");
        if (seen.has(k) || Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) continue;
        seen.add(k);
        draft.push({ s: [a[0], a[1], b[0], b[1]], z: Math.min(e.a[2], e.b[2]), far: depth([(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, (e.a[2] + e.b[2]) / 2]) });
      }
    }
  draft.sort((p, q) => p.z - q.z || q.far - p.far);

  // Bounds of everything painted.
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of sorted)
    for (const q of outlines.get(p)!) {
      x0 = Math.min(x0, q[0]);
      y0 = Math.min(y0, q[1]);
      x1 = Math.max(x1, q[0]);
      y1 = Math.max(y1, q[1]);
    }
  return { paths: merged, draft: draft.map((d) => d.s.map(Math.round) as unknown as Seg2), bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
}

/* ---- The house ---- */

/** The footprint: 7.2 m across the front, 11.4 m deep; walls 0.3 m thick. */
const W = 7.2;
const D = 11.4;
const T = 0.3;

/** Levels (m above grade). */
const FOOTING = -2.45;
const BASEMENT = -2.2;
const SILL = 0.3;
const JOIST = 0.24;
const GROUND = SILL + JOIST;
const PLATE = 0.04;
const STOREY = 2.7;
const UPPER = GROUND + PLATE + STOREY;
const SLAB2 = 0.26;
const EAVE = UPPER + SLAB2 + STOREY;
const PITCH = (40 * Math.PI) / 180;
const RIDGE = EAVE + (W / 2) * Math.tan(PITCH);

/** The ground around the house: how far it runs out and how deep it is cut. */
const SITE = 1.5;
const SITE_DEPTH = 2.75;

function exteriorWalls(z0: number, z1: number, open: { s: Opening[]; n: Opening[]; w: Opening[]; e: Opening[] }, opts: BoxOptions = {}): Prim[] {
  const lift = (ops: Opening[]) => ops.map((o) => ({ ...o, s: z0 + o.s, h: z0 + o.h }));
  return [
    box([0, 0, z0], [W, T, z1], { ...opts, top: "cut", openings: lift(open.s) }),
    box([0, D - T, z0], [W, D, z1], { ...opts, top: "cut", openings: lift(open.n) }),
    box([0, T, z0], [T, D - T, z1], { ...opts, top: "cut", openings: lift(open.w) }),
    box([W - T, T, z0], [W, D - T, z1], { ...opts, top: "cut", openings: lift(open.e) }),
  ];
}

/** An interior wall 0.1 m thick along x (at y) or along y (at x), its doors 0.85 m wide and 2.1 m high. */
function partition(along: "x" | "y", at: number, from: number, to: number, z0: number, h: number, doors: number[] = []): Prim {
  const t = 0.1;
  const ops = doors.map((a) => ({ a, b: a + 0.85, s: z0, h: z0 + 2.1 }));
  return along === "x" ? box([from, at, z0], [to, at + t, z0 + h], { top: "cut", openings: ops }) : box([at, from, z0], [at + t, to, z0 + h], { top: "cut", openings: ops });
}

/** Layer 1: the ground, cut around the house, and the foundation in it (footings, walls, slab, posts). */
function foundationLayer(): Prim[][] {
  const below: Prim[] = [];
  const above: Prim[] = [];
  // Footings under the walls (buried: the draft shows them, the ground hides them).
  const f = 0.15;
  below.push(box([-f, -f, FOOTING], [W + f, T + f, BASEMENT]));
  below.push(box([-f, D - T - f, FOOTING], [W + f, D + f, BASEMENT]));
  below.push(box([-f, T + f, FOOTING], [T + f, D - T - f, BASEMENT]));
  below.push(box([W - T - f, T + f, FOOTING], [W + f, D - T - f, BASEMENT]));
  // The walls, below grade and above it.
  for (const [z0, z1, into] of [
    [BASEMENT, 0, below],
    [0, SILL, above],
  ] as const) {
    into.push(box([0, 0, z0], [W, T, z1], { top: "cut" }));
    into.push(box([0, D - T, z0], [W, D, z1], { top: "cut" }));
    into.push(box([0, T, z0], [T, D - T, z1], { top: "cut" }));
    into.push(box([W - T, T, z0], [W, D - T, z1], { top: "cut" }));
  }
  // The basement slab, and the posts under the beam on their pads.
  below.push(box([T, T, BASEMENT], [W - T, D - T, BASEMENT + 0.1]));
  for (const y of [D / 3, (2 * D) / 3]) {
    below.push(box([W / 2 - 0.3, y - 0.3, BASEMENT + 0.1], [W / 2 + 0.3, y + 0.3, BASEMENT + 0.16]));
    below.push(box([W / 2 - 0.07, y - 0.07, BASEMENT + 0.16], [W / 2 + 0.07, y + 0.07, SILL - 0.24], { front: "steel", side: "steel", top: "steel", line: "steel" }));
  }
  // The ground: its top cut round the house, and its two cut faces, hatched.
  const g0 = -SITE;
  const gx = W + SITE;
  const gy = D + SITE;
  const hatch = (axis: 0 | 1, at: number, len: number): [V3, V3][] => {
    const marks: [V3, V3][] = [];
    const step = 0.42;
    for (let k = step; k < len + SITE_DEPTH; k += step) {
      // Lines at 45° in the face, clipped to it: from (u, 0) down to (u − depth, −depth), within u ∈ [0, len].
      const u0 = Math.min(k, len);
      const z0 = -(k - u0);
      const z1 = -Math.min(k, SITE_DEPTH);
      const u1 = k + z1;
      if (z0 <= -SITE_DEPTH || u1 < 0) continue;
      const at3 = (u: number, z: number): V3 => (axis === 1 ? [g0 + u, at, z] : [at, g0 + u, z]);
      marks.push([at3(u0, z0), at3(u1, z1)]);
    }
    return marks;
  };
  const ground: Prim = {
    min: [g0, g0, -SITE_DEPTH],
    max: [gx, gy, 0],
    faces: [
      { pts: rect(2, 0, g0, gx, g0, gy), holes: [rect(2, 0, 0, W, 0, D)], fill: "ground", line: "edge" },
      { pts: rect(1, g0, g0, gx, -SITE_DEPTH, 0), holes: [], fill: "earth", line: "edge", marks: hatch(1, g0, gx - g0), markLine: "hatch" },
      { pts: rect(0, g0, g0, gy, -SITE_DEPTH, 0), holes: [], fill: "earth", line: "edge", marks: hatch(0, g0, gy - g0), markLine: "hatch" },
    ],
  };
  return [below, [ground], above];
}

/** Layer 2: the ground floor's framing: rim joists, joists and the steel beam under them. */
function framingLayer(): Prim[][] {
  const parts: Prim[] = [];
  const timber: BoxOptions = { front: "timber", side: "timber", top: "timber", line: "edge" };
  parts.push(box([0, 0, SILL], [0.05, D, GROUND], timber));
  parts.push(box([W - 0.05, 0, SILL], [W, D, GROUND], timber));
  const n = 20;
  for (let k = 0; k < n; k++) {
    const y = (k * (D - 0.05)) / (n - 1);
    parts.push(box([0.05, y, SILL], [W - 0.05, y + 0.05, GROUND], timber));
  }
  parts.push(box([W / 2 - 0.1, T, SILL - 0.24], [W / 2 + 0.1, D - T, SILL], { front: "steel", side: "steel", top: "steel", line: "steel" }));
  return [parts];
}

/** Layer 3: the ground floor: its floor, walls, rooms, stair and kitchen. */
function groundLayer(): Prim[][] {
  const z0 = GROUND + PLATE;
  const z1 = z0 + STOREY;
  const parts: Prim[] = [box([0, 0, GROUND], [W, D, z0])];
  parts.push(
    ...exteriorWalls(z0, z1, {
      s: [
        { a: 0.9, b: 1.95, s: 0, h: 2.4 },
        { a: 3.0, b: 6.3, s: 0.45, h: 2.4, glass: true },
      ],
      n: [
        { a: 0.7, b: 1.9, s: 1.05, h: 2.1, glass: true },
        { a: 2.6, b: 5.6, s: 0, h: 2.4, glass: true },
      ],
      w: [
        { a: 1.2, b: 3.3, s: 0.6, h: 2.4, glass: true },
        { a: 6.6, b: 9.0, s: 0.6, h: 2.4, glass: true },
      ],
      e: [{ a: 9.0, b: 10.2, s: 1.05, h: 2.1, glass: true }],
    }),
  );
  // A powder room off the hall.
  parts.push(partition("x", 4.2, T, 1.8, z0, STOREY));
  parts.push(partition("x", 5.9, T, 1.8, z0, STOREY));
  parts.push(partition("y", 1.8, 4.2, 6.0, z0, STOREY, [4.6]));
  // The stair along the east wall, rising to the second floor.
  const risers = 15;
  const rise = (UPPER + SLAB2 - z0) / risers;
  for (let k = 0; k < risers - 1; k++) {
    const y = 3.6 + k * 0.25;
    parts.push(box([6.0, y, z0], [W - T, y + 0.25, z0 + (k + 1) * rise]));
  }
  // The kitchen: an island and the counter along the back of the east wall.
  parts.push(box([2.7, 8.1, z0], [4.8, 9.0, z0 + 0.9]));
  parts.push(box([6.3, 7.8, z0], [W - T, D - T, z0 + 0.9]));
  return [parts];
}

/** Layer 4: the second floor: its floor (open over the stair), walls and rooms. */
function upperLayer(): Prim[][] {
  const z0 = UPPER + SLAB2;
  const z1 = EAVE;
  // The floor, in four pieces round the stair's opening (x 6.0–6.9, y 3.6–7.1).
  const parts: Prim[] = [
    box([0, 0, UPPER], [W, 3.6, z0]),
    box([0, 7.1, UPPER], [W, D, z0]),
    box([0, 3.6, UPPER], [6.0, 7.1, z0]),
    box([W - T, 3.6, UPPER], [W, 7.1, z0]),
  ];
  parts.push(
    ...exteriorWalls(z0, z1, {
      s: [
        { a: 1.2, b: 2.7, s: 0.9, h: 2.4, glass: true },
        { a: 4.5, b: 6.0, s: 0.9, h: 2.4, glass: true },
      ],
      n: [
        { a: 1.2, b: 2.4, s: 0.9, h: 2.1, glass: true },
        { a: 4.8, b: 6.0, s: 0.9, h: 2.1, glass: true },
      ],
      w: [
        { a: 1.2, b: 2.4, s: 0.9, h: 2.1, glass: true },
        { a: 5.0, b: 5.9, s: 1.5, h: 2.1, glass: true },
        { a: 9.0, b: 10.2, s: 0.9, h: 2.1, glass: true },
      ],
      e: [{ a: 9.0, b: 10.2, s: 0.9, h: 2.1, glass: true }],
    }),
  );
  parts.push(partition("x", 3.5, T, W - T, z0, STOREY, [3.6]));
  parts.push(partition("y", 3.0, 3.6, 8.1, z0, STOREY, [5.6]));
  parts.push(partition("x", 8.1, T, W - T, z0, STOREY, [3.3, 4.9]));
  parts.push(partition("y", 3.55, 8.2, D - T, z0, STOREY));
  // The guard along the stair's opening.
  parts.push(box([5.9, 3.6, z0], [6.0, 7.1, z0 + 0.95], { top: "cut" }));
  return [parts];
}

/** Layer 5: the roof: two planes on the gable walls, seamed, and the front gable's window. */
function roofLayer(): Prim[][] {
  const t = 0.3;
  const up = t / Math.cos(PITCH);
  const xm = W / 2;
  const faces: Face[] = [];
  // The front gable wall under the roof, with its window.
  const win: Opening = { a: 3.0, b: 4.2, s: EAVE + 0.5, h: EAVE + 2.2 };
  const hole = rect(1, 0, win.a, win.b, win.s, win.h);
  const clip = hull(hole.map(proj));
  faces.push({ pts: rect(0, win.b, 0, T, win.s, win.h), holes: [], fill: "shade", line: "edge", inner: true, clip });
  faces.push({ pts: rect(2, win.s, win.a, win.b, 0, T), holes: [], fill: "floor", line: "edge", inner: true, clip });
  faces.push({ pts: rect(1, T / 2, win.a, win.b, win.s, win.h), holes: [], fill: "glass", line: "fine", inner: true, clip });
  faces.push({
    pts: [
      [0, 0, EAVE],
      [W, 0, EAVE],
      [xm, 0, RIDGE],
    ],
    holes: [hole],
    fill: "lit",
    line: "edge",
  });
  // The two planes: their top faces, seamed, and their ends on the front.
  const seams = (x0: number, z0: number, x1: number, z1: number): [V3, V3][] => {
    const out: [V3, V3][] = [];
    for (let y = 0.45; y < D - 0.2; y += 0.45) out.push([[x0, y, z0], [x1, y, z1]]);
    return out;
  };
  // Planes from eave to ridge, raised by the roof's depth.
  faces.push({
    pts: [
      [xm, 0, RIDGE + up],
      [W, 0, EAVE + up],
      [W, D, EAVE + up],
      [xm, D, RIDGE + up],
    ],
    holes: [],
    fill: "roof",
    line: "edge",
    marks: seams(xm, RIDGE + up, W, EAVE + up),
  });
  faces.push({
    pts: [
      [0, 0, EAVE + up],
      [xm, 0, RIDGE + up],
      [xm, D, RIDGE + up],
      [0, D, EAVE + up],
    ],
    holes: [],
    fill: "roof",
    line: "edge",
    marks: seams(0, EAVE + up, xm, RIDGE + up),
  });
  // The roof's depth on the front (a chevron) and along the west eave.
  faces.push({
    pts: [
      [0, 0, EAVE],
      [xm, 0, RIDGE],
      [W, 0, EAVE],
      [W, 0, EAVE + up],
      [xm, 0, RIDGE + up],
      [0, 0, EAVE + up],
    ],
    holes: [],
    fill: "lit",
    line: "edge",
  });
  faces.push({ pts: rect(0, 0, 0, D, EAVE, EAVE + up), holes: [], fill: "shade", line: "edge" });
  return [[{ min: [0, 0, EAVE], max: [W, D, RIDGE + up], faces }]];
}

export interface GuLayer {
  id: "foundation" | "framing" | "ground" | "upper" | "roof";
  /** Its name, on its tag beside the drawing. */
  name: string;
  /** Paths in paint order. */
  paths: GuPath[];
  /** The draft: every edge as one path, from the ground up. */
  draft: string;
  /** How many lines the draft has. */
  draftLines: number;
  /** Bounds on the drawing with the house assembled, in drawing units. */
  box: { x: number; y: number; w: number; h: number };
  /** How far the layer is lifted in the exploded drawing, in drawing units (up). */
  lift: number;
  /** Where its tag's leader meets it (on its west side), with the house assembled, in drawing units. */
  tag: { x: number; y: number };
}

/** The gap between layers in the exploded drawing, in metres. */
export const GU_GAP = 4.6;

/** The layers, bottom first; each tag points at the layer's west side, part way back, at this height. */
const LAYERS = [
  { id: "foundation", name: "Foundation", build: foundationLayer, tagZ: SILL },
  { id: "framing", name: "Floor framing", build: framingLayer, tagZ: (SILL + GROUND) / 2 },
  { id: "ground", name: "Ground floor", build: groundLayer, tagZ: GROUND + PLATE + STOREY / 2 },
  { id: "upper", name: "Second floor", build: upperLayer, tagZ: UPPER + SLAB2 + STOREY / 2 },
  { id: "roof", name: "Roof", build: roofLayer, tagZ: EAVE + 0.2 },
] as const;

export const guLayers: GuLayer[] = LAYERS.map((l, i) => {
  const p = paint(l.build());
  const pad = 4;
  return {
    id: l.id,
    name: l.name,
    paths: p.paths,
    draft: p.draft.map(segD).join(""),
    draftLines: p.draft.length,
    box: { x: r1(p.bounds.x - pad), y: r1(p.bounds.y - pad), w: r1(p.bounds.w + 2 * pad), h: r1(p.bounds.h + 2 * pad) },
    lift: r1(i * GU_GAP * GU_RISE),
    tag: (([x, y]) => ({ x: r1(x), y: r1(y) }))(proj([0, D * 0.4, l.tagZ])),
  };
});

/** The whole drawing's bounds, exploded (the still layout's) and assembled, in drawing units. */
function union(lift: (l: GuLayer) => number) {
  const x0 = Math.min(...guLayers.map((l) => l.box.x));
  const x1 = Math.max(...guLayers.map((l) => l.box.x + l.box.w));
  const y0 = Math.min(...guLayers.map((l) => l.box.y - lift(l)));
  const y1 = Math.max(...guLayers.map((l) => l.box.y - lift(l) + l.box.h));
  return { x: x0, y: y0, w: r1(x1 - x0), h: r1(y1 - y0) };
}
export const GU_EXPLODED = union((l) => l.lift);
export const GU_ASSEMBLED = union(() => 0);
