import { describe, expect, it } from "vitest";
import {
  CREAM,
  MASK,
  NIGHT,
  ORBIT,
  ORBIT_EDGE_FADE,
  ORBIT_SLOTS,
  STONE,
  contactReveal,
  headerGround,
  heroState,
  introCopy,
  introLine,
  introPhases,
  introProgress,
  orbitItem,
  orbitPath,
  pageGround,
  pathAt,
  roll,
  servicesHeadingLine,
  servicesReveal,
  servicesW,
  valuesLine,
  valuesText,
  worksButtonLive,
  worksElement,
  worksImageScale,
  worksT,
} from "@/lib/motion/home";
import { clamp, cssEase, damp, ease, fit, fromOklab, mixColorNum, mixColorOklab, smoothstep, toHex, toOklab, tween } from "@/lib/motion/math";

/* The homepage choreography, measured at 1440×900. */
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

  it("power3InOut is symmetric about the middle", () => {
    expect(ease.power3InOut(0.5)).toBeCloseTo(0.5);
    for (const t of [0.1, 0.25, 0.4]) expect(ease.power3InOut(t) + ease.power3InOut(1 - t)).toBeCloseTo(1);
    // Steeper than power2InOut through the middle, flatter at the ends.
    expect(ease.power3InOut(0.2)).toBeLessThan(ease.power2InOut(0.2));
    expect(cssEase.sheet).toBe("cubic-bezier(0.76, 0, 0.24, 1)");
    expect(cssEase.exit).toBe("cubic-bezier(0.32, 0, 0.67, 0)");
  });

  it("converts to OKLab and back without drift", () => {
    expect(toOklab(0xffffff)[0]).toBeCloseTo(1, 4);
    expect(toOklab(0xffffff)[1]).toBeCloseTo(0, 4);
    expect(toOklab(0x000000)[0]).toBeCloseTo(0, 6);
    for (const c of [CREAM, STONE, NIGHT, 0xee352f, 0x123456, 0xffffff, 0x000000]) expect(fromOklab(toOklab(c))).toBe(c);
    // Out-of-gamut points clamp each channel to the sRGB cube instead of wrapping into the next one.
    expect(toHex(fromOklab([0.7, 0.4, 0]))).toBe("#ff0094");
    expect(toHex(fromOklab([1.2, 0.3, -0.3]))).toBe("#ffc7ff");
    expect(fromOklab([-0.2, 0, 0])).toBe(0x000000);
  });

  it("mixes colours in OKLab: exact ends, an even, warm middle", () => {
    expect(mixColorOklab(CREAM, NIGHT, 0)).toBe(CREAM);
    expect(mixColorOklab(CREAM, NIGHT, 1)).toBe(NIGHT);
    expect(mixColorOklab(CREAM, NIGHT, -1)).toBe(CREAM);
    // Perceptual lightness steps evenly: the midpoint sits halfway in L.
    const mid = toOklab(mixColorOklab(CREAM, NIGHT, 0.5))[0];
    expect(mid).toBeCloseTo((toOklab(CREAM)[0] + toOklab(NIGHT)[0]) / 2, 2);
    // It keeps the warm cast of both ends: red above blue.
    const m = mixColorOklab(CREAM, NIGHT, 0.5);
    expect((m >> 16) & 255).toBeGreaterThan(m & 255);
  });
});

describe("motion vocabulary", () => {
  it("masked lines rise from MASK % and leave upward through it", () => {
    expect(MASK).toBe(120);
    expect(roll(0, 0)).toBe(120);
    expect(roll(1, 0)).toBe(0);
    expect(roll(0.5, 0)).toBe(60);
    expect(roll(1, 0.5)).toBe(-60);
    expect(roll(1, 1)).toBe(-120);
    // Leaving wins over arriving, so a line never snaps back below its mask on the way out.
    expect(roll(0.3, 0.1)).toBe(-12);
  });

  it("every homepage masked line uses the shared travel", () => {
    expect(servicesHeadingLine(0, 0, 2).yPercent).toBe(MASK);
    expect(servicesHeadingLine(1, 1, 2).yPercent).toBe(0);
    expect(valuesLine(0, 0, 3).yPercent).toBe(MASK);
    expect(valuesLine(1, 2, 3).yPercent).toBe(0);
    expect(introLine(0, 1, 0)).toBe(MASK);
    expect(heroState(0, 0, VH).nameRoll).toBe(0);
    expect(heroState(VH, 0, VH).nameRoll).toBe(-MASK);
    expect(heroState(VH, 0, VH).subRoll).toEqual([-MASK, -MASK]);
  });
});

