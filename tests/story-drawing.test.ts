import { describe, expect, it } from "vitest";
import { LINE_KINDS, STORY_H, STORY_VP, STORY_W, storyGrid, storyLevels, storyLines, storyMembers, toElevation, toPicture, toSheet, type Seg } from "@/content/story-drawing";

/* The homepage story's drawing: traced from the rendering through the rectifying homography, and laid out on the sheet. */

const points = (s: Seg) => [
  [s[0], s[1]],
  [s[2], s[3]],
];
/** Every place a line, a marker or a label is drawn over the picture, and on the sheet. */
const pictureSegs = [...storyLines.map((l) => l.p), ...storyGrid.map((a) => a.p), ...storyLevels.map((l) => l.p), ...storyMembers.flatMap((m) => m.p)];
const sheetSegs = [...storyLines.map((l) => l.q), ...storyGrid.map((a) => a.q), ...storyLevels.map((l) => l.q), ...storyMembers.flatMap((m) => m.q)];

describe("story drawing", () => {
  it("the rectification and its inverse undo each other", () => {
    for (const [x, y] of [
      [0, 0],
      [612, 299],
      [1766, 1406],
      [2732, 2540],
      [-200, 3000],
    ]) {
      const [px, py] = toPicture(x, y);
      const [ex, ey] = toElevation(px, py);
      expect(ex).toBeCloseTo(x, 6);
      expect(ey).toBeCloseTo(y, 6);
    }
  });

  it("keeps verticals vertical and sends every horizontal of the facade to the vanishing point", () => {
    for (const x of [417, 1068, 2732]) expect(toPicture(x, 300)[0]).toBeCloseTo(toPicture(x, 2400)[0], 9);
    for (const y of [275, 1406, 2540]) {
      const [x1, y1] = toPicture(400, y);
      const [x2, y2] = toPicture(2700, y);
      // The line through both ends passes through the vanishing point.
      const atVp = y1 + ((y2 - y1) * (STORY_VP.x - x1)) / (x2 - x1);
      expect(atVp).toBeCloseTo(STORY_VP.y, 6);
    }
    // The column it keeps at the picture's own scale, near the house's right edge, is unmoved but for the elevation's offset.
    const [rx, ry] = toPicture(2780, 1000);
    expect(rx).toBeCloseTo(2480, 6);
    expect(ry).toBeCloseTo(800, 6);
  });

  it("draws every line over the picture inside the rendering, and every line on the sheet inside its margins", () => {
    for (const s of pictureSegs) {
      for (const [x, y] of points(s)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(STORY_W);
        expect(y).toBeGreaterThanOrEqual(0);
        // The grid lines run on below grade, to the picture's foot.
        expect(y).toBeLessThanOrEqual(STORY_H + 2);
      }
    }
    for (const s of sheetSegs) {
      for (const [x, y] of points(s)) {
        expect(x).toBeGreaterThanOrEqual(60);
        expect(x).toBeLessThanOrEqual(STORY_W - 60);
        expect(y).toBeGreaterThanOrEqual(60);
        expect(y).toBeLessThanOrEqual(STORY_H - 60);
      }
    }
    for (const a of storyGrid) {
      expect(a.pb[1] - 9 * 4.4).toBeGreaterThan(0);
      expect(a.qb[1]).toBeLessThan(a.q[1] + 1);
    }
  });

  it("the sheet is a true elevation: every line square, every level level", () => {
    for (const s of sheetSegs) {
      const flat = Math.abs(s[1] - s[3]) < 0.11;
      const plumb = Math.abs(s[0] - s[2]) < 0.11;
      // The reveals of the deep window surround are the drawing's only diagonals.
      if (!flat && !plumb) expect(storyLines.find((l) => l.q === s)?.kind).toBe("detail");
    }
    for (const l of storyLevels) expect(l.q[1]).toBe(l.q[3]);
    for (const a of storyGrid) expect(a.q[0]).toBe(a.q[2]);
  });

  it("lists the lines in the order the sketch draws them: by kind, the ground first", () => {
    expect(storyLines.length).toBeGreaterThan(100);
    const ranks = storyLines.map((l) => LINE_KINDS.indexOf(l.kind));
    for (let i = 1; i < ranks.length; i++) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    expect(storyLines[0].kind).toBe("ground");
  });

  it("over the picture a level stops at the last grid line, under its bubble; on the sheet it runs past it", () => {
    const last = storyGrid[storyGrid.length - 1];
    for (const l of storyLevels) {
      expect(l.p[2]).toBeCloseTo(last.p[0], 0);
      expect(l.q[2]).toBeGreaterThan(last.q[0] + 50);
    }
    // The short labels are shorter.
    for (const l of storyLevels) if (l.short) expect(l.short.length).toBeLessThan(l.label.length);
  });

  it("labels the structure by what it is, never by a size", () => {
    expect(storyGrid.map((a) => a.label)).toEqual(["1", "2", "3"]);
    expect(storyLevels.map((l) => l.label)).toEqual(["Roof", "Level 2", "Level 1", "Grade"]);
    const labels = storyMembers.map((m) => m.label).filter(Boolean);
    expect(new Set(labels)).toEqual(new Set(["Beam", "Post", "Footing"]));
    for (const m of storyMembers) {
      expect(m.label).not.toMatch(/\d/);
      expect(m.p).toHaveLength(4);
      expect(m.q).toHaveLength(4);
    }
    // The footings, below grade, are the hidden (dashed) ones.
    for (const m of storyMembers) expect(m.hidden).toBe(m.p.every((s) => toElevation(s[0], s[1])[1] > 2540));
  });

  it("puts the sheet's drawing in the middle of the sheet", () => {
    const xs = sheetSegs.flatMap((s) => [s[0], s[2]]);
    const ys = sheetSegs.flatMap((s) => [s[1], s[3]]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    expect(Math.abs(cx - STORY_W / 2)).toBeLessThan(80);
    expect(Math.abs(cy - STORY_H / 2)).toBeLessThan(80);
    // toSheet is a uniform scale: squares stay square.
    const [ax, ay] = toSheet(0, 0);
    const [bx, by] = toSheet(100, 100);
    expect(bx - ax).toBeCloseTo(by - ay, 9);
  });
});
