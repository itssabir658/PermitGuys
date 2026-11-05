import { describe, expect, it } from "vitest";
import { LOADER_BLADES, LOADER_BLADES_NARROW, LOADER_OPEN_AT_MS, LOADER_OPEN_STAGGER_MS, bladeDelay, facadeDoneAt, loaderEndAt } from "@/lib/motion/intro";

describe("loader timeline", () => {
  it("is short: the façade complete in under two seconds, gone in under four", () => {
    expect(facadeDoneAt()).toBeLessThanOrEqual(2000);
    expect(loaderEndAt(LOADER_BLADES)).toBeLessThanOrEqual(4000);
    expect(loaderEndAt(LOADER_BLADES_NARROW)).toBeLessThanOrEqual(loaderEndAt(LOADER_BLADES));
  });

  it("opens the blades from the middle outward, symmetrically", () => {
    for (const count of [LOADER_BLADES, LOADER_BLADES_NARROW]) {
      const delays = Array.from({ length: count }, (_, i) => bladeDelay(i, count));
      // The middle pair go first, together.
      expect(delays[count / 2 - 1]).toBe(LOADER_OPEN_AT_MS);
      expect(delays[count / 2]).toBe(LOADER_OPEN_AT_MS);
      // Mirror images, each step out one stagger later.
      for (let i = 0; i < count; i++) expect(delays[i]).toBe(delays[count - 1 - i]);
      for (let i = count / 2; i < count - 1; i++) expect(delays[i + 1] - delays[i]).toBe(LOADER_OPEN_STAGGER_MS);
    }
  });
});
