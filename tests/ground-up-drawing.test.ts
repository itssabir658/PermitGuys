import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GU_ASSEMBLED, GU_EXPLODED, GU_FILLS, GU_GAP, GU_LINES, GU_RISE, guLayers } from "@/content/ground-up-drawing";

/* The homepage's ground-up drawing: an illustrative house in five layers, painted in code. */

const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
/** The points of path data written with moves, lines and closes only. */
const points = (d: string) => {
  const n = numbers(d);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};

describe("ground-up drawing", () => {
  it("has its five layers, bottom first, each lifted one gap above the last in the exploded drawing", () => {
    expect(guLayers.map((l) => l.id)).toEqual(["foundation", "framing", "ground", "upper", "roof"]);
    guLayers.forEach((l, i) => expect(l.lift).toBeCloseTo(i * GU_GAP * GU_RISE, 0));
  });

  it("writes its paths in whole units with moves, lines and closes only, and each draft line as one move and one line", () => {
    for (const l of guLayers) {
      for (const p of l.paths) expect(p.d, `${l.id} ${p.cls}`).toMatch(/^M[-\d MLZ]+$/);
      expect(l.draft).toMatch(/^(M-?\d+[ -]\d+L-?\d+[ -]\d+)+$/);
      expect(numbers(l.draft)).toHaveLength(4 * l.draftLines);
    }
  });

  it("paints only the materials and lines the stylesheet colours", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const l of guLayers)
      for (const p of l.paths) {
        expect(p.kind === "fill" ? GU_FILLS : GU_LINES).toContain(p.cls);
        expect(css).toContain(`.${p.kind === "fill" ? "f" : "l"}-${p.cls}`);
      }
  });

  it("keeps everything a layer paints, and its draft, inside its box, and its box inside both drawings", () => {
    for (const l of guLayers) {
      const b = l.box;
      for (const [x, y] of [...l.paths.flatMap((p) => points(p.d)), ...points(l.draft)]) {
        expect(x).toBeGreaterThanOrEqual(b.x);
        expect(x).toBeLessThanOrEqual(b.x + b.w);
        expect(y).toBeGreaterThanOrEqual(b.y);
        expect(y).toBeLessThanOrEqual(b.y + b.h);
      }
      for (const [box, lift] of [
        [GU_EXPLODED, l.lift],
        [GU_ASSEMBLED, 0],
      ] as const) {
        expect(b.x).toBeGreaterThanOrEqual(box.x);
        expect(b.x + b.w).toBeLessThanOrEqual(box.x + box.w + 0.1);
        expect(b.y - lift).toBeGreaterThanOrEqual(box.y - 0.1);
        expect(b.y - lift + b.h).toBeLessThanOrEqual(box.y + box.h + 0.1);
      }
    }
    // The gaps make the exploded drawing taller than the house by the lifts, no wider.
    expect(GU_EXPLODED.w).toBe(GU_ASSEMBLED.w);
    expect(GU_EXPLODED.h).toBeGreaterThan(GU_ASSEMBLED.h + 3 * GU_GAP * GU_RISE);
  });

  it("tags each layer on its west side, and names it without a size", () => {
    for (const l of guLayers) {
      expect(l.tag.x).toBeGreaterThan(l.box.x);
      expect(l.tag.x).toBeLessThan(l.box.x + l.box.w / 2);
      expect(l.tag.y).toBeGreaterThan(l.box.y);
      expect(l.tag.y).toBeLessThan(l.box.y + l.box.h);
      expect(l.name).not.toMatch(/\d/);
    }
  });
});
