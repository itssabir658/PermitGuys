/*
 * Small numeric helpers for scroll-scrubbed motion, after the Studio Foundry
 * motion spec (docs/MOTION.md, "Scroll engine"). Pure functions only, so the
 * homepage choreography can be unit tested without a browser.
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

export function toHex(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

/** Frame-rate independent exponential smoothing: closes 1 − e^(−λ·dt) of the gap each frame. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** The GSAP eases the reference uses, as plain functions of 0–1. No overshoot anywhere. */
export const ease = {
  linear: (t: number) => t,
  power1Out: (t: number) => 1 - (1 - t) ** 2,
  power2Out: (t: number) => 1 - (1 - t) ** 3,
  power3Out: (t: number) => 1 - (1 - t) ** 4,
  power1In: (t: number) => t * t,
  power2In: (t: number) => t ** 3,
  power1InOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  power2InOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
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
};