describe("homepage choreography", () => {
  it("hero: nothing has moved at the top, and the first scroll already moves the statement and the picture", () => {
    const top = heroState(0, 0, VH);
    expect(top).toEqual({ nameRoll: 0, headingY: -0, subRoll: [0, 0], figOpacity: 1, imageScale: 1, imageY: -0, dim: 0 });
    // Before the track starts, the same.
    expect(heroState(-500, 0, VH)).toEqual(top);
    const notch = heroState(0.05 * VH, 0, VH);
    expect(notch.subRoll[0]).toBeLessThan(0);
    expect(notch.imageScale).toBeGreaterThan(1);
    expect(notch.figOpacity).toBeLessThan(1);
    // The name waits a little longer.
    expect(notch.nameRoll).toBe(0);
  });

  it("hero: the statement and the name have left through their masks before the intro's sheet reaches them", () => {
    // The sheet's top edge is at (1.5 − s) screens from the top of the screen: at the bottom at 0.5, the middle at 1.0.
    const sheetArrives = heroState(0.5 * VH, 0, VH);
    expect(sheetArrives.subRoll).toEqual([-MASK, -MASK]);
    expect(sheetArrives.figOpacity).toBe(0);
    expect(heroState(0.72 * VH, 0, VH).nameRoll).toBeCloseTo(-MASK);
    expect(heroState(0.72 * VH, 0, VH).headingY).toBeCloseTo(-0.08 * VH);
    // Leaving only ever goes up: the rolls never return below 0 on the way out.
    for (let s = 0; s <= 1.5; s += 0.01) {
      const h = heroState(s * VH, 0, VH);
      expect(h.nameRoll).toBeLessThanOrEqual(0);
      for (const y of h.subRoll) expect(y).toBeLessThanOrEqual(0);
    }
  });

  it("hero: the picture recedes under the sheet, growing 8% at most, drifting up and darkening", () => {
    const pinned = heroState(1.5 * VH, 0, VH);
    expect(pinned.imageScale).toBeCloseTo(1.08);
    expect(pinned.imageY).toBeCloseTo(-0.04 * VH);
    expect(pinned.dim).toBeCloseTo(0.45);
    // It holds once the stage releases, hidden under the intro.
    expect(heroState(2.5 * VH, 0, VH)).toEqual(pinned);
    const mid = heroState(0.75 * VH, 0, VH);
    expect(mid.imageScale).toBeCloseTo(1.04);
    expect(mid.dim).toBeCloseTo(0.225);
  });

  it("intro track follows from the number of paragraphs, releasing 0.4 screen into the fling", () => {
    const two = introPhases(2);
    expect(two.copyIn).toEqual([1, 2.75]);
    expect(two.exitStart).toBeCloseTo(3.7);
    expect(two.sectionVh).toBe(510);
    const three = introPhases(3);
    expect(three.copyIn).toEqual([1, 2.75, 4.5]);
    expect(three.sectionVh).toBe(685);
  });

  it("intro progress starts a screen early, as the sheet rises over the hero, and the fling outlives the stage", () => {
    const { sectionVh, exitStart } = introPhases(2);
    const h = sectionVh / 100;
    // The sheet's top meets the bottom of the screen (sso 0), then pins (sso 1).
    expect(introProgress(0, h, exitStart).e).toBe(-1);
    expect(introProgress(-2, h, exitStart).e).toBe(-1);
    expect(introProgress(1, h, exitStart).e).toBe(0);
    // Released at e = 4.1; the fling runs 3.7 → 4.7 on the unclamped value.
    expect(introProgress(9, h, exitStart).e).toBeCloseTo(4.1);
    expect(introProgress(1 + exitStart, h, exitStart).exit).toBe(0);
    expect(introProgress(1 + 4.1, h, exitStart).exit).toBeCloseTo(0.352);
    expect(introProgress(1 + 4.5, h, exitStart).exit).toBeCloseTo(0.896);
    expect(introProgress(1 + 4.7, h, exitStart).exit).toBe(1);
  });

  it("orbit path: a squircle sized from the screen, read by arc length and wrapping", () => {
    const p = orbitPath(VW, VH);
    expect(p.portrait).toBe(false);
    expect(p.sizes.map(Math.round)).toEqual([216, 171, 198, 162, 207, 180]);
    // Top centre at 0, bottom centre half way round.
    const [x0, y0] = pathAt(p, 0);
    expect(x0).toBeCloseTo(0);
    expect(y0).toBeCloseTo(p.cy - p.ry);
    expect(pathAt(p, 0.5)[0]).toBeCloseTo(0, 0);
    expect(pathAt(p, 0.5)[1]).toBeCloseTo(p.cy + p.ry, 0);
    expect(pathAt(p, 1.25)).toEqual(pathAt(p, 0.25));
    expect(pathAt(p, -0.75)[0]).toBeCloseTo(pathAt(p, 0.25)[0], 6);
    // Equal steps of u are equal lengths of path, on the flat sides and round the corners alike.
    const step = (u: number) => Math.hypot(pathAt(p, u + 0.01)[0] - pathAt(p, u)[0], pathAt(p, u + 0.01)[1] - pathAt(p, u)[1]);
    for (const u of [0, 0.1, 0.125, 0.2, 0.37, 0.6, 0.875]) expect(step(u)).toBeCloseTo(step(0.05), 0);
    // Portrait phones size the studies from the width.
    const phone = orbitPath(390, 844);
    expect(phone.portrait).toBe(true);
    expect(phone.sizes.map(Math.round)).toEqual([109, 94, 113, 98, 109, 101]);
  });

  // Portrait screens pass the copy's half height (about 104px on phones, 100 on a portrait tablet), as the page does.
  for (const [vw, vh, minGap, clear] of [
    [1440, 900, 50, 0],
    [1280, 720, 50, 0],
    [1024, 768, 15, 0],
    [820, 1180, 50, 100],
    [390, 844, 20, 104],
    [360, 740, 30, 104],
  ] as const) {
    it(`orbit at ${vw}×${vh}: every study whole on screen and apart from its neighbours, the whole way round`, () => {
      const p = orbitPath(vw, vh, clear);
      for (let e = 0.5; e <= 4.1; e += 0.02) {
        const items = ORBIT_SLOTS.map((_, slot) => ({ ...orbitItem(p, slot, e, 0), size: p.sizes[slot] }));
        for (const o of items) {
          // The breathing (±3%) is the only thing that moves an image off the path.
          expect(Math.abs(o.x) + o.size / 2).toBeLessThanOrEqual(vw / 2 + 0.03 * (vw / 2));
          expect(Math.abs(o.y) + o.size / 2).toBeLessThanOrEqual(vh / 2 + 0.03 * (vh / 2));
        }
        items.forEach((a, i) =>
          items.forEach((b, j) => {
            if (j <= i || a.opacity < 0.15 || b.opacity < 0.15) return;
            const gap = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) - (a.size + b.size) / 2;
            expect(gap).toBeGreaterThan(minGap);
          }),
        );
      }
    });
  }

  it("orbit: studies glide in from beyond the ring as the sheet uncovers their place, top ones first, never as specks", () => {
    const p = orbitPath(VW, VH);
    const before = orbitItem(p, 0, -1, 0);
    // At e = −1 (the sheet still under the hero) the top centre study has only begun: near 1.8× the ring, its image still zoomed.
    expect(before.arrive).toBeGreaterThan(0);
    expect(before.arrive).toBeLessThan(0.35);
    expect(before.imgScale).toBeCloseTo(1.18 - 0.18 * before.arrive, 6);
    const [, y0] = pathAt(p, ORBIT_SLOTS[0].u - ORBIT.turnsPerScreen);
    expect((before.y - p.cy) / (y0 - p.cy)).toBeCloseTo((1.8 - 0.8 * before.arrive) * (1 + 0.03 * Math.sin(-1.7)), 6);
    // The bottom centre study starts later: the sheet uncovers the top of the ring first.
    expect(orbitItem(p, 3, -1, 0).opacity).toBe(0);
    expect(orbitItem(p, 0, -0.6, 0).arrive).toBeGreaterThan(orbitItem(p, 3, -0.6, 0).arrive + 0.3);
    for (const [vw, vh] of [
      [1440, 900],
      [1280, 720],
      [820, 1180],
      [390, 844],
    ] as const) {
      const q = orbitPath(vw, vh);
      for (let e = -1; e <= 0; e += 0.01) {
        // The part of the stage the rising sheet has uncovered, from the stage's centre.
        const uncovered = -vh / 2 + (1 + e) * vh;
        for (let slot = 0; slot < 6; slot++) {
          const o = orbitItem(q, slot, e, 0);
          const half = q.sizes[slot] / 2;
          // A study wholly in view is already more than half way in.
          if (o.y + half < uncovered && o.y - half > -vh / 2 && Math.abs(o.x) + half < vw / 2) expect(o.arrive).toBeGreaterThan(0.5);
        }
      }
      // Every slot has landed half a screen after the stage pins, at full size and opacity.
      for (let slot = 0; slot < 6; slot++) {
        const o = orbitItem(q, slot, 0.5, 0);
        expect(o.arrive).toBeCloseTo(1);
        expect(o.imgScale).toBeCloseTo(1);
        if (!q.portrait) expect(o.opacity).toBeCloseTo(1);
      }
    }
  });

  it("orbit: one speed for every study, and the fling takes the ring out to 1.9×", () => {
    const p = orbitPath(VW, VH);
    // Travel from e 1 to e 3 is the same length of path for every slot: 0.15 of the way round.
    const len = (slot: number) => {
      const u = ORBIT_SLOTS[slot].u;
      return [pathAt(p, u + ORBIT.turnsPerScreen), pathAt(p, u + 3 * ORBIT.turnsPerScreen)];
    };
    expect(ORBIT.turnsPerScreen * 2).toBeCloseTo(0.15);
    for (let slot = 0; slot < 6; slot++) {
      const [a, b] = len(slot);
      const o1 = orbitItem(p, slot, 1, 0);
      const o3 = orbitItem(p, slot, 3, 0);
      const b1 = 1 + 0.03 * Math.sin(1.7 + slot * 1.3);
      const b3 = 1 + 0.03 * Math.sin(3 * 1.7 + slot * 1.3);
      expect(o1.x).toBeCloseTo(a[0] * b1, 6);
      expect(o3.x).toBeCloseTo(b[0] * b3, 6);
    }
    const settled = orbitItem(p, 2, 4, 0);
    const flung = orbitItem(p, 2, 4, 1);
    expect(flung.x / settled.x).toBeCloseTo(ORBIT.exitRadius);
    expect((flung.y - p.cy) / (settled.y - p.cy)).toBeCloseTo(ORBIT.exitRadius);
  });

  it("orbit on portrait phones: studies fade out before they reach the copy, and show above and below it", () => {
    const clear = 104;
    const p = orbitPath(390, 844, clear);
    expect(p.clear).toBe(clear);
    // The top centre slot, landed: fully shown.
    expect(orbitItem(p, 0, 0.5, 0).opacity).toBeCloseTo(1);
    let shown = 0;
    for (let e = 0.5; e <= 4.1; e += 0.05) {
      let now = 0;
      for (let slot = 0; slot < 6; slot++) {
        const o = orbitItem(p, slot, e, 0);
        // Its edge nearest the middle, from the stage's centre line: never within 4px of the copy's band while it shows at all, whole once 52px clear.
        const edge = Math.abs(o.y) - p.sizes[slot] / 2;
        if (edge < clear + 4) expect(o.opacity).toBe(0);
        if (edge > clear + 52) expect(o.opacity).toBeCloseTo(o.arrive, 6);
        if (o.opacity > 0.9) now++;
      }
      // At least two studies are always whole, above and below the copy.
      expect(now).toBeGreaterThanOrEqual(2);
      shown += now;
    }
    expect(shown / 73).toBeGreaterThan(2.5);
    // Without a measured copy it falls back to hiding the middles of the sides.
    const bare = orbitPath(390, 844);
    for (let e = 0.5; e <= 4.1; e += 0.05) {
      for (let slot = 0; slot < 6; slot++) {
        const [, y0] = pathAt(bare, ORBIT_SLOTS[slot].u + e * ORBIT.turnsPerScreen);
        if (Math.abs(y0 - bare.cy) / bare.ry < 0.45) expect(orbitItem(bare, slot, e, 0).opacity).toBe(0);
      }
    }
    // Wide screens never fade them, whatever the copy.
    const wide = orbitPath(VW, VH, 200);
    for (let slot = 0; slot < 6; slot++) expect(orbitItem(wide, slot, 2, 0).opacity).toBeCloseTo(1);
  });

  it("intro copy is at the centre exactly while its lines are: none before the first rises, none after the last leaves, no dip at the handover", () => {
    const { copyIn } = introPhases(2);
    expect(introCopy(-1, copyIn)).toBe(0);
    expect(introCopy(copyIn[0] - 0.9, copyIn)).toBe(0);
    expect(introCopy(copyIn[0] - 0.6, copyIn)).toBe(1);
    expect(introCopy(copyIn[1] + 1.2, copyIn)).toBe(1);
    // It reads the unclamped progress, so it finishes after the stage releases (e stops at 4.1) instead of holding half way.
    const { sectionVh, exitStart } = introPhases(2);
    expect(introProgress(1 + copyIn[1] + 1.5, sectionVh / 100, exitStart).e).toBeCloseTo(4.1);
    expect(introCopy(introProgress(1 + copyIn[1] + 1.5, sectionVh / 100, exitStart).raw, copyIn)).toBeCloseTo(0, 9);
    for (let e = -1; e <= 4.1; e += 0.01) {
      const c = introCopy(e, copyIn);
      // Seven lines a paragraph, the most a phone sets.
      const ys = copyIn.flatMap((n) => Array.from({ length: 7 }, (_, j) => introLine(e, n, j)));
      // Any line showing at all, and there is copy; every line of a paragraph at rest, and it is all there.
      if (ys.some((y) => Math.abs(y) < MASK)) expect(c).toBeGreaterThan(0);
      if (copyIn.some((n) => Array.from({ length: 7 }, (_, j) => introLine(e, n, j)).every((y) => y === 0))) expect(c).toBe(1);
      // Through the handover the centre is never bare.
      if (e > copyIn[0] && e < copyIn[1]) expect(c).toBe(1);
      // Whole before the first line is a third out of its mask, so the studies have gone before any text can be read.
      if (e < copyIn[0] && introLine(e, copyIn[0], 0) < MASK * (2 / 3)) expect(c).toBe(1);
      // And it holds until the last paragraph's lines are at least half way out of their masks.
      if (e > copyIn[1] && ys.some((y) => y > -MASK / 2 && y <= 0)) expect(c).toBe(1);
    }
  });

  it("orbit on portrait screens: with no copy at the centre the whole ring shows, and it gives way only while copy is there", () => {
    const { copyIn } = introPhases(2);
    for (const [vw, vh] of [
      [390, 844],
      [360, 740],
      [820, 1180],
    ] as const) {
      const p = orbitPath(vw, vh, 104);
      // Landing on the bare sheet, before the first line rises: all six, nothing held back.
      expect(introCopy(0.08, copyIn)).toBe(0);
      for (let slot = 0; slot < 6; slot++) {
        const o = orbitItem(p, slot, 0.08, 0, introCopy(0.08, copyIn));
        expect(o.opacity).toBe(o.arrive);
        expect(o.opacity).toBeGreaterThan(0.8);
      }
      for (let e = -1; e <= 4.1; e += 0.02) {
        const copy = introCopy(e, copyIn);
        for (let slot = 0; slot < 6; slot++) {
          const o = orbitItem(p, slot, e, 0, copy);
          // Over the copy's band a study shows only as much as the copy has gone.
          if (Math.abs(o.y) - p.sizes[slot] / 2 < p.clear + 4) expect(o.opacity).toBeLessThanOrEqual(o.arrive * (1 - copy) + 1e-9);
        }
      }
    }
  });

  it("orbit at rest keeps clear of the stage's bottom edge at every size, so the edge fade changes nothing until the fling", () => {
    for (const [vw, vh] of [
      [1440, 900],
      [1280, 720],
      [1024, 768],
      [2560, 1440],
      [820, 1180],
      [390, 844],
      [360, 740],
    ] as const) {
      const p = orbitPath(vw, vh, 104);
      for (let e = 0.5; e <= 4.1; e += 0.02) {
        for (let slot = 0; slot < 6; slot++) {
          const o = orbitItem(p, slot, e, 0, 0);
          expect(o.y + p.sizes[slot] / 2).toBeLessThan(vh / 2 - ORBIT_EDGE_FADE);
          expect(o.opacity).toBe(o.arrive);
          expect(o.opacity).toBeGreaterThan(0.99);
        }
      }
    }
  });

  it("orbit fling: a study is gone before it reaches the stage's bottom edge, which crosses mid-screen once the stage releases", () => {
    const { sectionVh, exitStart } = introPhases(2);
    for (const [vw, vh] of [
      [1440, 900],
      [1280, 720],
      [820, 1180],
      [390, 844],
      [360, 740],
    ] as const) {
      const p = orbitPath(vw, vh, 104);
      let faded = 0;
      for (let raw = exitStart; raw <= exitStart + ORBIT.exitVh + 0.3; raw += 0.01) {
        const { e, exit } = introProgress(raw + 1, sectionVh / 100, exitStart);
        for (let slot = 0; slot < 6; slot++) {
          const o = orbitItem(p, slot, e, exit, 0);
          const bottom = o.y + p.sizes[slot] / 2;
          // Never cut by the stage's clip: whatever still shows is wholly above it.
          if (o.opacity > 0) expect(bottom).toBeLessThan(vh / 2);
          if (bottom > vh / 2 - 10 && bottom < vh / 2) faded++;
        }
      }
      // And it is the lower studies that meet it, at every size.
      expect(faded).toBeGreaterThan(0);
    }
    // The upper studies are flung out whole: no edge fade on the top centre one.
    const p = orbitPath(VW, VH);
    expect(orbitItem(p, 0, 0, 0.6, 0).opacity).toBeCloseTo(1);
  });

  it("orbit on a phone with its toolbar showing: the ring fits the 100svh stage, and the sheet's timing stays in screens", () => {
    // 100lvh 844, 100svh 744.
    const stage = orbitPath(390, 744, 104, 844);
    expect(stage.h).toBe(744);
    expect(stage.vh).toBe(844);
    expect(stage.ry).toBeLessThan(orbitPath(390, 844, 104).ry);
    for (let e = 0.5; e <= 4.1; e += 0.02) {
      for (let slot = 0; slot < 6; slot++) {
        const o = orbitItem(stage, slot, e, 0, 0);
        const half = stage.sizes[slot] / 2;
        // Below the 80px header bar, above the two-line caption at the foot of the stage.
        expect(o.y - half).toBeGreaterThan(-744 / 2 + 80);
        expect(o.y + half).toBeLessThan(744 / 2 - 60);
      }
    }
    // The sheet still rises a screen (lvh) at a time: a study wholly in the part it has uncovered is already more than half way in, and one still a third of a screen under it has not started.
    for (let e = -1; e <= 0; e += 0.01) {
      // The screen's bottom edge, in the stage's coordinates: the stage's top is −e screens down the screen.
      const uncovered = (1 + e) * 844 - 744 / 2;
      for (let slot = 0; slot < 6; slot++) {
        const o = orbitItem(stage, slot, e, 0);
        const half = stage.sizes[slot] / 2;
        const [, y0] = pathAt(stage, ORBIT_SLOTS[slot].u + e * ORBIT.turnsPerScreen);
        if (o.y + half < uncovered && o.y - half > -744 / 2) expect(o.arrive).toBeGreaterThan(0.5);
        if (y0 - half > uncovered + 0.3 * 844) expect(o.arrive).toBe(0);
      }
    }
  });

  it("intro lines rise in, hold composed and leave upward, without fading", () => {
    expect(introLine(0, 1, 0)).toBe(120);
    expect(introLine(0.85, 1, 0)).toBe(0);
    expect(introLine(1.85, 1, 0)).toBe(0);
    expect(introLine(2.2, 1, 0)).toBe(-120);
    // A five-line paragraph is composed (every line at rest) for 0.8 screens, a seven-line one for 0.7.
    const composed = (lines: number) => {
      let span = 0;
      for (let e = 0; e <= 3; e += 0.005) if (Array.from({ length: lines }, (_, j) => introLine(e, 1, j)).every((y) => y === 0)) span += 0.005;
      return span;
    };
    expect(composed(5)).toBeCloseTo(0.8, 1);
    expect(composed(7)).toBeCloseTo(0.7, 1);
  });

  it("intro paragraphs hand over: the second starts rising as the first leaves, with no gap", () => {
    const { copyIn } = introPhases(2);
    // The first paragraph's last line (of 5) is still leaving when the second's first line starts.
    const firstGone = 1.93 + 0.28;
    expect(introLine(copyIn[1] - 0.65, copyIn[1], 0)).toBe(MASK);
    expect(copyIn[1] - 0.65).toBeLessThan(firstGone);
    expect(introLine(firstGone - 0.01, copyIn[0], 4)).toBeGreaterThan(-MASK);
    // And it is fully gone before the second paragraph's lines are halfway up.
    expect(introLine(copyIn[1] - 0.4, copyIn[1], 0)).toBeLessThan(MASK / 2);
    expect(introLine(copyIn[1] - 0.4, copyIn[0], 4)).toBe(-MASK);
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

  it("page ground: cream, stone under Works, cream for Values, then night from the start of Services on", () => {
    // Before Works rises past the middle of the screen.
    expect(pageGround(0.5, -3, -10).color).toBe(CREAM);
    // Works over the whole screen: stone.
    expect(pageGround(1, -3, -10).color).toBe(STONE);
    expect(pageGround(3, -1, -10).color).toBe(STONE);
    // Works' last 0.35 screen hands back to cream, finished as its bottom reaches the top.
    expect(pageGround(4, -0.35, -10).color).toBe(STONE);
    expect(pageGround(5, 0, -10).color).toBe(CREAM);
    // Dusk falls over the first content of Services (sso 0.25 → 0.55) and stays night after it.
    expect(pageGround(10, 6, 0.25)).toEqual({ fade: 0, color: CREAM });
    expect(pageGround(10, 6, 0.55)).toEqual({ fade: 1, color: NIGHT });
    expect(pageGround(10, 6, 4).color).toBe(NIGHT);
    expect(pageGround(10, 6, 0.4).fade).toBeCloseTo(0.5);
  });

  it("the stone ground changes only in two short windows", () => {
    const at = (s: number, h: number) => pageGround(s, h, -10).color;
    for (const [s, h] of [[1.2, -2], [2, -1.5], [3, -0.6]]) expect(at(s, h)).toBe(STONE);
    for (const [s, h] of [[0.2, -4], [6, 0.5], [9, 3]]) expect(at(s, h)).toBe(CREAM);
  });

  it("the header reads the ground until Contact's ivory reaches it, then ivory, never the night behind Contact", () => {
    const night = pageGround(10, 6, 4);
    const dusk = pageGround(10, 6, 0.4);
    // Over Services the header sits on the ground, light on dark once the dusk is past half.
    expect(headerGround(night, 400)).toEqual({ night: true, color: NIGHT });
    expect(headerGround(dusk, 900)).toEqual({ night: dusk.fade > 0.5, color: dusk.color });
    expect(headerGround(pageGround(1, -3, -10), 3000)).toEqual({ night: false, color: STONE });
    // Contact's top at the header's tone line (64px) and above: ivory, not the body's night.
    expect(headerGround(night, 65)).toEqual({ night: true, color: NIGHT });
    expect(headerGround(night, 64)).toEqual({ night: false, color: CREAM });
    expect(headerGround(night, -300)).toEqual({ night: false, color: CREAM });
    expect(headerGround(night, -5000).color).toBe(CREAM);
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
