"use client";

import { useEffect } from "react";
import { ORDER, engine, hso, measureRange, setStyle, sso, type Frame, type MotionModule, type Range } from "@/lib/motion/engine";
import {
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
  riseInset,
  servicesHandover,
  servicesHeading,
  servicesIndex,
  servicesLead,
  servicesReveal,
  servicesRow,
  swapK,
  swapLayer,
  swapSettle,
  swapTo,
  MASK,
  roll,
  valuesDescLine,
  valuesImage,
  valuesTitle,
  valuesWordSize,
  worksButton,
  worksLine,
  worksStudy,
  type OrbitPath,
  type SwapLayer,
} from "@/lib/motion/home";
import { clamp, ease, mix, toHex, tween } from "@/lib/motion/math";
import { resplitIfNeeded, unsplit } from "@/lib/motion/split";

/*
 * Drives the homepage from the scroll engine (docs/MOTION.md). Renders
 * nothing: it finds the sections by their data attributes and registers one
 * module per section, in the reference's order. Each module is a pure
 * function of the scroll position, so the page plays backwards exactly on
 * the way up. Without the tracks (reduced motion, short screens) the
 * modules clear their styles and the sections show their still layouts.
 */

const one = (sel: string, root: ParentNode = document) => root.querySelector<HTMLElement>(sel);
const all = (sel: string, root: ParentNode = document) => [...root.querySelectorAll<HTMLElement>(sel)];
const px = (n: number) => `${n.toFixed(2)}px`;
const num = (n: number) => n.toFixed(4);
const lift = (y: number) => `translate3d(0, ${px(y)}, 0)`;
const liftPercent = (y: number) => `translate3d(0, ${y.toFixed(2)}%, 0)`;
/** A masked line parked below its mask, hidden. */
const PARKED = liftPercent(MASK);

function clear(el: HTMLElement, ...props: string[]) {
  for (const p of props) setStyle(el, p, "");
}

/** The right edge of an element's text (not its box), in px from the screen's left. */
function textRight(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().right;
}

interface Shared {
  /** How far the page ground has turned to night, 0–1; Values dims its pictures by it. */
  fade: number;
}

/*
 * The page ground, one material per section (pageGround): cream, stone under
 * Works, cream for Values, dusk over the start of Services, night from there
 * on (Contact brings its own ivory, the footer its own charcoal). The colour
 * under the header (headerGround) goes to the phone header bar as --ground,
 * written on the bar itself: the property does not inherit (globals.css), so
 * a change restyles that one element, not the whole document. The still
 * layout keeps the stylesheet's grounds: ivory, then Services' own charcoal.
 */
function ground(shared: Shared): MotionModule | null {
  const works = one("[data-works]");
  const services = one("[data-services]");
  const contact = one("[data-contact]");
  if (!works || !services || !contact) return null;
  const html = document.documentElement;
  const bar = one(".site-nav__bar");
  let rWorks: Range, rServices: Range, rContact: Range;
  let night = false;
  const setNight = (isNight: boolean) => {
    if (isNight === night) return;
    night = isNight;
    if (night) html.dataset.ground = "night";
    else delete html.dataset.ground;
  };
  return {
    order: ORDER.ground,
    measure() {
      rWorks = measureRange(works);
      rServices = measureRange(services);
      rContact = measureRange(contact);
    },
    update(f) {
      if (!f.tracks) {
        setStyle(document.body, "backgroundColor", "");
        if (bar) setStyle(bar, "--ground", "");
        setStyle(services, "backgroundColor", "");
        shared.fade = 0;
        setNight(false);
        return;
      }
      const g = pageGround(sso(rWorks, f), hso(rWorks, f), sso(rServices, f));
      shared.fade = g.fade;
      setStyle(document.body, "backgroundColor", toHex(g.color));
      // On the tracks Services shows the night ground through itself.
      setStyle(services, "backgroundColor", "transparent");
      // Night until Contact's ivory reaches the header, and ivory under the header from then on.
      const h = headerGround(g, rContact.top - f.scroll);
      if (bar) setStyle(bar, "--ground", toHex(h.color));
      setNight(h.night);
    },
    destroy() {
      setStyle(document.body, "backgroundColor", "");
      if (bar) setStyle(bar, "--ground", "");
      setStyle(services, "backgroundColor", "");
      delete html.dataset.ground;
    },
  };
}

