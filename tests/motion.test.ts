import { describe, expect, it } from "vitest";
import {
  CREAM,
  NIGHT,
  ORBIT,
  contactReveal,
  heroState,
  introLine,
  introPhases,
  introProgress,
  orbitItem,
  pageGround,
  servicesReveal,
  servicesW,
  valuesText,
  worksButtonLive,
  worksElement,
  worksImageScale,
  worksT,
} from "@/lib/motion/home";
import { clamp, damp, ease, fit, mixColorNum, smoothstep, toHex, tween } from "@/lib/motion/math";

/* Numeric parity with the motion spec (docs/MOTION.md), measured at 1440×900. */
const VW = 1440;
const VH = 900;

describe("motion maths", () => {
  it("fits and clamps", () => {
    expect(fit(5, 0, 10)).toBe(0.5);
    expect(fit(-5, 0, 10)).toBe(0);
    expect(fit(15, 0, 10, 100, 200)).toBe(200);
    expect(fit(1, 2, 2)).toBe(0);
    expect(clamp(2)).toBe(1);
  });

  it("smoothsteps without dividing by zero", () => {
    expect(smoothstep(0.5, 0, 1)).toBe(0.5);
    expect(smoothstep(-1, 0, 1)).toBe(0);
    expect(smoothstep(3, 2, 2)).toBe(1);
  });

  it("eases start at 0, end at 1 and never overshoot", () => {
    for (const fn of Object.values(ease)) {
      expect(fn(0)).toBeCloseTo(0);
      expect(fn(1)).toBeCloseTo(1);
      for (let t = 0; t <= 1; t += 0.05) {
        expect(fn(t)).toBeGreaterThanOrEqual(-1e-9);
        expect(fn(t)).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
    expect(tween(0.5, 0, 1)).toBe(0.5);
    expect(tween(-1, 0, 1)).toBe(0);
  });

  it("damps frame-rate independently, settling ~95% in 250ms at λ 12", () => {
    let at60 = 0;
    for (let i = 0; i < 15; i++) at60 = damp(at60, 1, 12, 1 / 60);
    let at120 = 0;
    for (let i = 0; i < 30; i++) at120 = damp(at120, 1, 12, 1 / 120);
    expect(at60).toBeCloseTo(at120, 6);
    expect(at60).toBeGreaterThan(0.94);
    expect(at60).toBeLessThan(0.96);
  });

  it("mixes colours channel by channel", () => {
    expect(toHex(mixColorNum(0x000000, 0xffffff, 0.5))).toBe("#808080");
    expect(toHex(mixColorNum(0x123456, 0xabcdef, 0))).toBe("#123456");
  });
});

describe("homepage choreography", () => {
  it("hero heading is gone exactly at the end of its 200vh track, displaced half a screen", () => {
    const start = heroState(450, 0, 2 * VH, VH);
    expect(start.opacity).toBe(1);
    expect(start.headingY).toBeCloseTo(0);
    const end = heroState(1800, 0, 2 * VH, VH);
    expect(end.opacity).toBe(0);
    expect(end.headingY).toBe(-450);
    expect(end.subY).toBe(450);
  });

  it("intro track follows from the number of paragraphs", () => {
    const two = introPhases(2);
    expect(two.copyIn).toEqual([1, 3]);
    expect(two.sectionVh).toBe(600);
    expect(introPhases(3).sectionVh).toBe(800);
  });

  it("intro progress runs 0 to 5 over a 600vh track, exiting over the last screen", () => {
    expect(introProgress(0.5, 6).e).toBe(0);
    expect(introProgress(7, 6).e).toBe(5);
    expect(introProgress(5, 6).exit).toBe(0);
    expect(introProgress(6, 6).exit).toBe(1);
  });

  it("orbit turns 0.6 times across the section and is flung out to 3× its radius", () => {
    const slot = 1;
    const turnsAt = (e: number) => {
      const p = orbitItem(slot, e, 0, VW, VH);
      return (Math.atan2(p.y, p.x) / (2 * Math.PI) + 1) % 1;
    };
    // Slot 1 starts at 1.25 rad and turns 0.12 × 5 = 0.6 base turns, scaled by its speed (1.1), compared modulo a whole turn.
    const start = 1.25 / (2 * Math.PI);
    expect(turnsAt(5)).toBeCloseTo((start + ORBIT.turns * 5 * 1.1) % 1, 6);

    const settled = orbitItem(slot, 4, 0, VW, VH);
    const flung = orbitItem(slot, 4, 1, VW, VH);
    expect(Math.hypot(flung.x, flung.y) / Math.hypot(settled.x, settled.y)).toBeCloseTo(3);
  });

  it("orbit radius is bound by the shorter side, so it fits a portrait phone", () => {
    const p = orbitItem(2, 3, 0, 390, 844);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0.68 * 390 * 0.92);
  });

  it("intro lines rise in and carry on up", () => {
    expect(introLine(0, 1, 0).yPercent).toBe(120);
    expect(introLine(1, 1, 0)).toEqual({ yPercent: 0, opacity: 1 });
    expect(introLine(2, 1, 0).yPercent).toBe(-120);
    expect(introLine(2, 1, 0).opacity).toBe(0);
  });

  it("works title peaks exactly when its panel's showScreenOffset is 1.25", () => {
    expect(worksT(1.25)).toBe(0);
    expect(worksElement(worksT(1.25), 0, 60).opacity).toBe(1);
    // The falloff is symmetric about the peak.
    for (const d of [0.2, 0.4, 0.5, 0.6, 0.9]) {
      expect(worksElement(worksT(1.25 - d), 0, 60).opacity).toBeCloseTo(worksElement(worksT(1.25 + d), 0, 60).opacity);
    }
    expect(worksElement(0.8, 0, 60).opacity).toBe(0);
  });

  it("works elements arrive downward and leave upward, deeper ones in tighter windows", () => {
    expect(worksElement(-0.5, 0, 60).y).toBeGreaterThan(0);
    expect(worksElement(0.5, 0, 60).y).toBeLessThan(0);
    expect(worksElement(0.5, 2, 40).opacity).toBe(0);
    expect(worksElement(0.5, 0, 60).opacity).toBeGreaterThan(0);
    expect(worksImageScale(0)).toBe(1);
    expect(worksImageScale(1)).toBe(0.5);
    expect(worksButtonLive(0.1)).toBe(true);
    expect(worksButtonLive(0.2)).toBe(false);
  });

  it("values title enters over 0.2 of a screen and leaves by 0.4", () => {
    expect(valuesText(-0.2).titleOpacity).toBe(0);
    expect(valuesText(0).titleOpacity).toBe(1);
    expect(valuesText(0.4).titleOpacity).toBe(0);
    expect(valuesText(0.4).descY).toBe(-160);
  });

  it("page ground is cream before the buffer, night at its top, cream again past services", () => {
    expect(pageGround(0, -2).color).toBe(CREAM);
    expect(pageGround(1, -2).color).toBe(NIGHT);
    expect(pageGround(3, -0.5).color).toBe(CREAM);
  });

  it("services frame wipes up and settles from a zoom; items stagger 0.04 of a screen", () => {
    expect(servicesReveal(0)).toEqual({ r: 0, inset: 100, scale: 1.15 });
    expect(servicesReveal(1)).toEqual({ r: 1, inset: 0, scale: 1 });
    expect(servicesW(0.24, 1)).toBe(0);
    expect(servicesW(0.84, 1)).toBe(1);
  });

  it("contact pieces rise 28px and fade in between 0.08 and 0.42", () => {
    expect(contactReveal(0.08)).toEqual({ opacity: 0, y: 28 });
    expect(contactReveal(0.42)).toEqual({ opacity: 1, y: 0 });
  });
});
