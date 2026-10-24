import { describe, expect, it } from "vitest";
import {
  LINE_REST,
  MASK,
  contactPicture,
  contactPictureAt,
  contactRise,
  contactRiseAt,
  MAKING,
  dusk,
  duskPartWay,
  makingPartWay,
  heroPartWay,
  introPartWay,
  lineCut,
  partWay,
  servicesPartWay,
  servicesReveal,
  servicesRevealAt,
  storyPartWay,
  valuesPartWay,
  worksPartWay,
} from "@/lib/motion/home";
import { SETTLE_JOIN, SETTLE_WAIT, ZONE_STEP, entranceClock, mergeSpans, settleAt, settleDuration, settleTarget, spansWhere, type Span } from "@/lib/motion/settle";

/* Touch screens: the page is never left at rest part way through a change (settle.ts, and the scenes' rules in home.ts). */

const range = (from: number, to: number, by: number) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by);

describe("settle", () => {
  it("finds the spans where a change is part way, each running from the last place before it to the first after it", () => {
    expect(spansWhere(0, 10, 1, (y) => y > 2.5 && y < 6.5)).toEqual([[2, 7]]);
    expect(spansWhere(0, 10, 1, (y) => (y > 1.5 && y < 2.5) || (y > 6.5 && y < 8.5))).toEqual([[1, 3], [6, 9]]);
    // A change still under way at the end of the range ends with it, and the last sample is the end of the range.
    expect(spansWhere(0, 10, 1, (y) => y > 8.5)).toEqual([[8, 10]]);
    const [[a, b]] = spansWhere(0, 1, 0.3, (y) => y > 0.95);
    expect(a).toBeCloseTo(0.9);
    expect(b).toBe(1);
    expect(spansWhere(0, 10, 1, () => false)).toEqual([]);
    expect(spansWhere(5, 1, 1, () => true)).toEqual([]);
    expect(spansWhere(0, 1, 0, () => true)).toEqual([]);
  });

  it("joins spans that overlap or meet, and those with too short a rest between them", () => {
    expect(mergeSpans([[5, 7], [1, 3], [2, 4]])).toEqual([[1, 4], [5, 7]]);
    expect(mergeSpans([[1, 2], [2, 3]])).toEqual([[1, 3]]);
    expect(mergeSpans([[1, 2], [2.1, 3], [4, 5]], 0.15)).toEqual([[1, 3], [4, 5]]);
    expect(mergeSpans([[2, 2]])).toEqual([]);
  });

  it("settles a page at rest in a change on to its end in the direction it was going, however little of the way in it is", () => {
    const spans: Span[] = [[1000, 2000], [3000, 3200]];
    for (const y of [1001, 1100, 1500, 1999]) {
      expect(settleTarget(y, 1, spans)).toBe(2000);
      expect(settleTarget(y, -1, spans)).toBe(1000);
    }
    expect(settleTarget(3010, 1, spans)).toBe(3200);
    // Whole already: at either end, or outside every change.
    for (const y of [900, 1000, 2000, 2400, 3200]) expect(settleTarget(y, 1, spans)).toBeNull();
  });

  it("waits for the momentum to run out, then glides from rest to rest: a short way quickly, a long one unhurried", () => {
    expect(SETTLE_WAIT).toBeGreaterThanOrEqual(60);
    expect(SETTLE_WAIT).toBeLessThanOrEqual(150);
    expect(settleDuration(0, 800)).toBe(0.3);
    expect(settleDuration(400, 800)).toBeCloseTo(0.55);
    expect(settleDuration(-400, 800)).toBeCloseTo(0.55);
    expect(settleDuration(5000, 800)).toBe(0.8);
    expect(settleAt(100, 300, 0, 0.5)).toBe(100);
    expect(settleAt(100, 300, 0.25, 0.5)).toBeCloseTo(200);
    expect(settleAt(100, 300, 0.6, 0.5)).toBe(300);
    // It sets off and arrives slowly: the first and last 20ms cover far less than any 20ms in the middle.
    const step = (t: number) => Math.abs(settleAt(100, 300, t + 0.02, 0.5) - settleAt(100, 300, t, 0.5));
    expect(step(0)).toBeLessThan(step(0.24) / 5);
    expect(step(0.48)).toBeLessThan(step(0.24) / 5);
    for (const t of range(0, 0.5, 0.01)) expect(settleAt(100, 300, t + 0.01, 0.5)).toBeGreaterThanOrEqual(settleAt(100, 300, t, 0.5));
  });

  it("plays an entrance on its own clock once the page brings it to its start, and again after it goes back below the screen", () => {
    const since = entranceClock();
    const piece = {};
    expect(since(0, piece, -0.1, 0.06)).toBeLessThan(0);
    expect(since(0.5, piece, 0.03, 0.06)).toBeLessThan(0);
    expect(since(1, piece, 0.07, 0.06)).toBe(0);
    // Whatever the scroll does next, short of taking it off the bottom of the screen, it carries on.
    expect(since(1.5, piece, 0.07, 0.06)).toBeCloseTo(0.5);
    expect(since(1.6, piece, 0.02, 0.06)).toBeCloseTo(0.6);
    expect(since(4, piece, 3, 0.06)).toBeCloseTo(3);
    expect(since(5, piece, -0.01, 0.06)).toBeLessThan(0);
    expect(since(6, piece, 0.2, 0.06)).toBe(0);
  });

  it("staggers pieces that start in the same frame, in the order they are asked for, and only those", () => {
    const since = entranceClock();
    const [a, b, c, d] = [{}, {}, {}, {}];
    expect(since(1, a, 0.2, 0.06, 0.07)).toBe(0);
    expect(since(1, b, 0.2, 0.06, 0.07)).toBeCloseTo(-0.07);
    expect(since(1, c, 0.2, 0.06, 0.07)).toBeCloseTo(-0.14);
    expect(since(1.14, c, 0.2, 0.06, 0.07)).toBeCloseTo(0);
    expect(since(1.2, d, 0.2, 0.06, 0.07)).toBe(0);
  });
});