/* Hero: the statement and the name leave upward through their masks while the picture recedes under the intro's sheet. */
function hero(): MotionModule | null {
  const section = one("[data-home-hero]");
  const heading = one("[data-hero-heading]");
  const image = one("[data-hero-image]");
  const dim = one("[data-hero-dim]");
  const fig = one(".hero-fig");
  if (!section || !heading || !image || !dim || !fig) return null;
  // The name first, then the two statement lines.
  const [name, ...subs] = all("[data-hero-roll]", section);
  let r: Range;
  return {
    order: ORDER.hero,
    measure() {
      r = measureRange(section);
    },
    update(f) {
      if (!f.tracks) {
        clear(heading, "transform");
        [name, ...subs].forEach((el) => el && clear(el, "transform"));
        clear(fig, "opacity");
        clear(image, "transform");
        clear(dim, "opacity");
        return;
      }
      const s = heroState(f.scroll, r.top, f.vh);
      setStyle(heading, "transform", lift(s.headingY));
      if (name) setStyle(name, "transform", liftPercent(s.nameRoll));
      subs.forEach((el, i) => setStyle(el, "transform", liftPercent(s.subRoll[i] ?? 0)));
      setStyle(fig, "opacity", num(s.figOpacity));
      setStyle(image, "transform", `translate3d(0, ${px(s.imageY)}, 0) scale(${num(s.imageScale)})`);
      setStyle(dim, "opacity", num(s.dim));
    },
  };
}

/* Intro: six studies travel one squircle path around the centre while two paragraphs pass through it. */
function intro(): MotionModule | null {
  const section = one("[data-intro]");
  if (!section) return null;
  const stage = one("[data-intro-stage]", section);
  const items = all("[data-orbit-slot]", section).map((el) => ({ el, slot: Number(el.dataset.orbitSlot), img: one("[data-orbit-img]", el) }));
  const copies = all("[data-intro-copy]", section);
  const caption = one("[data-intro-caption]", section);
  const { copyIn, exitStart, sectionVh } = introPhases(copies.length);
  let r: Range;
  let path: OrbitPath;
  let lines: HTMLElement[][] = copies.map(() => []);
  return {
    order: ORDER.intro,
    measure(f) {
      r = measureRange(section);
      if (f.tracks) lines = copies.map((c, i) => resplitIfNeeded(c, lines[i]));
      else if (lines.some((l) => l.length)) {
        copies.forEach(unsplit);
        lines = copies.map(() => []);
      }
      // The ring and the image sizes follow the stage (100svh, so a phone's toolbar does not push the ring under the header or the caption); rebuilt only here, so a resize re-spaces the ring. Portrait screens keep the studies clear of the taller paragraph.
      const copyHalf = copies.reduce((m, c) => Math.max(m, c.offsetHeight / 2), 0);
      path = orbitPath(f.vw, (f.tracks && stage?.offsetHeight) || f.vh, copyHalf, f.vh);
      for (const it of items) setStyle(it.el, "--size", f.tracks ? px(path.sizes[it.slot] ?? 0) : "");
    },
    update(f) {
      // Without the tracks the studies sit in a row under the paragraphs (globals.css), untouched.
      if (!f.tracks) {
        for (const it of items) {
          clear(it.el, "transform", "opacity");
          if (it.img) clear(it.img, "transform");
        }
        lines.forEach((ls) => ls.forEach((line) => clear(line, "transform", "opacity")));
        if (caption) clear(caption, "opacity");
        return;
      }
      const { e, exit, raw } = introProgress(sso(r, f), sectionVh / 100, exitStart);
      const copy = introCopy(raw, copyIn);
      let ring = 0;
      for (const it of items) {
        const o = orbitItem(path, it.slot, e, exit, copy);
        setStyle(it.el, "transform", `translate(-50%, -50%) translate3d(${px(o.x)}, ${px(o.y)}, 0)`);
        setStyle(it.el, "opacity", num(o.opacity));
        if (it.img) setStyle(it.img, "transform", `scale(${num(o.imgScale)})`);
        ring = Math.max(ring, o.arrive);
      }
      // The caption is there whenever any study is, and leaves with them.
      if (caption) setStyle(caption, "opacity", num(Math.min(ring, 1 - exit)));
      // Display type never fades: each line only rolls through its mask.
      lines.forEach((ls, i) =>
        ls.forEach((line, j) => {
          setStyle(line, "transform", liftPercent(introLine(e, copyIn[i], j)));
          setStyle(line, "opacity", "1");
        }),
      );
    },
  };
}

/*
 * A section label (its heading and note, each one mask) rolls in over 0.3
 * screens from `from` (the section's showScreenOffset) as its stage comes
 * up, and leaves with the released stage.
 */
function labelRoll(labels: HTMLElement[], r: Range, f: Frame, from: number) {
  const y = roll(tween(sso(r, f), from, 0.3, ease.power3Out), 0);
  for (const el of labels) setStyle(el, "transform", liftPercent(y));
}

