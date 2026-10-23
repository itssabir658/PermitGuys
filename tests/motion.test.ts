import { describe, expect, it } from "vitest";
import {
  CREAM,
  MASK,
  NIGHT,
  ORBIT,
  ORBIT_EDGE_FADE,
  ORBIT_SLOTS,
  STONE,
  VALUES_CAP,
  WORKS,
  WORKS_BUTTON,
  SERVICES_LEAD,
  SERVICES_META_ON,
  SERVICES_WIPE,
  STORY,
  STORY_LINE_DUR,
  STORY_OVERSHOOT,
  contactCard,
  contactLetter,
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
  riseInset,
  roll,
  servicesHandover,
  servicesHeading,
  servicesHold,
  servicesIndex,
  servicesLead,
  servicesReveal,
  servicesRow,
  storyChapter,
  storyField,
  storyFill,
  storyLine,
  storyLineDraw,
  storyOverlay,
  storySectionVh,
  storySeg,
  storySide,
  storyState,
  swapK,
  swapLayer,
  swapSettle,
  swapTo,
  valuesDescLine,
  valuesImage,
  valuesTitle,
  valuesWordSize,
  worksButton,
  worksLine,
  worksShot,
  type SwapLayer,
} from "@/lib/motion/home";
import { footerDot, footerDraw, footerLift, footerProgress, footerStroke } from "@/lib/motion/footer";
import { clamp, cssEase, damp, ease, fit, fromOklab, mixColorNum, mixColorOklab, smoothstep, toHex, toOklab, tween } from "@/lib/motion/math";
import { WIPE_MS, wipeStep } from "@/lib/motion/wipe";

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
    expect(servicesHeading(0, 0)).toBe(MASK);
    expect(servicesHeading(1, 1)).toBe(0);
    expect(servicesRow(0, 0).y).toBe(MASK);
    expect(servicesRow(1.04, 6).y).toBe(0);
    expect(contactLetter(0, 0)).toBe(MASK);
    expect(contactLetter(1, 6)).toBe(0);
    expect(valuesTitle(-1, 1, 4)).toBe(MASK);
    expect(valuesTitle(0, 1, 4)).toBe(0);
    expect(valuesTitle(1, 1, 4)).toBe(-MASK);
    expect(valuesDescLine(-1, 2, 4, 1)).toBe(MASK);
    expect(valuesDescLine(1, 2, 4, 1)).toBe(-MASK);
    expect(worksLine(-1, 0, 3, 3.2, 0)).toBe(MASK);
    expect(worksLine(0.5, 0, 3, 3.2, 2)).toBe(0);
    expect(worksLine(2, 0, 3, 3.2, 2)).toBe(-MASK);
    expect(introLine(0, 1, 0)).toBe(MASK);
    expect(storyLine(-1, 0, 4, 0)).toBe(MASK);
    expect(storyLine(0.5, 0, 4, 3)).toBe(0);
    expect(storyLine(2, 0, 4, 3)).toBe(-MASK);
    expect(storyField(0, 0)).toBe(MASK);
    expect(storyField(9, 3)).toBe(0);
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
    // Portrait phones size the pictures from the width.
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
    it(`orbit at ${vw}×${vh}: every picture whole on screen and apart from its neighbours, the whole way round`, () => {
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

  it("orbit: pictures glide in from beyond the ring as the sheet uncovers their place, top ones first, never as specks", () => {
    const p = orbitPath(VW, VH);
    const before = orbitItem(p, 0, -1, 0);
    // At e = −1 (the sheet still under the hero) the top centre picture has only begun: near 1.8× the ring, its image still zoomed.
    expect(before.arrive).toBeGreaterThan(0);
    expect(before.arrive).toBeLessThan(0.35);
    expect(before.imgScale).toBeCloseTo(1.18 - 0.18 * before.arrive, 6);
    const [, y0] = pathAt(p, ORBIT_SLOTS[0].u - ORBIT.turnsPerScreen);
    expect((before.y - p.cy) / (y0 - p.cy)).toBeCloseTo((1.8 - 0.8 * before.arrive) * (1 + 0.03 * Math.sin(-1.7)), 6);
    // The bottom centre picture starts later: the sheet uncovers the top of the ring first.
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
          // A picture wholly in view is already more than half way in.
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

  it("orbit: one speed for every picture, and the fling takes the ring out to 1.9×", () => {
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

  it("orbit on portrait phones: pictures fade out before they reach the copy, and show above and below it", () => {
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
      // At least two pictures are always whole, above and below the copy.
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
      // Whole before the first line is a third out of its mask, so the pictures have gone before any text can be read.
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
          // Over the copy's band a picture shows only as much as the copy has gone.
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

  it("orbit fling: a picture is gone before it reaches the stage's bottom edge, which crosses mid-screen once the stage releases", () => {
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
      // And it is the lower pictures that meet it, at every size.
      expect(faded).toBeGreaterThan(0);
    }
    // The upper pictures are flung out whole: no edge fade on the top centre one.
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
    // The sheet still rises a screen (lvh) at a time: a picture wholly in the part it has uncovered is already more than half way in, and one still a third of a screen under it has not started.
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

  /* Works at 1440×900: three 140vh panels, so the stage is pinned for D = 3.2 screens. */
  const D = 3.2;
  const step = D / 3;
  const range = (from: number, to: number, by = 0.005) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by);

  it("works: one project in front at every moment, handed over by a wipe centred on its boundary", () => {
    const shots = (e: number) => [0, 1, 2].map((i) => worksShot(e, i, 3, D));
    // The first picture has risen before the stage pins; the next ones wipe in at the boundaries, half-way exactly there.
    expect(shots(-0.1)[0].inP).toBe(1);
    expect(shots(WORKS.firstIn)[0].inP).toBe(0);
    expect(shots(WORKS.firstIn + WORKS.firstInVh)[0].inP).toBe(1);
    // It starts while the intro's fling is still leaving: before the stage is a screen's quarter from pinning.
    expect(WORKS.firstIn).toBeLessThan(-0.75);
    for (const b of [1, 2]) {
      expect(shots(b * step)[b].inP).toBeCloseTo(0.5);
      expect(shots(b * step)[b - 1].outP).toBeCloseTo(0.5);
      expect(shots(b * step - WORKS.hand / 2)[b].inP).toBe(0);
      expect(shots(b * step + WORKS.hand / 2)[b].inP).toBe(1);
    }
    // In the middle of its moment a project is whole and alone: those before are covered, those after not yet in.
    for (const i of [0, 1, 2]) {
      const s = shots((i + 0.5) * step);
      expect(s[i]).toMatchObject({ inP: 1, outP: 0, live: true });
      s.forEach((o, j) => (j < i ? expect(o.outP).toBe(1) : j > i ? expect(o.inP).toBe(0) : null));
    }
    // Exactly one project is live anywhere on the pinned track, and the last one never leaves.
    for (const e of range(-0.1, D + 1)) {
      if ([1, 2].some((b) => Math.abs(e - b * step) < 1e-6)) continue;
      expect(shots(e).filter((s) => s.live)).toHaveLength(1);
      expect(shots(e)[2].outP).toBe(0);
    }
  });

  it("works pictures drift once across their whole time on screen, never jumping", () => {
    for (const i of [0, 1, 2]) {
      let last = worksShot(-1, i, 3, D).drift;
      for (const e of range(-1, D + 1, 0.01)) {
        const d = worksShot(e, i, 3, D).drift;
        expect(d).toBeGreaterThanOrEqual(last);
        expect(d - last).toBeLessThan(0.05);
        last = d;
      }
      // Still while hidden, moving from the first frame of its wipe.
      expect(worksShot(i === 0 ? WORKS.firstIn : i * step - WORKS.hand / 2, i, 3, D).drift).toBe(0);
    }
    expect(worksShot(step + WORKS.hand / 2, 0, 3, D).drift).toBe(1);
  });

  it("works lines: in place before the stage pins, composed about 0.57 screens per project, and never two lines moving in one row", () => {
    // Eyebrow, two title lines, button: k 0 to 3 (a third title line makes the button k 4).
    const ks = [0, 1, 2, 3];
    for (const k of ks) expect(worksLine(0.1, 0, 3, D, k)).toBe(0);
    for (const i of [0, 1]) {
      const composed = range(i * step - 0.4, (i + 1) * step, 0.002).filter((e) => ks.every((k) => worksLine(e, i, 3, D, k) === 0)).length * 0.002;
      if (i > 0) expect(composed).toBeGreaterThan(0.55);
      expect(composed).toBeLessThan(0.85);
    }
    for (const b of [1, 2]) {
      for (const e of range(b * step - 0.3, b * step + 0.3, 0.002)) {
        for (const k of [0, 1, 2, 3, 4]) {
          // An incoming line on its way up: the outgoing line of its row, and of the row below (whose clip margin reaches into this one), have gone.
          if (worksLine(e, b, 3, D, k) < MASK - 1e-9) {
            expect(worksLine(e, b - 1, 3, D, k)).toBeCloseTo(-MASK);
            expect(worksLine(e, b - 1, 3, D, k + 1)).toBeCloseTo(-MASK);
          }
        }
      }
      // ...yet some text is always on screen through the handover.
      for (const e of range(b * step - 0.3, b * step + 0.3, 0.002)) expect([b - 1, b].some((i) => ks.some((k) => Math.abs(worksLine(e, i, 3, D, k)) < MASK - 1e-9))).toBe(true);
    }
    // The last project's lines stay through the release.
    for (const k of ks) expect(worksLine(D + 1, 2, 3, D, k)).toBe(0);
  });

  it("works button: rolls farther than a line, and its plate never shows as a bare sliver", () => {
    expect(worksButton(0)).toEqual({ y: 0, opacity: 1 });
    expect(worksButton(MASK)).toMatchObject({ y: MASK * WORKS_BUTTON, opacity: 0 });
    expect(worksButton(-MASK).opacity).toBe(0);
    // While no more than the plate's padding shows past the mask's edge (a third of it), the plate is invisible; it is whole a little before it lands.
    const at = (shown: number) => worksButton(((1 - shown) * 100) / WORKS_BUTTON).opacity;
    expect(at(0.33)).toBe(0);
    expect(at(0.75)).toBe(1);
    // It fades evenly both ways, and is all but opaque whenever it takes the pointer (|y| < 0.15 × MASK in HomeMotion).
    let last = 1;
    for (let y = 0; y <= MASK; y += 0.5) {
      const o = worksButton(y).opacity;
      expect(o).toBeLessThanOrEqual(last);
      expect(worksButton(-y).opacity).toBeCloseTo(o);
      if (y < 0.15 * MASK) expect(o).toBeGreaterThan(0.95);
      last = o;
    }
    // With the line timing (two title lines, so the button is k 3): at the handover there is a moment when neither button shows at all.
    const hidden = range(step - 0.3, step + 0.3, 0.002).filter((e) => [0, 1].every((i) => worksButton(worksLine(e, i, 3, D, 3)).opacity === 0)).length * 0.002;
    expect(hidden).toBeGreaterThan(0.05);
  });

  it("values words keep clear of the corner label, below it or beside it, shrinking only as far as they must", () => {
    // 1024×600: the label's block ends 204px down and its text 244px across; the words are centred on 194px, so only beside it will do.
    const label = { bottom: 204, right: 244 };
    const size = valuesWordSize(102, 648, 194, 1024, label);
    expect(size).toBeCloseTo((102 * (1024 - 2 * (244 + 20))) / 648);
    expect(((648 * size) / 102 - 1024) / -2).toBeCloseTo(244 + 20);
    // A narrower word that already clears keeps its size.
    expect(valuesWordSize(102, 450, 194, 1024, label)).toBe(102);
    // 1440×900: the words sit low enough under the label at full size.
    expect(valuesWordSize(145.6, 924, 373, 1440, { bottom: 204, right: 260 })).toBe(145.6);
    // Just too close under it: a little smaller lifts the cap line clear, rather than shrinking to fit beside.
    const near = valuesWordSize(108, 686, 255, 1024, label);
    expect(near).toBeCloseTo((255 - 204 - 20) / VALUES_CAP);
    expect(near).toBeGreaterThan(valuesWordSize(108, 686, 194, 1024, label));
    expect(255 - VALUES_CAP * near).toBeCloseTo(204 + 20);
    // On a phone a few px short of clear, the word gives up only a little.
    expect(valuesWordSize(79.5, 350, 229, 375, { bottom: 186, right: 216 })).toBeCloseTo((229 - 186 - 20) / VALUES_CAP);
    expect(valuesWordSize(79.5, 350, 229, 375, { bottom: 186, right: 216 })).toBeGreaterThan(0.9 * 79.5);
    // Where neither is possible (a short phone), most of the word stays.
    expect(valuesWordSize(60, 330, 150, 375, { bottom: 184, right: 216 })).toBe(36);
  });

  it("values: a word on screen all the way through, each held about 0.6 screens or more", () => {
    // x_i = e − i for the value blocks 100vh apart; e from the first word's arrival to the last one's exit.
    const words = (e: number) => [0, 1, 2, 3].map((i) => valuesTitle(e - i, i, 4));
    for (const e of range(-0.3, 3.3)) expect(words(e).some((y) => Math.abs(y) < MASK)).toBe(true);
    // Never two words composed at once, and every word holds for 0.58 screens or more.
    for (const e of range(-1, 4, 0.002)) expect(words(e).filter((y) => y === 0).length).toBeLessThanOrEqual(1);
    for (const i of [0, 1, 2, 3]) {
      const held = range(i - 1, i + 1, 0.002).filter((e) => valuesTitle(e - i, i, 4) === 0).length * 0.002;
      expect(held).toBeGreaterThan(0.58);
    }
    // The first word rises as the stage comes up; the last has left by sso(services) 0.36, as dusk passes its middle.
    expect(valuesTitle(-0.45, 0, 4)).toBe(MASK);
    expect(valuesTitle(-0.17, 0, 4)).toBe(0);
    expect(valuesTitle(0.2, 3, 4)).toBe(0);
    expect(valuesTitle(0.36, 3, 4)).toBeCloseTo(-MASK);
  });

  it("values words roll like an odometer: the outgoing leads, and the incoming is always a full mask below it", () => {
    for (const i of [0, 1, 2]) {
      for (const x of range(0.3, 0.75, 0.001)) {
        const out = valuesTitle(x, i, 4);
        const inc = valuesTitle(x - 1, i + 1, 4);
        expect(inc - out).toBeGreaterThanOrEqual(MASK - 1e-9);
      }
      // The swap is over in under 0.2 screens, centred on the handover between two pictures (x = 0.5).
      expect(valuesTitle(0.42, i, 4)).toBe(0);
      expect(valuesTitle(0.6 - 1, i + 1, 4)).toBe(0);
      expect(valuesTitle(0.5, i, 4)).toBeLessThan(-MASK / 3);
    }
  });

  it("values descriptions: each line is gone before the next value's line in the same row starts, and leaves before the word", () => {
    for (const i of [0, 1, 2]) {
      for (const x of range(0.3, 0.8, 0.001)) {
        // A line of the next description on its way up: this one's line in that row, and in the row below (whose clip margin reaches into it), have gone.
        for (const k of [0, 1, 2, 3, 4, 5]) {
          if (valuesDescLine(x - 1, i + 1, 4, k) < MASK) for (const j of [k, k + 1]) expect(valuesDescLine(x, i, 4, j)).toBeCloseTo(-MASK);
        }
      }
      // Gone by the middle of the word's roll, so it never lingers under the next word: all six lines of the longest description on a 360px phone.
      for (const k of [0, 1, 2, 3, 4, 5]) expect(valuesDescLine(0.5, i, 4, k)).toBeCloseTo(-MASK);
      // The lines start to leave before the word does, and have all gone when it has.
      expect(valuesDescLine(0.4, i, 4, 0)).toBeLessThan(0);
      expect(valuesTitle(0.4, i, 4)).toBe(0);
      for (const k of [0, 1, 2, 3]) expect(valuesDescLine(0.58, i, 4, k)).toBe(-MASK);
      // A four-line description is composed for half a screen (the first, rising as the stage comes up, for a third).
      const held = range(-1, 1, 0.002).filter((x) => [0, 1, 2, 3].every((k) => valuesDescLine(x, i, 4, k) === 0)).length * 0.002;
      expect(held).toBeGreaterThan(i === 0 ? 0.33 : 0.5);
    }
    // The last description leaves first of all, with dusk falling.
    expect(valuesDescLine(0.32, 3, 4, 3)).toBe(-MASK);
  });

  it("values pictures grow to full size at their moment, never smaller than 0.72, and dim with dusk", () => {
    expect(valuesImage(0, 0)).toEqual({ scale: 1, brightness: 1 });
    expect(valuesImage(0.75, 0).scale).toBe(0.72);
    expect(valuesImage(-2, 0).scale).toBe(0.72);
    expect(valuesImage(0.3, 0).scale).toBeCloseTo(valuesImage(-0.3, 0).scale);
    expect(valuesImage(0, 1).brightness).toBe(0.5);
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
    // Dusk falls quickly as Services comes up (sso 0.24 → 0.46) and stays night after it.
    expect(pageGround(10, 6, 0.24)).toEqual({ fade: 0, color: CREAM });
    expect(pageGround(10, 6, 0.46)).toEqual({ fade: 1, color: NIGHT });
    expect(pageGround(10, 6, 4).color).toBe(NIGHT);
    expect(pageGround(10, 6, 0.35).fade).toBeCloseTo(0.5);
    // The last Values word has gone just as the dusk passes its middle.
    expect(valuesTitle(0.36, 3, 4)).toBeCloseTo(-MASK);
    expect(pageGround(10, 6, 0.36).fade).toBeGreaterThan(0.5);
    expect(pageGround(10, 6, 0.3).fade).toBeLessThan(0.3);
  });

  it("the stone ground changes only in two short windows", () => {
    const at = (s: number, h: number) => pageGround(s, h, -10).color;
    for (const [s, h] of [[1.2, -2], [2, -1.5], [3, -0.6]]) expect(at(s, h)).toBe(STONE);
    for (const [s, h] of [[0.2, -4], [6, 0.5], [9, 3]]) expect(at(s, h)).toBe(CREAM);
  });

  it("the header reads the ground until Contact's ivory reaches it, then ivory, never the night behind Contact", () => {
    const night = pageGround(10, 6, 4);
    const dusk = pageGround(10, 6, 0.35);
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

  it("services picture: its sheet rises from the bottom of the screen as the frame shows, and settles from a zoom", () => {
    expect(servicesReveal(0)).toEqual({ r: 0, scale: 1.2, y: 6 });
    expect(servicesReveal(0.52)).toEqual({ r: 1, scale: 1, y: 0 });
    // An entrance: most of it early, the last of it settling slowly.
    expect(servicesReveal(0.27).r).toBeGreaterThan(0.9);
    for (const x of range(0, 0.6, 0.01)) expect(servicesReveal(x + 0.01).r).toBeGreaterThanOrEqual(servicesReveal(x).r);
    // While the frame's bottom edge is below the screen, the sheet's edge starts at the bottom of the screen and rises to the frame's top.
    const h = 558;
    for (const top of [100, 500, 800, 899]) {
      const edge = (p: number) => top + (riseInset(p, top, h, VH) / 100) * h;
      expect(edge(0)).toBeCloseTo(Math.min(VH, top + h));
      expect(edge(1)).toBeCloseTo(top);
      for (const p of range(0, 0.95, 0.05)) expect(edge(p + 0.05)).toBeLessThan(edge(p));
    }
    // A frame wholly below the screen, or wholly on it.
    expect(riseInset(0, 1000, h, VH)).toBe(0);
    expect(riseInset(0.25, 100, h, VH)).toBeCloseTo(75);
  });

  it("services heading: its lines rise only once the dusk is past half, so ivory type never sits on a pale ground", () => {
    for (const s of range(0, 1.2, 0.01)) {
      if (servicesHeading(s, 0) < MASK) expect(pageGround(10, 6, s).fade).toBeGreaterThan(0.5);
    }
    for (const j of [0, 1, 2]) expect(servicesHeading(0.82, j)).toBe(0);
    // Line by line, 0.06 apart.
    expect(servicesHeading(0.6, 1)).toBeGreaterThan(servicesHeading(0.6, 0));
  });

  it("services rows: a quick cascade, all seven whole the moment the stage pins, and never faded", () => {
    for (let i = 0; i < 7; i++) expect(servicesRow(0.98, i)).toEqual({ t: 1, y: 0, meta: true });
    expect(servicesRow(0.44, 0)).toEqual({ t: 0, y: MASK, meta: false });
    for (const s of range(0.4, 1.1, 0.01)) {
      for (let i = 1; i < 7; i++) {
        // Each row a step behind the one above it: 0.04 of a screen.
        expect(servicesRow(s, i).y).toBeGreaterThanOrEqual(servicesRow(s, i - 1).y);
        expect(servicesRow(s, i).t).toBeCloseTo(servicesRow(s - 0.04, i - 1).t, 9);
      }
      // The number and tag follow the label: they are switched on (and fade in on their own) once it is most of the way up, and off again below that on the way back.
      for (let i = 0; i < 7; i++) expect(servicesRow(s, i).meta).toBe(servicesRow(s, i).t >= SERVICES_META_ON);
    }
  });

  it("services lead: the stage rides 0.3 screen ahead through the dusk and settles into the pin", () => {
    expect(servicesLead(-2)).toBe(SERVICES_LEAD);
    expect(servicesLead(0.4)).toBe(SERVICES_LEAD);
    expect(servicesLead(1)).toBe(0);
    expect(servicesLead(3)).toBe(0);
    // On the screen the stage only ever rises (its top at (1 − s − lead) screens), slowing to a stop as it pins.
    const at = (s: number) => 1 - s - servicesLead(s);
    for (const s of range(-0.5, 1.2, 0.01)) expect(at(s + 0.01)).toBeLessThanOrEqual(at(s) + 1e-12);
    const speed = (s: number) => (at(s - 0.001) - at(s + 0.001)) / 0.002;
    expect(speed(0.2)).toBeCloseTo(1, 5);
    expect(speed(0.7)).toBeCloseTo(0.5, 2);
    expect(speed(0.999)).toBeLessThan(0.01);
  });

  it("services index: the two-screen hold is shared evenly between the rows", () => {
    const top = 14.8 * VH;
    const height = 3 * VH;
    expect(servicesIndex(top - VH, top, height, VH, 7)).toBe(0);
    expect(servicesIndex(top + 2 * VH, top, height, VH, 7)).toBe(6);
    expect(servicesIndex(top + 5 * VH, top, height, VH, 7)).toBe(6);
    for (let k = 0; k < 7; k++) expect(servicesIndex(top + ((k + 0.5) / 7) * 2 * VH, top, height, VH, 7)).toBe(k);
  });

  it("services hold: a hover may choose the picture only while the stage is pinned, not as the list rises or leaves", () => {
    const top = 14.8 * VH;
    const height = 3 * VH;
    expect(servicesHold(top - 1, top, height, VH)).toBe(false);
    expect(servicesHold(top - 0.4 * VH, top, height, VH)).toBe(false);
    expect(servicesHold(top, top, height, VH)).toBe(true);
    expect(servicesHold(top + VH, top, height, VH)).toBe(true);
    expect(servicesHold(top + 2 * VH, top, height, VH)).toBe(true);
    expect(servicesHold(top + 2 * VH + 1, top, height, VH)).toBe(false);
    // Every row's place in the hold (where keyboard focus brings the stage) is inside it.
    for (let k = 0; k < 7; k++) expect(servicesHold(top + ((k + 0.5) / 7) * 2 * VH, top, height, VH)).toBe(true);
    // A track no taller than the screen never holds past its top.
    expect(servicesHold(top + 1, top, VH / 2, VH)).toBe(false);
  });

  it("services swap: the new picture's sheet rises over the last, which darkens under it", () => {
    const start = [{ i: 0, from: 1, t0: 0, dir: 1 as const }];
    const stack = swapTo(start, 3, 10);
    expect(stack.map((l) => l.i)).toEqual([0, 3]);
    expect(swapK(stack[1], 10)).toBe(0);
    expect(swapK(stack[1], 10 + SERVICES_WIPE)).toBe(1);
    expect(swapK(stack[1], 10 + SERVICES_WIPE / 2)).toBeGreaterThan(0.9);
    // Once it is up, the picture under it goes.
    expect(swapSettle(stack, 10.3).map((l) => l.i)).toEqual([0, 3]);
    expect(swapSettle(stack, 10 + SERVICES_WIPE).map((l) => l.i)).toEqual([3]);
    expect(swapLayer(0, 0)).toEqual({ clip: 100, scale: 1.08, brightness: 1 });
    expect(swapLayer(1, 1)).toEqual({ clip: 0, scale: 1, brightness: 0.7 });
    // Asking for the picture already in front changes nothing.
    expect(swapTo(stack, 3, 10.2)).toEqual(stack);
    // Reduced motion: at once.
    expect(swapSettle(swapTo(start, 2, 5, true), 5, true).map((l) => l.i)).toEqual([2]);
  });

  it("services swap: a new row mid-wipe never cuts; the sheet under it keeps rising, and going back slides it down again", () => {
    const start = [{ i: 0, from: 1, t0: 0, dir: 1 as const }];
    const mid = swapTo(swapTo(start, 1, 10), 2, 10.15);
    expect(mid.map((l) => l.i)).toEqual([0, 1, 2]);
    // The interrupted sheet carries on, on its own clock.
    expect(swapK(mid[1], 10.3)).toBeGreaterThan(swapK(mid[1], 10.15));
    expect(swapSettle(mid, 10.15 + SERVICES_WIPE).map((l) => l.i)).toEqual([2]);
    // A hover onto row 1 and straight back to row 0: row 1's sheet slides back down from where it was, uncovering row 0.
    const there = swapTo(start, 1, 10);
    const back = swapTo(there, 0, 10.2);
    expect(back.map((l) => l.i)).toEqual([0, 1]);
    expect(swapK(back[1], 10.2)).toBeCloseTo(swapK(there[1], 10.2));
    expect(swapK(back[1], 10.5)).toBeLessThan(swapK(back[1], 10.2));
    expect(swapSettle(back, 10.2 + SERVICES_WIPE).map((l) => l.i)).toEqual([0]);
    // Whatever the sequence, the bottom of the stack is a whole picture, so the frame never shows through.
    let st: SwapLayer[] = start;
    let t = 20;
    for (const target of [1, 2, 1, 4, 0, 0, 6, 5, 6, 3, 2, 2, 1]) {
      t += 0.05 + (target % 3) * 0.12;
      st = swapSettle(swapTo(st, target, t), t);
      expect(st[0].dir).toBe(1);
      expect(swapK(st[0], t)).toBe(1);
      // In front: the topmost sheet still rising (any above it are sliding back down).
      expect(st.filter((l) => l.dir > 0).pop()?.i).toBe(target);
    }
  });

  it("services to contact: Services sinks 0.35 screen behind the rising sheet and dims to 0.45", () => {
    expect(servicesHandover(0)).toEqual({ lift: 0, opacity: 1 });
    expect(servicesHandover(1).lift).toBe(0.35);
    expect(servicesHandover(1).opacity).toBeCloseTo(0.45);
    expect(servicesHandover(-1)).toEqual({ lift: 0, opacity: 1 });
    expect(servicesHandover(3).lift).toBe(0.35);
  });

  it("contact: the word is cut in letter by letter, left to right, without fading", () => {
    for (let i = 0; i < 7; i++) {
      expect(contactLetter(0.04 + i * 0.03, i)).toBe(MASK);
      expect(contactLetter(0.56, i)).toBe(0);
    }
    for (const s of range(0, 0.6, 0.01)) for (let i = 1; i < 7; i++) expect(contactLetter(s, i)).toBeGreaterThanOrEqual(contactLetter(s, i - 1));
  });

  it("contact cards rise 48px, the block fading in over the first 40%, the right card a beat behind", () => {
    expect(contactCard(0.06, 0)).toEqual({ t: 0, y: 48, opacity: 0, scale: 1.12 });
    expect(contactCard(0.44, 0)).toEqual({ t: 1, y: 0, opacity: 1, scale: 1 });
    expect(contactCard(0.5, 1)).toEqual({ t: 1, y: 0, opacity: 1, scale: 1 });
    for (const s of range(0, 0.6, 0.01)) expect(contactCard(s, 1).t).toBeCloseTo(contactCard(s - 0.06, 0).t, 9);
    // Opaque once its picture's sheet is 40% up.
    const at = range(0.06, 0.44, 0.001).find((s) => contactCard(s, 0).opacity === 1)!;
    expect(contactCard(at, 0).t).toBeCloseTo(0.4, 2);
  });
});

describe("story", () => {
  const range = (from: number, to: number, by = 0.005) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by);
  const n = STORY.chapters;
  const step = STORY.step;
  /** Where the stage releases. */
  const end = n * step;
  const keys = ["sheet", "sketch", "render", "veil", "eng", "paper", "ink", "rectify"] as const;

  it("a chapter takes 1.2 screens, so the section is 580vh: one screen to arrive, then the chapters", () => {
    expect(storySectionVh()).toBe(580);
    expect(storySectionVh(4)).toBe(580);
    expect(storySectionVh(2)).toBe(340);
  });

  it("every state of the drawing runs 0 → 1 once, forwards, and is done before the stage releases", () => {
    const before = storyState(-2);
    for (const k of keys) expect(before[k], k).toBe(0);
    const after = storyState(end);
    for (const k of keys) expect(after[k], k).toBe(1);
    let last = before;
    for (const e of range(-2, end + 1, 0.01)) {
      const st = storyState(e);
      for (const k of keys) expect(st[k], k).toBeGreaterThanOrEqual(last[k]);
      last = st;
    }
  });

  it("each change starts as its chapter's text hands over, and each state is held whole while it is read", () => {
    // The changes start between the outgoing text's first move (0.2 before the boundary) and the boundary.
    for (const [start, i] of [
      [STORY.renderIn, 1],
      [STORY.veilIn, 2],
      [STORY.paperIn, 3],
    ] as const) {
      expect(start).toBeGreaterThanOrEqual(i * step - 0.2);
      expect(start).toBeLessThanOrEqual(i * step);
    }
    // The sketch is whole before the rendering wipes in; the rendering for most of the Design chapter; the engineering before the paper.
    expect(STORY.renderIn - (STORY.sketchIn + STORY.sketchVh)).toBeGreaterThanOrEqual(0.3);
    expect(STORY.veilIn - (STORY.renderIn + STORY.renderVh)).toBeGreaterThanOrEqual(0.6);
    expect(STORY.paperIn - (STORY.engIn + STORY.engVh)).toBeGreaterThanOrEqual(0.3);
    // The engineering is drawn on the trace once it is mostly up, and the ink is back before the lines straighten.
    expect(storyState(STORY.engIn).veil).toBeGreaterThan(0.5);
    expect(STORY.rectifyIn).toBeGreaterThan(STORY.inkIn);
    expect(storyState(STORY.rectifyIn + 0.02).ink).toBeGreaterThan(0.25);
    // The finished sheet holds for half a screen before the release.
    expect(end - (STORY.rectifyIn + STORY.rectifyVh)).toBeGreaterThanOrEqual(0.5);
    expect(end - (STORY.fieldsIn + 3 * WORKS.stagger + 0.26)).toBeGreaterThanOrEqual(0.5);
    // The sheet is up before the sketch is more than started, and the sketch begins while the stage is still arriving.
    expect(storyState(STORY.sketchIn + 0.12).sheet).toBeGreaterThan(0.95);
    expect(STORY.sketchIn).toBeLessThan(0);
  });

  it("the contents follow the text: a chapter turns over just before its boundary and each bar fills across its chapter", () => {
    expect(storyChapter(-1)).toBe(0);
    expect(storyChapter(step - 0.06)).toBe(0);
    expect(storyChapter(step - 0.04)).toBe(1);
    expect(storyChapter(2 * step)).toBe(2);
    expect(storyChapter(3 * step + 0.5)).toBe(3);
    expect(storyChapter(99)).toBe(3);
    for (let i = 0; i < n; i++) {
      expect(storyFill(i * step, i)).toBe(0);
      expect(storyFill((i + 0.5) * step, i)).toBeCloseTo(0.5);
      expect(storyFill((i + 1) * step, i)).toBeCloseTo(1, 9);
    }
  });

  it("the sketch draws its lines one after another, the first from the start and the last by the end", () => {
    const lines = 145;
    expect(storyLineDraw(0, 0, lines)).toBe(0);
    expect(storyLineDraw(STORY_LINE_DUR, 0, lines)).toBe(1);
    expect(storyLineDraw(1 - STORY_LINE_DUR, lines - 1, lines)).toBe(0);
    expect(storyLineDraw(1, lines - 1, lines)).toBe(1);
    for (const t of range(0, 1, 0.01)) for (let i = 1; i < lines; i += 12) expect(storyLineDraw(t, i, lines)).toBeLessThanOrEqual(storyLineDraw(t, i - 1, lines));
    // A single line takes the whole sketch's first share.
    expect(storyLineDraw(STORY_LINE_DUR, 0, 1)).toBe(1);
  });

  it("a line runs past its ends while sketched, draws from its first end, and moves from the picture to the sheet", () => {
    const p = [100, 200, 500, 200] as const;
    const q = [300, 400, 300, 900] as const;
    expect(storySeg(p, q, 0, 0, 1)).toEqual([100, 200, 500, 200]);
    expect(storySeg(p, q, 1, 0, 1)).toEqual([300, 400, 300, 900]);
    expect(storySeg(p, q, 0.5, 0, 1)).toEqual([200, 300, 400, 550]);
    // Half drawn: from its first end to its middle.
    expect(storySeg(p, q, 0, 0, 0.5)).toEqual([100, 200, 300, 200]);
    expect(storySeg(p, q, 0, 0, 0)).toEqual([100, 200, 100, 200]);
    // The overshoot: STORY_OVERSHOOT past each end, or a quarter of a short line.
    expect(storySeg(p, q, 0, STORY_OVERSHOOT, 1)).toEqual([100 - STORY_OVERSHOOT, 200, 500 + STORY_OVERSHOOT, 200]);
    expect(storySeg([0, 0, 0, 40], [0, 0, 0, 40], 0, STORY_OVERSHOOT, 1)).toEqual([0, -10, 0, 50]);
    // A point stays a point.
    expect(storySeg([5, 5, 5, 5], [5, 5, 5, 5], 0, STORY_OVERSHOOT, 1)).toEqual([5, 5, 5, 5]);
  });

  it("the engineering is drawn grid first, then the levels, then the structure round its outline, labels behind", () => {
    const none = storyOverlay(0, 7);
    expect([...none.grid, ...none.bubbles, ...none.levels, ...none.levelLabels, ...none.members, none.memberLabels].every((v) => v === 0)).toBe(true);
    const done = storyOverlay(1, 7);
    expect([...done.grid, ...done.bubbles, ...done.levels, ...done.levelLabels, ...done.members, done.memberLabels].every((v) => v === 1)).toBe(true);
    for (const t of range(0, 1, 0.01)) {
      const o = storyOverlay(t, 7);
      for (let i = 1; i < 3; i++) expect(o.grid[i]).toBeLessThanOrEqual(o.grid[i - 1]);
      for (let i = 1; i < 4; i++) expect(o.levels[i]).toBeLessThanOrEqual(o.levels[i - 1]);
      for (let k = 1; k < 7; k++) expect(o.members[k]).toBeLessThanOrEqual(o.members[k - 1]);
      // A level starts once the grid is under way, and the structure once the levels are.
      if (o.levels[0] > 0) expect(o.grid[0]).toBeGreaterThan(0.3);
      if (o.members[0] > 0) expect(o.levels[3]).toBeGreaterThan(0.3);
    }
    // A member's sides draw one after another, round its outline.
    expect([0, 1, 2, 3].map((s) => storySide(0, s))).toEqual([0, 0, 0, 0]);
    expect([0, 1, 2, 3].map((s) => storySide(0.5, s))).toEqual([1, 1, 0, 0]);
    expect([0, 1, 2, 3].map((s) => storySide(0.625, s))).toEqual([1, 1, 0.5, 0]);
    expect([0, 1, 2, 3].map((s) => storySide(1, s))).toEqual([1, 1, 1, 1]);
  });

  it("chapter text: composed for 0.6 screens or more, two chapters' lines never moving in one rank, and never an empty column", () => {
    // Label, two title lines and up to four body lines: k 0 to 6.
    const ks = [0, 1, 2, 3, 4, 5, 6];
    for (let i = 0; i < n; i++) {
      const composed = range(i * step - 0.5, (i + 1) * step, 0.002).filter((e) => ks.every((k) => storyLine(e, i, n, k) === 0)).length * 0.002;
      expect(composed, `chapter ${i}`).toBeGreaterThanOrEqual(0.6);
    }
    // The first chapter is in place as the stage pins (give or take a tenth of a screen); the last never leaves.
    for (const k of ks) expect(storyLine(0.12, 0, n, k)).toBe(0);
    for (const k of ks) expect(storyLine(end + 1, n - 1, n, k)).toBe(0);
    for (let b = 1; b < n; b++) {
      const at = b * step;
      for (const e of range(at - 0.3, at + 0.5, 0.002)) {
        for (const k of ks) {
          // An incoming line on its way up: the outgoing line of its rank, and of the next (whose clip margin reaches into it), have gone.
          if (storyLine(e, b, n, k) < MASK - 1e-9) {
            expect(storyLine(e, b - 1, n, k)).toBeCloseTo(-MASK);
            expect(storyLine(e, b - 1, n, k + 1)).toBeCloseTo(-MASK);
          }
        }
        // Some text is always on screen through the handover.
        expect([b - 1, b].some((i) => ks.some((k) => Math.abs(storyLine(e, i, n, k)) < MASK - 1e-9))).toBe(true);
      }
    }
  });

  it("the title block's values roll in one after another as the drawing finishes straightening", () => {
    for (let k = 0; k < 4; k++) {
      expect(storyField(STORY.fieldsIn + k * WORKS.stagger, k)).toBe(MASK);
      expect(storyField(STORY.fieldsIn + k * WORKS.stagger + 0.26, k)).toBe(0);
    }
    expect(storyState(STORY.fieldsIn).rectify).toBeGreaterThan(0.5);
  });
});

describe("footer", () => {
  const range = (from: number, to: number, by: number) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by);
  // At 1440×900: a footer 1000px tall at the end of the page.
  const top = 20000;
  const height = 1000;
  const end = top + height;

  it("comes up 0 → 1 from its top at the bottom of the screen until it fills it, or until the page ends", () => {
    expect(footerProgress(top - VH, VH, top, height, end)).toBe(0);
    expect(footerProgress(top, VH, top, height, end)).toBe(1);
    // A short footer at the end of the page: 1 at the last scroll position.
    expect(footerProgress(top + 700 - VH, VH, top, 700, top + 700)).toBe(1);
    expect(footerProgress(top + 350 - VH, VH, top, 700, top + 700)).toBeCloseTo(0.5);
    // A short page whose footer is on screen at the top still reaches 1 at its end.
    expect(footerProgress(200, VH, 600, 500, 1100)).toBe(1);
    expect(footerProgress(0, VH, 600, 500, 1100)).toBeCloseTo(0.6);
  });

  it("its content rises out from under the sheet above, in place at 1 and never more than 0.3 screen", () => {
    expect(footerLift(0, 756, VH)).toBeCloseTo(-0.3 * 756);
    expect(footerLift(1, 756, VH)).toBeCloseTo(0);
    expect(footerLift(0, 1600, 844)).toBeCloseTo(-0.3 * 844);
    expect(footerLift(2, 1600, 844)).toBeCloseTo(0);
  });

  it("the outline draws while it is on screen, mainland first, the GTA dot landing last", () => {
    // Outline 360px tall, its top 112px into the footer.
    const mt = top + 112;
    expect(footerDraw(mt - VH, VH, mt, 360, end)).toBe(0);
    expect(footerDraw(mt + 360 + 0.3 * VH - VH, VH, mt, 360, end)).toBeCloseTo(1);
    // On a phone, where the footer is taller than the screen, it is drawn before it leaves the top.
    const phone = footerDraw(mt + 360 - 844 + 0.3 * 844, 844, mt, 360, top + 1600);
    expect(phone).toBe(1);
    // Near the end of a short page it is drawn by the last scroll position.
    expect(footerDraw(end - VH, VH, end - 300, 360, end)).toBe(1);
    for (let i = 0; i < 5; i++) {
      expect(footerStroke(0, i)).toBe(1);
      expect(footerStroke(1, i)).toBe(0);
      if (i) for (const d of range(0, 1, 0.02)) expect(footerStroke(d, i)).toBeGreaterThanOrEqual(footerStroke(d, i - 1));
    }
    expect(footerDot(0.7)).toBe(0);
    expect(footerDot(0.9)).toBe(1);
    // The dot lands after the mainland is drawn.
    expect(footerStroke(0.7, 0)).toBeLessThan(0.05);
  });
});

describe("link button fill", () => {
  it("runs across the plate on hover and leaves forwards, its near edge chasing the far one", () => {
    expect(wipeStep({ a: 0, b: 0 }, true)).toEqual({ a: 0, b: 100, ms: WIPE_MS });
    expect(wipeStep({ a: 0, b: 100 }, false)).toEqual({ a: 100, b: 100, ms: WIPE_MS });
    // Nothing to do where it already rests.
    expect(wipeStep({ a: 0, b: 100 }, true)).toBeNull();
    expect(wipeStep({ a: 0, b: 0 }, false)).toBeNull();
  });

  it("a pointer that only passes over leaves a sliver that runs out ahead, never one that jumps to the far edge", () => {
    // Left 11% of the way in: the far edge stays where it is and the near edge runs up to it.
    const out = wipeStep({ a: 0, b: 11 }, false);
    expect(out).toMatchObject({ a: 11, b: 11 });
    // A short way takes a short time, a third of a full run at least.
    expect(out?.ms).toBe(Math.round(WIPE_MS / 3));
    const half = wipeStep({ a: 0, b: 60 }, false);
    expect(half?.ms).toBe(Math.round(WIPE_MS * 0.6));
  });

  it("coming back while the fill leaves turns it round from where it is", () => {
    // Leaving, its near edge 70% across: the band grows back from that edge to the whole plate.
    const back = wipeStep({ a: 70, b: 100 }, true);
    expect(back).toMatchObject({ a: 0, b: 100 });
    expect(back?.ms).toBe(Math.round(WIPE_MS * 0.7));
    // Leaving a partial fill and coming back: both edges run out to the plate's.
    expect(wipeStep({ a: 30, b: 50 }, true)).toMatchObject({ a: 0, b: 100, ms: Math.round(WIPE_MS * 0.5) });
  });
});
