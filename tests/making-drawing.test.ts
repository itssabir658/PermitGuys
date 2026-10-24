import { describe, expect, it } from "vitest";
import { MK_H, MK_W, mkElevation, mkPlan, mkSite, mkStructure } from "@/content/making-drawing";

/** Every number in a path. */
const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const drawn = {
  ...Object.fromEntries(Object.entries(mkSite).filter(([k]) => k !== "labels" && k !== "house").map(([k, v]) => [`site.${k}`, v as string])),
  ...Object.fromEntries(Object.entries(mkPlan).filter(([k]) => !["labels", "poche", "cuts"].includes(k)).map(([k, v]) => [`plan.${k}`, v as string])),
  ...Object.fromEntries(Object.entries(mkElevation).map(([k, v]) => [`elevation.${k}`, v as string])),
  ...Object.fromEntries(Object.entries(mkStructure).filter(([k]) => k !== "labels").map(([k, v]) => [`structure.${k}`, v as string])),
};

describe("the making-of drawings", () => {
  it("every drafted path is straight lines, one move and one line each, in whole units, on the board", () => {
    for (const [name, d] of Object.entries(drawn)) {
      expect(d.length, name).toBeGreaterThan(0);
      expect(d, name).toMatch(/^(M-?\d+ -?\d+L-?\d+ -?\d+)+$/);
      const n = numbers(d);
      expect(n.length % 4, name).toBe(0);
      for (let i = 0; i < n.length; i += 2) {
        expect(n[i], name).toBeGreaterThanOrEqual(-40);
        expect(n[i], name).toBeLessThanOrEqual(MK_W + 40);
        expect(n[i + 1], name).toBeGreaterThanOrEqual(-40);
        expect(n[i + 1], name).toBeLessThanOrEqual(MK_H + 40);
      }
    }
  });

  it("labels sit on the board and say nothing about where the house is", () => {
    for (const l of [...mkSite.labels, ...mkPlan.labels, ...mkStructure.labels]) {
      expect(l.x).toBeGreaterThan(0);
      expect(l.x).toBeLessThan(MK_W);
      expect(l.y).toBeGreaterThan(0);
      expect(l.y).toBeLessThan(MK_H);
      expect(l.text).not.toMatch(/\d{2,}|road\b|avenue|forest/i);
    }
  });

  it("the drawings stay light enough to draft every frame", () => {
    const segs = Object.values(drawn).reduce((s, d) => s + numbers(d).length / 4, 0);
    expect(segs).toBeLessThan(2500);
  });
});
