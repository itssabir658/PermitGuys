import { describe, expect, it } from "vitest";
import { HOUSE_DOOR, HOUSE_GROUND, HOUSE_HEIGHT, HOUSE_STROKES, HOUSE_WIDTH } from "@/content/house-drawing";
import { LOADER_ENTER_MARGIN, drawingDoneAt, enterScale, loaderEndAt } from "@/lib/motion/intro";

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("house drawing", () => {
  it("keeps every line on the sheet", () => {
    for (const s of HOUSE_STROKES) for (const v of numbers(s.d)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(HOUSE_WIDTH);
    }
  });

  it("stands the door on the ground, in the middle of the house", () => {
    const [x, y, w, h] = HOUSE_DOOR;
    expect(y + h).toBe(HOUSE_GROUND);
    expect(x + w / 2).toBe(HOUSE_WIDTH / 2);
    expect(y).toBeGreaterThan(0);
    expect(HOUSE_GROUND).toBeLessThan(HOUSE_HEIGHT);
  });

  it("draws as a drafter would: construction lines, walls, roof, windows, then the red door", () => {
    const first = (kind: string) => Math.min(...HOUSE_STROKES.filter((s) => s.kind === kind).map((s) => s.at));
    expect(first("guide")).toBeLessThan(first("ink"));
    expect(first("ink")).toBeLessThan(first("door"));
    const door = HOUSE_STROKES.filter((s) => s.kind === "door");
    expect(door).toHaveLength(1);
    for (const s of HOUSE_STROKES.filter((x) => x.kind === "ink")) expect(s.at).toBeLessThanOrEqual(door[0].at);
  });
});

describe("loader timeline", () => {
  it("is short: the drawing done in about two seconds, gone in about three and a half", () => {
    expect(drawingDoneAt()).toBeGreaterThanOrEqual(1500);
    expect(drawingDoneAt()).toBeLessThanOrEqual(2200);
    expect(loaderEndAt()).toBeLessThanOrEqual(3800);
  });

  it("grows the doorway past every edge of the screen, wherever the door sits", () => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 3840, height: 2160 }]) {
      const door = { left: viewport.width / 2 - 13, top: viewport.height * 0.6, width: 26, height: 52 };
      const s = enterScale(door, viewport);
      const cx = door.left + door.width / 2;
      const cy = door.top + door.height / 2;
      expect(cx - (s * door.width) / 2).toBeLessThan(0);
      expect(cx + (s * door.width) / 2).toBeGreaterThan(viewport.width);
      expect(cy - (s * door.height) / 2).toBeLessThan(0);
      expect(cy + (s * door.height) / 2).toBeGreaterThan(viewport.height);
      expect(s).toBeLessThan(200 * LOADER_ENTER_MARGIN);
    }
  });
});