describe("where a scene is part way", () => {
  /** The rests between the zones of `partWay` over [from, to], in screens, the zones joined as the engine joins them. */
  const settled = (from: number, to: number, isPartWay: (x: number) => boolean) => {
    const zones = mergeSpans(spansWhere(from, to, ZONE_STEP, isPartWay), SETTLE_JOIN);
    const rests: Span[] = [];
    let at = from;
    for (const [a, b] of zones) {
      if (a > at) rests.push([at, a]);
      at = b;
    }
    if (to > at) rests.push([at, to]);
    return { zones, rests };
  };
  /** The longest rest inside [from, to]. */
  const longest = (rests: Span[], from: number, to: number) => Math.max(0, ...rests.map(([a, b]) => Math.min(b, to) - Math.max(a, from)));

  it("a masked line is cut while some of it shows and some is hidden; a wipe is part way between its ends", () => {
    for (const y of [0, LINE_REST, -LINE_REST, MASK, -MASK, MASK - LINE_REST]) expect(lineCut(y)).toBe(false);
    for (const y of [LINE_REST + 0.1, 60, -60, MASK - LINE_REST - 0.1]) expect(lineCut(y)).toBe(true);
    for (const p of [0, 0.004, 0.996, 1]) expect(partWay(p)).toBe(false);
    for (const p of [0.01, 0.5, 0.99]) expect(partWay(p)).toBe(true);
  });

  it("hero: whole at the top and once the name has gone; part way only as they leave", () => {
    const vh = 844;
    expect(heroPartWay(0, 0, vh)).toBe(false);
    expect(heroPartWay(0.4 * vh, 0, vh)).toBe(true);
    expect(heroPartWay(0.75 * vh, 0, vh)).toBe(false);
    const { zones } = settled(0, 2.5, (s) => heroPartWay(s * vh, 0, vh));
    expect(zones).toHaveLength(1);
    expect(zones[0][1]).toBeLessThan(0.75);
  });

  it("intro: each paragraph keeps its whole moment, and the ring's fling is never left half way", () => {
    for (const lines of [[5, 5], [7, 7]]) {
      const { rests, zones } = settled(0, 6.1, (s) => introPartWay(s, lines));
      // copyIn [1, 2.75] in screens since the stage pinned, which is sso − 1.
      expect(longest(rests, 1.5, 3.2)).toBeGreaterThan(0.85);
      expect(longest(rests, 3.2, 4.9)).toBeGreaterThan(0.85);
      for (const [a, b] of zones) expect([introPartWay(a, lines), introPartWay(b, lines)]).toEqual([false, false]);
      // The fling is done before the intro's end, as the story comes up.
      expect(introPartWay(5.75, lines)).toBe(false);
    }
  });

  it("story: every chapter keeps 0.6 screens or more with its text composed, and the drawing is whole wherever the page rests", () => {
    for (const lines of [[4, 4, 4, 4], [8, 8, 8, 8]]) {
      const { rests, zones } = settled(-1, 4.8, (e) => storyPartWay(e, lines, 4));
      for (let i = 0; i < 4; i++) expect(longest(rests, i * 1.2, (i + 1) * 1.2)).toBeGreaterThanOrEqual(0.6);
      for (const [a, b] of zones) expect([storyPartWay(a, lines, 4), storyPartWay(b, lines, 4)]).toEqual([false, false]);
    }
  });

  it("the making of a house: every chapter keeps half a screen or more with its text and board whole, and so does the house at dusk", () => {
    const { starts, release } = MAKING;
    for (const lines of [[4, 4, 4, 4, 4], [7, 7, 7, 7, 7]]) {
      const { rests, zones } = settled(-1, release, (e) => makingPartWay(e, lines));
      for (let i = 0; i < starts.length; i++) expect(longest(rests, starts[i], starts[i + 1] ?? release), `chapter ${i}`).toBeGreaterThanOrEqual(0.5);
      expect(longest(rests, MAKING.fade.dusk[1][0], release)).toBeGreaterThan(0.5);
      for (const [a, b] of zones) expect([makingPartWay(a, lines), makingPartWay(b, lines)]).toEqual([false, false]);
    }
  });

  it("works: every project keeps 0.6 screens or more composed", () => {
    for (const titles of [[2, 2, 2], [3, 3, 3]]) {
      const { rests } = settled(-1, 3.2, (e) => worksPartWay(e, 3.2, titles));
      for (let i = 0; i < 3; i++) expect(longest(rests, (i * 3.2) / 3, ((i + 1) * 3.2) / 3)).toBeGreaterThan(0.6);
    }
  });

  it("values: every value keeps a third of a screen or more with its word and description whole", () => {
    for (const lines of [[3, 3, 3, 3], [6, 6, 6, 6]]) {
      // x0: screens since the first value's block reached the top of the screen; block i is at x0 − i, and the section's sso is x0 + 1.
      const { rests } = settled(-1, 3.5, (x0) => valuesPartWay([0, 1, 2, 3].map((i) => x0 - i), x0 + 1, lines));
      for (let i = 0; i < 4; i++) expect(longest(rests, i - 0.5, i + 0.5)).toBeGreaterThan(0.33);
    }
  });

  it("dusk and Services: part way only while the dusk falls and the heading rises, whole before the stage pins", () => {
    expect(duskPartWay(0.2)).toBe(false);
    expect(duskPartWay(0.35)).toBe(true);
    expect(duskPartWay(0.5)).toBe(false);
    expect(dusk(0.24)).toBe(0);
    expect(dusk(0.46)).toBe(1);
    // A phone: the heading's three lines, the list flowing; a tablet's pinned track: the two labels and seven rows too.
    for (const slots of [0, 9]) {
      const { zones } = settled(0, 2, (s) => servicesPartWay(s, 3, slots) || duskPartWay(s));
      expect(zones).toHaveLength(1);
      expect(zones[0][0]).toBeCloseTo(0.24, 2);
      expect(zones[0][1]).toBeLessThan(slots ? 1 : 0.75);
    }
  });

  it("the timed entrances draw the very states the scrubbed ones do", () => {
    for (const x of range(0, 0.6, 0.05)) expect(servicesRevealAt(servicesReveal(x).r)).toEqual(servicesReveal(x));
    for (const s of range(0, 0.5, 0.05)) {
      expect(contactRiseAt(contactRise(s).t)).toEqual(contactRise(s));
      expect(contactPictureAt(contactPicture(s).t)).toEqual(contactPicture(s));
    }
    expect(contactRiseAt(1, 12)).toEqual({ t: 1, y: 0, opacity: 1 });
  });
});
