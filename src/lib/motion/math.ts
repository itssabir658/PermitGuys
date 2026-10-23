/*
 * Small numeric helpers for scroll-scrubbed motion (the vocabulary is at the
 * top of src/lib/motion/home.ts). Pure functions only, so the homepage
 * choreography can be unit tested without a browser.
 */

export const PI2 = Math.PI * 2;

export function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

/** Remap `v` from [inMin, inMax] to [outMin, outMax], clamped to the output range. */
export function fit(v: number, inMin: number, inMax: number, outMin = 0, outMax = 1): number {
  if (inMax === inMin) return v < inMin ? outMin : outMax;
  return outMin + (outMax - outMin) * clamp((v - inMin) / (inMax - inMin));
}

/** As `fit`, without clamping. */
export function unClampedFit(v: number, inMin: number, inMax: number, outMin = 0, outMax = 1): number {
  if (inMax === inMin) return v < inMin ? outMin : outMax;
  return outMin + ((outMax - outMin) * (v - inMin)) / (inMax - inMin);
}

/** Classic 3t² − 2t³ between two edges. */
export function smoothstep(v: number, edge0: number, edge1: number): number {
  if (edge1 === edge0) return v < edge0 ? 0 : 1;
  const t = clamp((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Blend two 0xRRGGBB colours channel by channel. */
export function mixColorNum(a: number, b: number, t: number): number {
  const r = Math.round(mix((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(mix((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(mix(a & 255, b & 255, t));
  return (r << 16) | (g << 8) | bl;
}

type Lab = readonly [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Converted colours, so the page ground does not reconvert its constant ends every frame. */
const labCache = new Map<number, Lab>();

/** A 0xRRGGBB colour in OKLab (Björn Ottosson's matrices). */
export function toOklab(color: number): Lab {
  const cached = labCache.get(color);
  if (cached) return cached;
  const r = toLinear(((color >> 16) & 255) / 255);
  const g = toLinear(((color >> 8) & 255) / 255);
  const b = toLinear((color & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lab: Lab = [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  if (labCache.size > 64) labCache.clear();
  labCache.set(color, lab);
  return lab;
}

/** An OKLab colour back to 0xRRGGBB, clamped to the sRGB gamut. */
export function fromOklab([L, A, B]: Lab): number {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const channel = (c: number) => Math.round(clamp(toGamma(clamp(c))) * 255);
  const r = channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return (r << 16) | (g << 8) | b;
}

/** Blend two 0xRRGGBB colours in OKLab, so the midpoint keeps its warmth and lightness steps evenly. */
export function mixColorOklab(a: number, b: number, t: number): number {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const x = toOklab(a);
  const y = toOklab(b);
  return fromOklab([mix(x[0], y[0], t), mix(x[1], y[1], t), mix(x[2], y[2], t)]);
}

export function toHex(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

/** Frame-rate independent exponential smoothing: closes 1 − e^(−λ·dt) of the gap each frame. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Power eases as plain functions of 0–1: out on entrances, in on exits, in-out on scrubbed wipes. No overshoot anywhere. */
export const ease = {
  linear: (t: number) => t,
  power1Out: (t: number) => 1 - (1 - t) ** 2,
  power2Out: (t: number) => 1 - (1 - t) ** 3,
  power3Out: (t: number) => 1 - (1 - t) ** 4,
  power1In: (t: number) => t * t,
  power2In: (t: number) => t ** 3,
  power1InOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  power2InOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  power3InOut: (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
};

/** Progress of a tween that starts at `start` and lasts `duration`, on a timeline at `time`. */
export function tween(time: number, start: number, duration: number, easing: (t: number) => number = ease.linear): number {
  return easing(clamp((time - start) / duration));
}

/** CSS equivalents of the eases, for WAAPI and transitions. */
export const cssEase = {
  power1Out: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  power2Out: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  power3Out: "cubic-bezier(0.22, 1, 0.36, 1)",
  power1InOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  power2InOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  in: "cubic-bezier(0.55, 0.09, 0.68, 0.53)",
  ui: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Exits (power2.in), as --e-exit. */
  exit: "cubic-bezier(0.32, 0, 0.67, 0)",
  /** Full-surface sheets, as --e-sheet. */
  sheet: "cubic-bezier(0.76, 0, 0.24, 1)",
};