/*
 * Works: a pinned viewer. One frame holds the three pictures; at each
 * handover the next wipes up from the bottom over the last, which dims as
 * it is covered, and the lines roll through their masks: eyebrow, title
 * lines, button. The first picture rises from the bottom of the screen
 * while the stage is still arriving, so it overlaps the intro's fling.
 */
function works(): MotionModule | null {
  const section = one("[data-works]");
  const stage = section && one("[data-works-stage]", section);
  const frame = section && one("[data-works-frame]", section);
  if (!section || !stage || !frame) return null;
  const shots = all("[data-works-shot]", section).map((el) => ({ el, img: one("img", el) }));
  const items = all("[data-works-item]", section).map((item) => {
    const [eyebrow, button] = all("[data-works-roll]", item);
    return { eyebrow, button, title: one("[data-works-title]", item)!, link: one("a", item) };
  });
  const labels = all("[data-label-roll]", section);
  // The corner label's block (its Container), in the same sticky screen as the stage.
  const label = one("h2", section)?.parentElement ?? null;
  const n = items.length;
  let r: Range;
  /** Screens the stage stays pinned (the section's height − 1 screen), shared by the studies. */
  let D = 1;
  let stageH = 0;
  let frameTop = 0;
  let frameH = 0;
  let titleLines: HTMLElement[][] = items.map(() => []);
  // Keyboard: focusing a study's button scrolls to the middle of its moment, where it is composed. Only keyboard focus: a press focuses the link too, and must not move the page under the pointer.
  const onFocus = (event: FocusEvent) => {
    if (!(event.target instanceof Element) || !event.target.matches(":focus-visible")) return;
    const i = items.findIndex((it) => it.button?.contains(event.target as Node));
    if (i >= 0 && r && engine.frame.tracks) engine.scrollTo(r.top + (i + 0.5) * (D / n) * engine.frame.vh);
  };
  section.addEventListener("focusin", onFocus);
  return {
    order: ORDER.works,
    measure(f) {
      r = measureRange(section);
      D = Math.max(0.5, r.height / f.vh - 1);
      stageH = stage.offsetHeight;
      frameTop = frame.offsetTop;
      frameH = frame.offsetHeight;
      // Where the label ends, so the text beside the frame keeps below it on short screens (globals.css, .works-items).
      setStyle(stage, "--works-label-b", f.tracks && label ? px(label.offsetTop + label.offsetHeight) : "");
      if (f.tracks) titleLines = items.map((it, i) => resplitIfNeeded(it.title, titleLines[i]));
      else if (titleLines.some((l) => l.length)) {
        items.forEach((it) => unsplit(it.title));
        titleLines = items.map(() => []);
      }
    },
    update(f) {
      if (!f.tracks) {
        labels.forEach((el) => clear(el, "transform"));
        for (const s of shots) {
          clear(s.el, "clipPath");
          if (s.img) clear(s.img, "transform", "filter");
        }
        for (const it of items) {
          [it.eyebrow, it.button].forEach((el) => el && clear(el, "transform"));
          if (it.button) clear(it.button, "opacity");
          if (it.link) clear(it.link, "pointerEvents");
        }
        return;
      }
      // With the first picture, under the end of the intro's fling.
      labelRoll(labels, r, f, 0.3);
      const e = sso(r, f) - 1;
      // Where the frame is on the screen: the stage rides with the section until it pins, and after it releases.
      const top = Math.min(Math.max(r.top - f.scroll, 0), r.top + r.height - f.scroll - stageH) + frameTop;
      // A wipe rises from the frame's bottom edge, or from the screen's while that edge is still below it: `run` is the share of the frame above the bottom of the screen.
      const run = frameH > 0 ? clamp((Math.min(f.vh, top + frameH) - top) / frameH) : 1;
      shots.forEach((s, i) => {
        const st = worksStudy(e, i, n, D);
        setStyle(s.el, "clipPath", `inset(${((1 - st.inP) * run * 100).toFixed(2)}% 0 0 0)`);
        if (s.img) {
          setStyle(s.img, "transform", liftPercent(mix(6, -6, st.drift)));
          setStyle(s.img, "filter", `brightness(${num(mix(1, 0.72, st.outP))})`);
        }
      });
      items.forEach((it, i) => {
        const L = titleLines[i].length;
        if (it.eyebrow) setStyle(it.eyebrow, "transform", liftPercent(worksLine(e, i, n, D, 0)));
        titleLines[i].forEach((line, j) => setStyle(line, "transform", liftPercent(worksLine(e, i, n, D, j + 1))));
        // The button travels farther, so its focus ring clears the mask too, and its plate fades with how much of it shows; it takes the pointer only while it is in place.
        const by = worksLine(e, i, n, D, L + 1);
        if (it.button) {
          const bt = worksButton(by);
          setStyle(it.button, "transform", liftPercent(bt.y));
          setStyle(it.button, "opacity", num(bt.opacity));
        }
        if (it.link) setStyle(it.link, "pointerEvents", Math.abs(by) < 0.15 * MASK ? "auto" : "none");
      });
    },
    destroy() {
      section.removeEventListener("focusin", onFocus);
    },
  };
}

