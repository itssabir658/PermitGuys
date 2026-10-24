import { describe, expect, it } from "vitest";
import { sleeper, type Frame, type Range } from "@/lib/motion/engine";

/* A module's sleep (engine.ts, sleeper): it skips its frames while its section is more than a screen off the screen. */

const vh = 800;
const at = (scroll: number): Frame => ({ time: 0, dt: 0, scroll, vw: 390, vh, reduced: false, tracks: true, touch: true });
// A section 2 screens tall, 5 screens down the page.
const r: Range = { top: 5 * vh, left: 0, width: 390, height: 2 * vh };

describe("sleeper", () => {
  it("draws every frame while the section is within a screen of the screen", () => {
    const sleep = sleeper();
    // From its top a screen below the bottom of the screen to its bottom a screen above the top.
    for (const y of [3, 3.5, 4, 5, 6, 7, 7.5, 8].map((s) => s * vh)) {
      expect(sleep.skip(r, at(y))).toBe(false);
      expect(sleep.skip(r, at(y))).toBe(false);
    }
  });

  it("draws the frame the section leaves on, on either side, then sleeps until it comes back", () => {
    const sleep = sleeper();
    expect(sleep.skip(r, at(4 * vh))).toBe(false);
    // Below: the frame it goes on is drawn, then nothing while it stays there, however the page moves.
    expect(sleep.skip(r, at(2.9 * vh))).toBe(false);
    for (const y of [2.8, 1, 0, 2.5].map((s) => s * vh)) expect(sleep.skip(r, at(y))).toBe(true);
    // Back within a screen: drawn again.
    expect(sleep.skip(r, at(3.2 * vh))).toBe(false);
    // Above: the same.
    expect(sleep.skip(r, at(8.1 * vh))).toBe(false);
    for (const y of [9, 20, 8.2].map((s) => s * vh)) expect(sleep.skip(r, at(y))).toBe(true);
    // A jump from far above to far below draws the frame it lands on.
    expect(sleep.skip(r, at(0))).toBe(false);
    expect(sleep.skip(r, at(0))).toBe(true);
  });

  it("draws the next frame whatever after a wake (a measure: the layout may have changed under it)", () => {
    const sleep = sleeper();
    expect(sleep.skip(r, at(0))).toBe(false);
    expect(sleep.skip(r, at(0))).toBe(true);
    sleep.wake();
    expect(sleep.skip(r, at(0))).toBe(false);
    expect(sleep.skip(r, at(0))).toBe(true);
  });
});
