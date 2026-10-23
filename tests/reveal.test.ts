import { describe, expect, it } from "vitest";
import { REVEAL_MAX_STEPS, REVEAL_SETTLE, REVEAL_STEP, ROW_SELECTOR, readingOrder, revealDelay } from "@/lib/motion/reveal";

/* Inner-page scroll reveals (InteractionEffects.tsx). */
describe("inner-page reveals", () => {
  it("reveals pieces that arrive together in reading order: top to bottom, then left to right", () => {
    const at = (name: string, top: number, left: number) => ({ name, top, left });
    const batch = [at("list, second row", 160, 400), at("right column", 3, 820), at("heading", 0, 400), at("list, first row", 80, 400), at("left column", -2, 80)];
    expect(readingOrder(batch).map((p) => p.name)).toEqual(["left column", "heading", "right column", "list, first row", "list, second row"]);
    // The input is left as it was.
    expect(batch[0].name).toBe("list, second row");
  });

  it("staggers 60ms apart and never makes a long batch wait more than 480ms", () => {
    expect([0, 1, 2, 3].map((k) => revealDelay(k))).toEqual([0, 60, 120, 180]);
    expect(revealDelay(8)).toBe(REVEAL_STEP * REVEAL_MAX_STEPS);
    expect(revealDelay(40)).toBe(480);
    expect(revealDelay(-1)).toBe(0);
  });

  it("holds the first screen until the page header has had its moment", () => {
    expect(revealDelay(0, REVEAL_SETTLE)).toBe(600);
    expect(revealDelay(2, REVEAL_SETTLE)).toBe(720);
    // The header's lead starts at 0.4s; the body follows it, before the rule has finished drawing (1.75s).
    expect(REVEAL_SETTLE).toBeGreaterThan(400);
    expect(REVEAL_SETTLE + REVEAL_STEP * REVEAL_MAX_STEPS).toBeLessThan(1750);
  });

  it("treats lists, disclosures, table rows, paragraphs and marked blocks as rows", () => {
    const kinds = ROW_SELECTOR.split(",").map((s) => s.trim());
    for (const kind of ["li", "details", "tr", "p", "dl > div", "[data-placeholder]", "[data-row]"]) expect(kinds).toContain(kind);
    // Display headings are split into lines instead, never faded as rows.
    expect(kinds).not.toContain("h1");
    expect(kinds).not.toContain("h2");
  });
});