/*
 * Values: a word on screen all the way through. Every word and description
 * is set (twice: ink, and ivory clipped to the pictures), stacked, and each
 * rolls through its own mask at its value's moment, an odometer between
 * two pictures; the pictures grow at their moment.
 */
function values(shared: Shared): MotionModule | null {
  const section = one("[data-values]");
  const stage = section && one("[data-values-stage]", section);
  const mask = section && one("[data-values-mask]", section);
  if (!section || !stage || !mask) return null;
  const outers = all("[data-values-outer]", section);
  const frames = outers.map((o) => one("[data-values-frame]", o)!);
  const images = outers.map((o) => one("[data-values-image]", o)!);
  const labels = all("[data-label-roll]", section);
  // The corner label's block (its Container), in the same sticky screen as the stage.
  const label = one("h2", section)?.parentElement ?? null;
  // The ink copy first, then the ivory one inside the mask.
  const copies = all(".values-text", stage).map((root) => ({ root, titles: all("[data-values-title]", root), rolls: all("[data-values-roll]", root), descs: all("[data-values-desc]", root) }));
  const n = outers.length;
  let rSection: Range;
  let rOuters: Range[] = [];
  let rFrames: Range[] = [];
  let stageH = 0;
  let lines: HTMLElement[][][] = copies.map((c) => c.descs.map(() => []));
  /** The band each row of description lines takes up with its letters (every description starts at the top of one cell, so they share rows), in the stage's px. */
  let rows: { top: number; bottom: number }[] = [];

  /**
   * The words' sizes, the same in both copies. Below 1024px each word is
   * fitted a little wider than the picture (frame × 1.3, within the
   * gutters), so the picture's edges split every word. On any screen a word
   * whose cap line would come too close to the corner label shrinks until it
   * clears it, below or beside (valuesWordSize): on short screens the
   * centred word would otherwise print over the label's note.
   */
  const fitTitles = (f: Frame, frameW: number) => {
    for (const c of copies) c.titles.forEach((t) => setStyle(t, "fontSize", ""));
    const ink = copies[0];
    if (!ink || !f.tracks || !frameW) return;
    // All reads first, then the writes.
    const gutter = parseFloat(getComputedStyle(ink.root).paddingLeft) || 0;
    const words = ink.titles.map((t, i) => ({ w0: ink.rolls[i]?.offsetWidth ?? 0, base: parseFloat(getComputedStyle(t).fontSize), mid: t.offsetTop + t.offsetHeight / 2 }));
    const box = label ? { bottom: label.offsetTop + label.offsetHeight, right: Math.max(0, ...labels.map(textRight)) } : null;
    const target = Math.min(f.vw - 2 * gutter, frameW * 1.3);
    words.forEach(({ w0, base, mid }, i) => {
      if (!w0 || !base) return;
      const fitted = f.vw < 1024 ? clamp((base * target) / w0, 0.85 * base, 1.9 * base) : base;
      const size = box ? valuesWordSize(fitted, (w0 * fitted) / base, mid, f.vw, box) : fitted;
      if (Math.abs(size - base) < 0.01) return;
      for (const c of copies) if (c.titles[i]) setStyle(c.titles[i], "fontSize", px(size));
    });
  };

  return {
    order: ORDER.values,
    measure(f) {
      rSection = measureRange(section);
      rOuters = outers.map(measureRange);
      rFrames = frames.map(measureRange);
      stageH = stage.offsetHeight;
      const frameW = rFrames[0]?.width ?? 0;
      setStyle(stage, "--values-frame-w", f.tracks && frameW ? px(frameW) : "");
      fitTitles(f, frameW);
      // Split every description once here, never in a frame.
      if (f.tracks) lines = copies.map((c, ci) => c.descs.map((d, i) => resplitIfNeeded(d, lines[ci]?.[i] ?? [])));
      else if (lines.some((c) => c.some((l) => l.length))) {
        copies.forEach((c) => c.descs.forEach(unsplit));
        lines = copies.map((c) => c.descs.map(() => []));
      }
      // Each line's mask (.split-line) is its row, and its letters take up about the middle two thirds of it; the longest description has every row.
      const longest = (lines[0] ?? []).reduce<HTMLElement[]>((a, b) => (b.length > a.length ? b : a), []);
      rows = longest.map((inner) => {
        const row = inner.parentElement;
        const mid = row ? row.offsetTop + row.offsetHeight / 2 : 0;
        const half = row ? row.offsetHeight / 3 : 0;
        return { top: mid - half, bottom: mid + half };
      });
    },
    update(f) {
      if (!f.tracks) {
        labels.forEach((el) => clear(el, "transform"));
        images.forEach((img) => clear(img, "transform", "filter"));
        copies.forEach((c) => c.rolls.forEach((el) => clear(el, "transform")));
        lines.forEach((c) => c.forEach((ls) => ls.forEach((line) => clear(line, "transform"))));
        return;
      }
      // As the stage pins, with the first word.
      labelRoll(labels, rSection, f, 0.62);
      const xs = rOuters.map((r) => (f.scroll - r.top) / f.vh);

      images.forEach((img, i) => {
        const st = valuesImage(xs[i], shared.fade);
        setStyle(img, "transform", `scale(${num(st.scale)})`);
        setStyle(img, "filter", `brightness(${num(st.brightness)})`);
      });

      // Every picture on screen, as it is drawn right now, in the stage's own px.
      const stageTop = Math.min(Math.max(rSection.top - f.scroll, 0), rSection.top + rSection.height - f.scroll - stageH);
      const pics: { top: number; bottom: number }[] = [];
      let d = "";
      xs.forEach((x, i) => {
        const fr = rFrames[i];
        if (!fr || Math.abs(x) >= 1.2) return;
        const scale = valuesImage(x, 0).scale;
        const w = fr.width * scale;
        const h = fr.height * scale;
        const cx = fr.left + fr.width / 2;
        const cy = fr.top - f.scroll + fr.height / 2 - stageTop;
        pics.push({ top: cy - h / 2, bottom: cy + h / 2 });
        const [l, t, rr, b] = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2].map((v) => v.toFixed(2));
        d += `M${l} ${t}H${rr}V${b}H${l}Z`;
      });

      // Every word and description line from its own value's x. A word rolls in both copies, so a picture's edges split it.
      xs.forEach((x, i) => {
        const y = liftPercent(valuesTitle(x, i, n));
        for (const c of copies) if (c.rolls[i]) setStyle(c.rolls[i], "transform", y);
      });
      // A line of body text shows in one copy only: ivory while its letters are all over a picture, ink otherwise, the other copy parked below its mask. So a passing edge never cuts a line into two colours, nor cuts off its ivory letters.
      const ivory = rows.map((row) => pics.some((p) => row.top >= p.top && row.bottom <= p.bottom));
      const [inkLines, ivoryLines] = lines;
      inkLines?.forEach((ls, i) =>
        ls.forEach((line, k) => {
          const y = liftPercent(valuesDescLine(xs[i], i, n, k));
          const twin = ivoryLines?.[i]?.[k];
          setStyle(line, "transform", ivory[k] ? PARKED : y);
          if (twin) setStyle(twin, "transform", ivory[k] ? y : PARKED);
        }),
      );

      // Clip the ivory copy to every picture on screen.
      setStyle(mask, "clipPath", d ? `path('${d}')` : "inset(50%)");
    },
  };
}

