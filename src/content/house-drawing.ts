/*
 * The loader's drawing (Preloader.tsx, ScreenTransition.tsx): the front
 * elevation of a house, drawn the way a drafter draws one. Faint
 * construction lines first, run long past the corners; then the walls rise
 * from the ground line, the two pitches of the roof meet at the ridge, the
 * windows go in, and the front door is drawn in the brand red. On a full
 * load that door then opens, and the screen goes in through it.
 *
 * Units are the SVG's own (HOUSE_WIDTH by HOUSE_HEIGHT), y down, with the
 * ground line at HOUSE_GROUND.
 */

export const HOUSE_WIDTH = 320;
export const HOUSE_HEIGHT = 200;
export const HOUSE_GROUND = 180;

/** The front door's opening: x, y, width, height. The screen zooms in through it. */
export const HOUSE_DOOR = [147, 128, 26, 52] as const;

export type HouseStrokeKind = "guide" | "ink" | "door" | "dimension";

export interface HouseStroke {
  kind: HouseStrokeKind;
  d: string;
  /** Delay from the start of the drawing, ms. */
  at: number;
  /** Duration, ms. */
  ms: number;
}

const RIDGE: [number, number] = [160, 40];
const EAVE_L: [number, number] = [78, 110];
const EAVE_R: [number, number] = [242, 110];
const WALL_L = 92;
const WALL_R = 228;
/** Where each wall meets the underside of the roof. */
const wallTop = (x: number) => {
  const [ex, ey] = x < RIDGE[0] ? EAVE_L : EAVE_R;
  return ey + ((RIDGE[1] - ey) * (x - ex)) / (RIDGE[0] - ex);
};
const n = (v: number) => Number(v.toFixed(2));
/** A rectangle as one open run back to its start (a closing Z, or a second subpath, leaves a gap in a pathLength dash). */
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}V${y}`;
const [DX, DY, DW] = HOUSE_DOOR;

export const HOUSE_STROKES: HouseStroke[] = [
  // Construction lines, long and faint: the eave and ridge levels, the two walls.
  { kind: "guide", d: `M20 ${EAVE_L[1]}H300`, at: 100, ms: 700 },
  { kind: "guide", d: `M40 ${RIDGE[1]}H280`, at: 160, ms: 700 },
  { kind: "guide", d: `M${WALL_L} 196V24`, at: 220, ms: 650 },
  { kind: "guide", d: `M${WALL_R} 196V24`, at: 270, ms: 650 },
  { kind: "guide", d: `M${RIDGE[0]} 192V16`, at: 320, ms: 650 },
  // The walls rise from the ground.
  { kind: "ink", d: `M${WALL_L} ${HOUSE_GROUND}V${n(wallTop(WALL_L))}`, at: 420, ms: 480 },
  { kind: "ink", d: `M${WALL_R} ${HOUSE_GROUND}V${n(wallTop(WALL_R))}`, at: 420, ms: 480 },
  // The two pitches run up from the eaves and meet at the ridge.
  { kind: "ink", d: `M${EAVE_L[0]} ${EAVE_L[1]}L${RIDGE[0]} ${RIDGE[1]}`, at: 760, ms: 520 },
  { kind: "ink", d: `M${EAVE_R[0]} ${EAVE_R[1]}L${RIDGE[0]} ${RIDGE[1]}`, at: 760, ms: 520 },
  // The windows, each with its mullion, and the window in the gable.
  { kind: "ink", d: rect(106, 120, 28, 30), at: 1060, ms: 420 },
  { kind: "ink", d: rect(186, 120, 28, 30), at: 1120, ms: 420 },
  { kind: "ink", d: "M120 120V150", at: 1160, ms: 260 },
  { kind: "ink", d: "M200 120V150", at: 1200, ms: 260 },
  { kind: "ink", d: rect(152, 68, 16, 16), at: 1180, ms: 360 },
  // The front door, in red: up one jamb, across the head, down the other.
  { kind: "door", d: `M${DX} ${HOUSE_GROUND}V${DY}H${DX + DW}V${HOUSE_GROUND}`, at: 1240, ms: 520 },
  // The overall width, dimensioned above the house with its extension lines and ticks.
  { kind: "dimension", d: `M${WALL_L} 30V20M${WALL_R} 30V20M${WALL_L - 6} 24H${WALL_R + 6}M${WALL_L - 3} 27L${WALL_L + 3} 21M${WALL_R - 3} 27L${WALL_R + 3} 21`, at: 1300, ms: 500 },
];
