import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORDMARK_LETTERS } from "@/content/intro-wordmark";
import { GTA_BORDERS, GTA_HEIGHT, GTA_OUTLINE, GTA_REGIONS, GTA_WIDTH } from "@/content/gta-map";
import { INTRO_COMPLETE_MS, INTRO_REVEAL_STAGGER_MS, borderTiming, introExitAt, outlineTiming, revealTiming, wordmarkTiming } from "@/lib/motion/intro";

/** Width and height of a lossy WebP (VP8 chunk). */
function webpSize(src: string) {
  const buf = readFileSync(join(process.cwd(), "public", src));
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") throw new Error(`${src}: not a WebP`);
  if (buf.toString("ascii", 12, 16) !== "VP8 ") throw new Error(`${src}: not a lossy WebP`);
  return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
}

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("GTA map", () => {
  it("has the five regions in reveal order, west to east", () => {
    expect(GTA_REGIONS.map((r) => r.key)).toEqual(["halton", "peel", "york", "toronto", "durham"]);
  });

  it("keeps every region's box, centre and lines inside the map", () => {
    for (const r of GTA_REGIONS) {
      const [x, y, w, h] = r.box;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(GTA_WIDTH + 0.1);
      expect(y + h).toBeLessThanOrEqual(GTA_HEIGHT + 0.1);
      expect(r.centre[0]).toBeGreaterThan(x);
      expect(r.centre[0]).toBeLessThan(x + w);
      expect(r.centre[1]).toBeGreaterThan(y);
      expect(r.centre[1]).toBeLessThan(y + h);
    }
    for (const d of [...GTA_OUTLINE, ...GTA_BORDERS]) {
      for (const n of numbers(d)) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(GTA_WIDTH + 100);
      }
    }
  });

  it("gives each clip path in its own box's units, spanning the box", () => {
    for (const r of GTA_REGIONS) {
      const n = numbers(r.clip);
      expect(Math.min(...n)).toBeCloseTo(0, 2);
      expect(Math.max(...n)).toBeCloseTo(1, 2);
    }
  });

  it("crops each picture to its region's shape of box, at three widths, the full one at the crop's own resolution", () => {
    for (const r of GTA_REGIONS) {
      const aspect = r.box[2] / r.box[3];
      const sizes = [r.picture.small, r.picture.medium, r.picture.full].map(webpSize);
      expect(sizes[2]).toEqual({ width: r.picture.width, height: r.picture.height });
      for (const s of sizes) expect(s.width / s.height).toBeCloseTo(aspect, 1);
      expect(sizes[0].width).toBeLessThan(sizes[1].width);
      expect(sizes[1].width).toBeLessThanOrEqual(sizes[2].width);
      // Sharp on large screens: at least 1400px on its long edge.
      expect(Math.max(r.picture.width, r.picture.height)).toBeGreaterThanOrEqual(1400);
    }
  });

  it("draws the map in straight lines: a few dozen corners in all", () => {
    const corners = [...GTA_OUTLINE, ...GTA_BORDERS].reduce((n, d) => n + numbers(d).length / 2, 0);
    expect(corners).toBeLessThan(120);
  });

  it("never names an address in a picture's file", () => {
    for (const r of GTA_REGIONS) expect(r.picture.small + r.picture.medium + r.picture.full).not.toMatch(/\d{2,}[- ]?[a-z]|street|drive|road|avenue|\bdr\b|\bst\b/i);
  });
});

describe("intro timeline", () => {
  it("draws the outline before any picture, with the borders alongside", () => {
    expect(outlineTiming(0).at).toBeGreaterThanOrEqual(300);
    expect(outlineTiming(0).at).toBeLessThanOrEqual(500);
    expect(outlineTiming(0).ms).toBeGreaterThanOrEqual(1000);
    expect(outlineTiming(0).ms).toBeLessThanOrEqual(1500);
    expect(borderTiming(0).at).toBeLessThan(outlineTiming(0).at + outlineTiming(0).ms);
    expect(revealTiming(0).at).toBeGreaterThan(outlineTiming(0).at + outlineTiming(0).ms * 0.8);
  });

  it("writes the name, PERMITGUYS, letter by letter while the outline draws", () => {
    expect(WORDMARK_LETTERS).toHaveLength(10);
    const last = wordmarkTiming(WORDMARK_LETTERS.length - 1);
    expect(wordmarkTiming(0).at).toBeGreaterThanOrEqual(outlineTiming(0).at);
    expect(wordmarkTiming(0).at).toBeLessThan(outlineTiming(0).at + outlineTiming(0).ms);
    expect(last.at + last.ms).toBeLessThan(revealTiming(4).at + revealTiming(4).ms);
  });

  it("reveals the regions one by one, 150 to 250ms apart", () => {
    expect(INTRO_REVEAL_STAGGER_MS).toBeGreaterThanOrEqual(150);
    expect(INTRO_REVEAL_STAGGER_MS).toBeLessThanOrEqual(250);
    for (let i = 1; i < 5; i++) expect(revealTiming(i).at - revealTiming(i - 1).at).toBe(INTRO_REVEAL_STAGGER_MS);
  });

  it("holds the finished map, and runs about four to six seconds with the crossfade", () => {
    expect(INTRO_COMPLETE_MS).toBeGreaterThanOrEqual(500);
    expect(INTRO_COMPLETE_MS).toBeLessThanOrEqual(800);
    const exit = introExitAt(GTA_REGIONS.length, GTA_BORDERS.length, GTA_OUTLINE.length);
    expect(exit).toBeGreaterThan(revealTiming(4).at + revealTiming(4).ms);
    expect(exit + 800).toBeGreaterThanOrEqual(4000);
    expect(exit + 800).toBeLessThanOrEqual(6000);
  });
});