/*
 * Services. On the pinned track (phones from 620px tall, wider screens
 * from 720px; globals.css) the whole composition comes up through the dusk
 * and holds for two screens. The stage rides 0.3 screen ahead of its track
 * until the dusk is over and settles into the pin (servicesLead), so its
 * picture follows close under the last Values picture: the picture's sheet
 * wipes up from the bottom of the screen as the frame comes into view,
 * then, once the ground is past half night, the heading's lines and
 * the rows rise out of their masks, each row's rule drawing across; it is
 * whole as the stage pins. While it holds, scrolling walks the rows. The
 * frame shows the row hovered (with a fine pointer), else the one focused,
 * else the one scrolling has reached; the latest of a hover and a scroll
 * wins, so a pointer resting on the list never freezes the walk. Each new
 * picture wipes up over the last, which darkens under it (swapTo).
 *
 * On wide screens too short to pin, the section flows, starting close
 * under the last Values picture: the heading rises with the track as it
 * does when pinned, each row arrives from its own place, and the picture
 * follows the row crossing the middle of the screen. Without the tracks
 * everything is still and the picture follows a hover or focus at once.
 */
function services(): MotionModule[] {
  const section = one("[data-services]");
  const track = section && one("[data-services-track]", section);
  const stage = section && one("[data-services-stage]", section);
  const frameCol = section && one("[data-services-frame]", section);
  const box = section && one("[data-services-box]", section);
  const reveal = section && one("[data-services-reveal]", section);
  const zoom = section && one("[data-services-zoom]", section);
  const heading = section && one("[data-services-heading]", section);
  const list = section && one("[data-services-body]", section);
  if (!section || !track || !stage || !frameCol || !box || !reveal || !zoom || !heading || !list) return [];
  const pics = all("[data-services-pic]", section);
  const rows = all("[data-service-index]", section).map((li) => ({
    li,
    inner: one(".services-item__label .split-line__inner", li),
    meta: all("[data-services-meta]", li),
    rules: all("[data-services-rule]", li),
  }));
  const eyebrow = one("[data-services-roll]", section);
  const caption = one("[data-services-caption]", section);
  const more = one("[data-services-all]", section);
  const n = rows.length;
  const deskTrack = matchMedia("(min-width: 768px) and (min-height: 720px)");
  const phoneTrack = matchMedia("(max-width: 767px) and (min-height: 620px)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let pinned = false;
  let rTrack: Range, rCol: Range, rMore: Range | null = null;
  let rRows: Range[] = [];
  let stageH = 0;
  let boxTop = 0;
  let boxH = 0;
  let headLines: HTMLElement[] = [];
  let hoverIdx: number | null = null;
  let focusIdx: number | null = null;
  let scrollIdx = 0;
  let target = 0;
  let shown = -1;
  let stack: SwapLayer[] = [{ i: 0, from: 1, t0: 0, dir: 1 }];

  // Where the stage is on the screen: it rides with the track until it pins, and after it releases.
  const stageTop = (f: Frame) => Math.min(Math.max(rTrack.top - f.scroll, 0), rTrack.top + rTrack.height - f.scroll - stageH);

  const rowOf = (node: EventTarget | null) => (node instanceof Node ? rows.findIndex((r) => r.li.contains(node)) : -1);
  const onEnter = (event: PointerEvent) => {
    const i = rowOf(event.target);
    if (i >= 0 && finePointer.matches) hoverIdx = i;
  };
  const onLeave = () => {
    hoverIdx = null;
  };
  const onFocusIn = (event: FocusEvent) => {
    const i = rowOf(event.target);
    if (i < 0) return;
    focusIdx = i;
    // Keyboard focus arriving from outside the list while the stage is not pinned: bring the stage to the row's place in the hold, where the list is whole. Only keyboard focus: a press must not move the page under the pointer.
    const f = engine.frame;
    const hold = rTrack ? rTrack.height - f.vh : 0;
    const from = event.relatedTarget instanceof Node && list.contains(event.relatedTarget);
    if (pinned && !from && hold > 0 && event.target instanceof Element && event.target.matches(":focus-visible") && (f.scroll < rTrack.top || f.scroll > rTrack.top + hold)) {
      engine.scrollTo(rTrack.top + ((i + 0.5) / n) * hold);
    }
  };
  const onFocusOut = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node && list.contains(event.relatedTarget))) focusIdx = null;
  };
  list.addEventListener("pointerover", onEnter);
  list.addEventListener("pointerleave", onLeave);
  list.addEventListener("focusin", onFocusIn);
  list.addEventListener("focusout", onFocusOut);

  const image: MotionModule = {
    order: ORDER.servicesImage,
    measure(f) {
      pinned = f.tracks && (phoneTrack.matches || deskTrack.matches);
      if (pinned) section.dataset.servicesPinned = "";
      else delete section.dataset.servicesPinned;
      rTrack = measureRange(track);
      rCol = measureRange(frameCol);
      rRows = rows.map((r) => measureRange(r.li));
      stageH = stage.offsetHeight;
      boxH = box.offsetHeight;
      // The frame's place in the stage (the stage may be stuck, so from the rects rather than the offsets).
      boxTop = box.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    },
    update(f) {
      // The row the frame shows.
      const reached = pinned ? servicesIndex(f.scroll, rTrack.top, rTrack.height, f.vh, n) : f.tracks ? rRows.reduce((k, r, i) => (r.top < f.scroll + 0.5 * f.vh ? i : k), 0) : scrollIdx;
      // Scrolling to a new row takes over from a resting pointer.
      if (reached !== scrollIdx) {
        scrollIdx = reached;
        hoverIdx = null;
      }
      const next = hoverIdx ?? focusIdx ?? (f.tracks ? scrollIdx : target);
      if (next !== target) {
        target = next;
        stack = swapTo(stack, target, f.time, f.reduced);
      }
      if (shown !== target) {
        rows[shown]?.li.removeAttribute("data-active");
        rows[target]?.li.setAttribute("data-active", "");
        shown = target;
      }
      stack = swapSettle(stack, f.time, f.reduced);
      const ks = stack.map((l) => swapK(l, f.time, f.reduced));
      pics.forEach((el, i) => {
        const z = stack.findIndex((l) => l.i === i);
        if (z < 0) {
          setStyle(el, "visibility", "hidden");
          clear(el, "zIndex", "clipPath", "transform", "filter");
          return;
        }
        const ly = swapLayer(ks[z], ks[z + 1] ?? 0);
        setStyle(el, "visibility", "visible");
        setStyle(el, "zIndex", String(z + 1));
        setStyle(el, "clipPath", ly.clip > 0.005 ? `inset(${ly.clip.toFixed(2)}% 0 0 0)` : "");
        setStyle(el, "transform", ly.scale > 1.00005 ? `scale(${num(ly.scale)})` : "");
        setStyle(el, "filter", ly.brightness < 0.9995 ? `brightness(${num(ly.brightness)})` : "");
      });

      if (!f.tracks) {
        clear(stage, "transform");
        clear(reveal, "clipPath");
        clear(zoom, "transform");
        if (caption) clear(caption, "opacity");
        return;
      }
      // The stage's lead over its track as it comes up (px).
      const lead = pinned ? servicesLead(sso(rTrack, f)) * f.vh : 0;
      setStyle(stage, "transform", lead > 0.05 ? `translate3d(0, ${(-lead).toFixed(2)}px, 0)` : "");
      // The frame's top on the screen; the sheet rises from the bottom of the screen until the frame's own bottom edge is in view.
      const top = pinned ? stageTop(f) + boxTop - lead : rCol.top - f.scroll;
      const rv = servicesReveal((f.vh - top) / f.vh);
      setStyle(reveal, "clipPath", `inset(${riseInset(rv.r, top, boxH, f.vh).toFixed(2)}% 0 0 0)`);
      setStyle(zoom, "transform", `translate3d(0, ${rv.y.toFixed(2)}%, 0) scale(${num(rv.scale)})`);
      if (caption) setStyle(caption, "opacity", num(rv.r));
    },
    destroy() {
      list.removeEventListener("pointerover", onEnter);
      list.removeEventListener("pointerleave", onLeave);
      list.removeEventListener("focusin", onFocusIn);
      list.removeEventListener("focusout", onFocusOut);
      delete section.dataset.servicesPinned;
    },
  };

  const copy: MotionModule = {
    order: ORDER.services,
    measure(f) {
      rMore = more ? measureRange(more) : null;
      if (f.tracks) headLines = resplitIfNeeded(heading, headLines);
      else if (headLines.length) {
        unsplit(heading);
        headLines = [];
      }
    },
    update(f) {
      if (!f.tracks) {
        if (eyebrow) clear(eyebrow, "transform");
        for (const r of rows) {
          if (r.inner) clear(r.inner, "transform");
          r.rules.forEach((el) => clear(el, "transform"));
          r.meta.forEach((el) => clear(el, "opacity"));
        }
        if (more) clear(more, "opacity");
        return;
      }
      // Whatever holds focus is in place, whatever the scroll.
      const focused = document.activeElement;
      const show = (r: (typeof rows)[number], t: number, y: number, meta: number) => {
        const held = focused instanceof Node && r.li.contains(focused);
        if (r.inner) setStyle(r.inner, "transform", liftPercent(held ? 0 : y));
        r.rules.forEach((el) => setStyle(el, "transform", `scaleX(${num(held ? 1 : t)})`));
        r.meta.forEach((el) => setStyle(el, "opacity", num(held ? 1 : meta)));
      };
      // The eyebrow and the heading from the track, as the ground passes night.
      const s = sso(rTrack, f);
      if (eyebrow) setStyle(eyebrow, "transform", liftPercent(roll(tween(s, 0.34, 0.3, ease.power3Out), 0)));
      headLines.forEach((line, j) => setStyle(line, "transform", liftPercent(servicesHeading(s, j))));
      if (pinned) {
        // The rows from the track too, so the composition is whole as the stage pins.
        rows.forEach((r, i) => {
          const st = servicesRow(s, i);
          show(r, st.t, st.y, st.meta);
        });
        if (more) setStyle(more, "opacity", num(servicesRow(s, n - 1).meta));
        return;
      }
      // Flowing: each row from its own place.
      rows.forEach((r, i) => {
        const t = tween(sso(rRows[i], f), 0.06, 0.22, ease.power3Out);
        show(r, t, roll(t, 0), t);
      });
      if (more && rMore) setStyle(more, "opacity", num(tween(sso(rMore, f), 0.06, 0.22)));
    },
  };
  return [image, copy];
}

/*
 * Services to Contact: Contact's ivory sheet rises over Services, which
 * lags behind the scroll by up to 0.35 screen and dims as it is covered,
 * so it sinks into the night. Contact starts to rise only after the
 * Services stage has released, so this never moves a pinned stage.
 */
function handover(): MotionModule | null {
  const inner = one("[data-services-inner]");
  const contact = one("[data-contact]");
  if (!inner || !contact) return null;
  let r: Range;
  return {
    order: ORDER.handover,
    measure() {
      r = measureRange(contact);
    },
    update(f) {
      const x = f.tracks ? clamp(sso(r, f)) : 0;
      if (x <= 0) return clear(inner, "transform", "opacity");
      const h = servicesHandover(x);
      setStyle(inner, "transform", lift(h.lift * f.vh));
      setStyle(inner, "opacity", num(h.opacity));
    },
  };
}

/*
 * Contact: the word cut in letter by letter, each rising from its own mask
 * as the word comes up; then the cards rise and their blocks fade in (the
 * right one a beat behind on wide screens) while each picture's sheet
 * wipes up from the bottom and settles.
 *
 * Each letter is a box of its own, which loses the face's kerning between
 * letters (14px between T and A at 1440 wide): measure() sets the word as
 * one run, out of sight, and gives each letter back the difference, in em,
 * so it holds at every size.
 */
function contact(): MotionModule | null {
  const section = one("[data-contact]");
  const heading = section && one("[data-contact-heading]", section);
  if (!section || !heading) return null;
  const masks = all(".contact-letter", heading);
  const letters = all("[data-contact-letter]", heading);
  const cards = all("[data-contact-card]", section).map((el) => ({ el, pic: one(".contact-pic", el), wipe: one("[data-contact-wipe]", el), img: one("[data-contact-wipe] img", el) }));
  const wide = matchMedia("(min-width: 768px)");
  let rHeading: Range;
  let rCards: Range[] = [];
  let rPics: (Range | null)[] = [];

  const kern = () => {
    const word = letters.map((l) => l.textContent ?? "").join("");
    const probe = document.createElement("span");
    probe.textContent = word;
    probe.style.cssText = "position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden;pointer-events:none";
    heading.append(probe);
    // All reads, then the writes.
    const text = probe.firstChild;
    const range = document.createRange();
    const xs = letters.map((_, i) => {
      if (!(text instanceof Text)) return 0;
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      return range.getBoundingClientRect().left;
    });
    const widths = masks.map((m) => m.getBoundingClientRect().width);
    const size = parseFloat(getComputedStyle(heading).fontSize) || 1;
    probe.remove();
    masks.forEach((m, i) => setStyle(m, "marginLeft", i && text instanceof Text ? `${((xs[i] - xs[i - 1] - widths[i - 1]) / size).toFixed(4)}em` : ""));
  };

  return {
    order: ORDER.contact,
    measure() {
      kern();
      rHeading = measureRange(heading);
      rCards = cards.map((c) => measureRange(c.el));
      rPics = cards.map((c) => (c.pic ? measureRange(c.pic) : null));
    },
    update(f) {
      if (!f.tracks) {
        letters.forEach((el) => clear(el, "transform"));
        for (const c of cards) {
          clear(c.el, "transform", "opacity");
          if (c.wipe) clear(c.wipe, "clipPath");
          if (c.img) clear(c.img, "transform");
        }
        return;
      }
      const sh = sso(rHeading, f);
      letters.forEach((el, i) => setStyle(el, "transform", liftPercent(contactLetter(sh, i))));
      cards.forEach((c, k) => {
        const st = contactCard(sso(rCards[k], f), wide.matches ? k % 2 : 0);
        // Written out even at rest: the tracks' initial state in globals.css holds the cards down until now.
        setStyle(c.el, "transform", st.y > 0.005 ? lift(st.y) : "none");
        setStyle(c.el, "opacity", num(st.opacity));
        const pic = rPics[k];
        if (c.wipe && pic) setStyle(c.wipe, "clipPath", `inset(${riseInset(st.t, pic.top - f.scroll + st.y, pic.height, f.vh).toFixed(2)}% 0 0 0)`);
        if (c.img) setStyle(c.img, "transform", `scale(${num(st.scale)})`);
      });
    },
  };
}

export function HomeMotion() {
  useEffect(() => {
    const shared: Shared = { fade: 0 };
    const modules = [ground(shared), hero(), intro(), works(), values(shared), ...services(), handover(), contact()].filter((m): m is MotionModule => Boolean(m));
    const offs = modules.map((m) => engine.register(m));
    return () => offs.forEach((off) => off());
  }, []);
  return null;
}
