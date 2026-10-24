"use client";

import { useEffect } from "react";
import { LINE_KINDS, STORY_W, storyGrid, storyLevels, storyLines, storyMembers } from "@/content/story-drawing";
import { MK_SITE_ZOOM } from "@/content/making-drawing";
import { ORDER, engine, hso, measureRange, setStyle, sleeper, sso, type Frame, type MotionModule, type Range } from "@/lib/motion/engine";
import {
  LABEL_IN,
  contactBlock,
  contactCell,
  contactLine,
  contactPicture,
  contactPictureAt,
  contactRise,
  contactRiseAt,
  duskPartWay,
  MAKING_FILM_AT,
  MAKING_LINE_DUR,
  MAKING_OVERSHOOT,
  type MakingDraw,
  type MakingFade,
  makingChapter,
  makingDraw,
  makingFade,
  makingFill,
  makingLine,
  makingPartWay,
  makingZoom,
  headerGround,
  HERO_DEPTH,
  heroPartWay,
  heroState,
  introCopy,
  introLine,
  introPartWay,
  introPhases,
  introProgress,
  orbitItem,
  orbitPath,
  pageGround,
  partWay,
  riseInset,
  servicesHandover,
  servicesHeading,
  servicesHold,
  servicesIndex,
  servicesLead,
  servicesPartWay,
  servicesReveal,
  servicesRevealAt,
  SERVICES_META_ON,
  servicesRow,
  sectionLabel,
  STORY,
  STORY_OVERSHOOT,
  storyChapter,
  storyField,
  storyFill,
  storyLine,
  storyLineDraw,
  storyOverlay,
  storyPartWay,
  storySeg,
  storySide,
  storyState,
  swapK,
  swapLayer,
  swapSettle,
  swapTo,
  MASK,
  roll,
  valuesDescLine,
  valuesImage,
  valuesPartWay,
  valuesTitle,
  valuesWordSize,
  worksButton,
  worksLine,
  worksPartWay,
  worksShot,
  type OrbitPath,
  type SwapLayer,
} from "@/lib/motion/home";
import { clamp, ease, mix, toHex, tween } from "@/lib/motion/math";
import { entranceClock, spansWhere, ZONE_STEP, type Span } from "@/lib/motion/settle";
import { resplitIfNeeded, splitAll, unsplit } from "@/lib/motion/split";

/*
 * Drives the homepage from the scroll engine (docs/MOTION.md). Renders
 * nothing: it finds the sections by their data attributes and registers one
 * module per section, in the reference's order. Each module is a pure
 * function of the scroll position, so the page plays backwards exactly on
 * the way up, and each sleeps while its section is a screen or more off the
 * screen (engine.ts, sleeper). Without the tracks (reduced motion, short
 * screens) the modules clear their styles and the sections show their
 * still layouts.
 *
 * On touch screens the page is never left part way through a change
 * (settle.ts): each module on a pinned stage says where its changes are
 * (`zones`), and the engine settles the page out of them once a flick has
 * come to rest; Services' list and pictures on phones, and Contact, come
 * up with the page instead, so their entrances play on their own clock.
 */

const one = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const all = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const svgAll = (sel: string, root: ParentNode) => [...root.querySelectorAll<SVGElement>(sel)];
const px = (n: number) => `${n.toFixed(2)}px`;
const num = (n: number) => n.toFixed(4);
/*
 * A line or block lifted from its place: a layer of its own (translate3d)
 * only while it moves. At rest, and parked under its mask, it is drawn with
 * the page, since dozens of lines left as layers cost a phone memory and
 * every frame's compositing.
 */
const lift = (y: number) => (Math.abs(y) < 0.005 ? "none" : `translate3d(0, ${px(y)}, 0)`);
const liftPercent = (y: number) => (Math.abs(y) < 0.005 ? "none" : Math.abs(y) > MASK - 0.005 ? `translateY(${y.toFixed(2)}%)` : `translate3d(0, ${y.toFixed(2)}%, 0)`);
/** A masked line parked below its mask, hidden. */
const PARKED = liftPercent(MASK);

/** The blocks of text the modules split into lines, gathered as they are set up (HomeMotion), so `splitter` splits them all at once. */
let splitting: HTMLElement[] = [];

function clear(el: HTMLElement | SVGElement, ...props: string[]) {
  for (const p of props) setStyle(el, p, "");
}

const attrs = new WeakMap<Element, Record<string, string>>();

/** Write an attribute only when it changed since the last frame (setStyle's twin, for SVG geometry). */
function setAttr(el: Element, name: string, value: string) {
  let cache = attrs.get(el);
  if (!cache) attrs.set(el, (cache = {}));
  if (cache[name] === value) return;
  cache[name] = value;
  el.setAttribute(name, value);
}

/** Sets or removes a boolean attribute, only when it changes. */
function flag(el: Element, name: string, on: boolean) {
  if (el.hasAttribute(name) !== on) el.toggleAttribute(name, on);
}

/** Sets or removes data-services-in, only when it changes: small labels that fade in on their own once their row is up (a CSS transition, so no frame writes them). */
function mark(el: HTMLElement, on: boolean) {
  if (el.hasAttribute("data-services-in") !== on) el.toggleAttribute("data-services-in", on);
}

/** The right edge of an element's text (not its box), in px from the screen's left. */
function textRight(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().right;
}

/*
 * Touch screens (settle.ts): the spans of scroll between `from` and `to`
 * (px) where something of a module is part way through a change, `partWay`
 * judging the frame at each place (lib/motion/home.ts, "Touch screens").
 */
function zonesWhere(f: Frame, from: number, to: number, partWay: (g: Frame) => boolean): Span[] {
  const g = { ...f };
  return spansWhere(from, to, ZONE_STEP * f.vh, (y) => {
    g.scroll = y;
    return partWay(g);
  });
}

/*
 * Touch screens: entrances on their own clock (entranceClock), on the
 * vocabulary's timed values (lib/motion/home.ts): a masked line 0.9s, 0.07s
 * after the one before it; a block 0.8s; a picture's sheet 1s.
 */
const LINE_S = 0.9;
const LINE_GAP = 0.07;
const BLOCK_S = 0.8;
const SHEET_S = 1;

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
    zones(f) {
      return zonesWhere(f, rServices.top - f.vh, rServices.top, (g) => duskPartWay(sso(rServices, g)));
    },
    destroy() {
      setStyle(document.body, "backgroundColor", "");
      if (bar) setStyle(bar, "--ground", "");
      setStyle(services, "backgroundColor", "");
      delete html.dataset.ground;
    },
  };
}

/*
 * Hero: three planes. Under a fine pointer the house moves against the
 * pointer and the sky with it, the name holding still between them; on the
 * way out the statement and the name leave upward through their masks while
 * the house and the sky recede under the intro's sheet, each at its own
 * depth, and darken. The stylesheet gives the planes room to move (--z,
 * read here) only for fine pointers on the tracks, so elsewhere they never
 * follow it. Everywhere, should the pictures still be loading, the stage
 * waits until both are decoded (data-waiting) before it shows either.
 */
function hero(): MotionModule | null {
  const section = one("[data-home-hero]");
  const stage = one("[data-hero-stage]");
  const heading = one("[data-hero-heading]");
  const near = one('[data-hero-layer="near"]');
  const far = one('[data-hero-layer="far"]');
  const fig = one(".hero-fig");
  const dim = one("[data-hero-dim]");
  if (!section || !stage || !heading || !near || !far || !fig || !dim) return null;
  // Hold the sky back until the house is there (globals.css, "Hero"), both pictures decoded: decoding them as they appear would stall the frame they come in on.
  const planes = [...stage.querySelectorAll<HTMLImageElement>("[data-hero-plate] img")];
  let live = true;
  const arrived = () => delete stage.dataset.waiting;
  if (planes.some((img) => !(img.complete && img.naturalWidth))) {
    stage.dataset.waiting = "";
    void Promise.allSettled(planes.map((img) => img.decode())).then(() => live && arrived());
  }
  // The name first, then the two statement lines.
  const [name, ...subs] = all("[data-hero-roll]", section);
  let r: Range;
  let z = 1;
  let w = 0;
  let h = 0;
  // Where the pointer is (−1 to 1 across the window, 0 once it leaves) and where the planes have got to on their way to it.
  const aim = { x: 0, y: 0 };
  const at = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    aim.x = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    aim.y = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
  };
  const onOut = (e: MouseEvent) => {
    if (!e.relatedTarget) aim.x = aim.y = 0;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseout", onOut);
  const sleep = sleeper();
  return {
    order: ORDER.hero,
    measure() {
      sleep.wake();
      r = measureRange(section);
      z = parseFloat(getComputedStyle(stage).getPropertyValue("--z")) || 1;
      w = stage.clientWidth;
      h = stage.clientHeight;
    },
    update(f) {
      if (sleep.skip(r, f)) return;
      if (!f.tracks) {
        clear(heading, "transform");
        [name, ...subs].forEach((el) => el && clear(el, "transform"));
        clear(fig, "opacity");
        clear(near, "transform");
        clear(far, "transform");
        clear(dim, "opacity", "visibility");
        at.x = at.y = 0;
        return;
      }
      const s = heroState(f.scroll, r.top, f.vh);
      // The planes follow the pointer while the stage is on screen; once the intro covers it they hold where they are.
      if (f.scroll < r.top + r.height) {
        const k = 1 - Math.exp(-f.dt * HERO_DEPTH.rate);
        const depth = z > 1 ? 1 : 0;
        at.x += (aim.x * depth - at.x) * k;
        at.y += (aim.y * depth - at.y) * k;
      }
      setStyle(heading, "transform", lift(s.headingY));
      if (name) setStyle(name, "transform", liftPercent(s.nameRoll));
      subs.forEach((el, i) => setStyle(el, "transform", liftPercent(s.subRoll[i] ?? 0)));
      setStyle(fig, "opacity", num(s.figOpacity));
      setStyle(near, "transform", `translate3d(${px(-at.x * HERO_DEPTH.nearX * w)}, ${px(s.imageY - at.y * HERO_DEPTH.nearY * h)}, 0) scale(${num(z * s.imageScale)})`);
      setStyle(far, "transform", `translate3d(${px(at.x * HERO_DEPTH.farX * w)}, ${px(s.skyY + at.y * HERO_DEPTH.farY * h)}, 0) scale(${num(z * s.skyScale)})`);
      setStyle(dim, "opacity", num(s.dim));
      // Not drawn at all until the scroll darkens anything (Hero.tsx keeps it invisible: at the top it would be a full-screen layer showing nothing).
      setStyle(dim, "visibility", s.dim > 0 ? "visible" : "");
    },
    zones(f) {
      return zonesWhere(f, r.top, r.top + r.height, (g) => heroPartWay(g.scroll, r.top, g.vh));
    },
    destroy() {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      live = false;
      arrived();
    },
  };
}

/* Intro: six pictures travel one squircle path around the centre while two paragraphs pass through it. */
function intro(): MotionModule | null {
  // The section, not the page: the first-load intro screen also marks <html> with data-intro.
  const section = one("section[data-intro]");
  if (!section) return null;
  const stage = one("[data-intro-stage]", section);
  const items = all("[data-orbit-slot]", section).map((el) => ({ el, slot: Number(el.dataset.orbitSlot), img: one("[data-orbit-img]", el) }));
  const copies = all("[data-intro-copy]", section);
  splitting.push(...copies);
  const caption = one("[data-intro-caption]", section);
  const { copyIn, exitStart, sectionVh } = introPhases(copies.length);
  let r: Range;
  let path: OrbitPath;
  let lines: HTMLElement[][] = copies.map(() => []);
  const sleep = sleeper();
  return {
    order: ORDER.intro,
    measure(f) {
      sleep.wake();
      r = measureRange(section);
      if (f.tracks) lines = copies.map((c, i) => resplitIfNeeded(c, lines[i]));
      else if (lines.some((l) => l.length)) {
        copies.forEach(unsplit);
        lines = copies.map(() => []);
      }
      // The ring and the image sizes follow the stage (100svh, so a phone's toolbar does not push the ring under the header or the caption); rebuilt only here, so a resize re-spaces the ring. Portrait screens keep the pictures clear of the taller paragraph.
      const copyHalf = copies.reduce((m, c) => Math.max(m, c.offsetHeight / 2), 0);
      path = orbitPath(f.vw, (f.tracks && stage?.offsetHeight) || f.vh, copyHalf, f.vh);
      for (const it of items) setStyle(it.el, "--size", f.tracks ? px(path.sizes[it.slot] ?? 0) : "");
    },
    update(f) {
      if (sleep.skip(r, f)) return;
      // Without the tracks the pictures sit in a row under the paragraphs (globals.css), untouched.
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
      // The caption is there whenever any picture is, and leaves with them.
      if (caption) setStyle(caption, "opacity", num(Math.min(ring, 1 - exit)));
      // Display type never fades: each line only rolls through its mask.
      lines.forEach((ls, i) =>
        ls.forEach((line, j) => {
          setStyle(line, "transform", liftPercent(introLine(e, copyIn[i], j)));
          setStyle(line, "opacity", "1");
        }),
      );
    },
    zones(f) {
      const counts = lines.map((ls) => ls.length);
      return zonesWhere(f, r.top - f.vh, r.top + r.height, (g) => introPartWay(sso(r, g), counts));
    },
  };
}

/*
 * A section label (its heading and note, each one mask) rolls in over 0.3
 * screens from `from` (the section's showScreenOffset, LABEL_IN) as its
 * stage comes up, and leaves with the released stage.
 */
function labelRoll(labels: HTMLElement[], r: Range, f: Frame, from: number) {
  const y = sectionLabel(sso(r, f), from);
  for (const el of labels) setStyle(el, "transform", liftPercent(y));
}

/*
 * Story: one client house through four states on one drawing sheet, under
 * a stage pinned for 1.2 screens a chapter (storyState). The sheet wipes up
 * with the stage and the elevation is sketched on it line by line, each
 * line run a little past its ends; the rendering wipes up from the ground
 * line with the sketch clipped above its edge, so every line gives way to
 * the edge it was traced from; trace rises over the picture and the grid,
 * levels and structure are drawn on it; then the trace turns to paper, the
 * structure goes, the lines come back in ink, exact, and everything
 * straightens into a true elevation as the title block fills in. Beside
 * it the chapters' lines roll through their masks and the contents mark
 * the chapter being told.
 *
 * Lines and markers are SVG drawn with non-scaling strokes, so a hairline
 * stays a hairline at any size; a line draws by its path being rewritten
 * up to the pen (never a dash pattern, which the grid's and levels' own
 * dashes need), and only while it changes. Lines of one sort are the
 * subpaths of one path (Story.tsx), so a frame rewrites nine paths rather
 * than two hundred. The markers (bubbles, datums, labels) are drawn in
 * screen px inside groups scaled by the drawing's units per px.
 */
const segD = (s: readonly number[]) => `M${s[0].toFixed(1)} ${s[1].toFixed(1)}L${s[2].toFixed(1)} ${s[3].toFixed(1)}`;
const markAt = (x: number, y: number, unit: number) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${unit.toFixed(3)})`;
/** A path with nothing to draw (a zero-length line would leave a round cap's dot). */
const NOTHING = "M0 0";
/** Below this width (px) the sheet's level labels are shortened (globals.css), so they keep clear of the house. */
const STORY_COMPACT_PX = 560;

function story(): MotionModule | null {
  const section = one("[data-story]");
  const stage = section && one("[data-story-stage]", section);
  const sheet = section && one("[data-story-sheet]", section);
  const plate = section && one("[data-story-plate]", section);
  const render = section && one("[data-story-render]", section);
  const veil = section && one("[data-story-veil]", section);
  const scan = section && one("[data-story-scan]", section);
  const eng = section?.querySelector<SVGElement>("[data-story-eng]");
  const ink = section?.querySelector<SVGElement>("[data-story-lines]");
  if (!section || !stage || !sheet || !plate || !render || !veil || !scan || !eng || !ink) return null;
  // The sketch's lines, a path for each kind; each line keeps its place in the sketch's order.
  const strokes = LINE_KINDS.map((kind) => ({
    el: ink.querySelector<SVGElement>(`path[data-kind="${kind}"]`),
    lines: storyLines.flatMap((l, i) => (l.kind === kind ? [{ l, i }] : [])),
  }));
  // The engineering's lines (grid, levels, the structure's outlines, solid and hidden), then its markers over them.
  const axes = eng.querySelector<SVGElement>("[data-story-axes]");
  const levels = eng.querySelector<SVGElement>("[data-story-levels]");
  const structure = eng.querySelector<SVGElement>("[data-story-structure]");
  const solid = eng.querySelector<SVGElement>('[data-story-members="solid"]');
  const hidden = eng.querySelector<SVGElement>('[data-story-members="hidden"]');
  const bubbles = svgAll("[data-story-bubble]", eng);
  const datums = svgAll("[data-story-datum]", eng);
  const memberLabels = svgAll("[data-story-member-label]", eng).map((el) => ({ el, k: Number(el.getAttribute("data-story-member-label")) }));
  const chapters = all("[data-story-chapter]", section).map((li) => ({ label: one("[data-story-roll]", li), title: one("[data-story-title]", li), body: one("[data-story-body]", li) }));
  for (const c of chapters) splitting.push(...[c.title, c.body].filter((el) => el !== null));
  const toc = all("[data-story-toc]", section).map((li) => ({ li, fill: one("[data-story-fill]", li) }));
  const fields = all("[data-story-field]", section);
  const labels = all("[data-label-roll]", section);
  const caption = one("[data-story-caption]", section);
  const n = chapters.length;
  // The geometry as rendered (the still sheet's), put back when the tracks go.
  const geometry = [...svgAll("path", ink), ...svgAll("path, g[transform], text[transform]", eng)].map((el) => ({ el, d: el.getAttribute("d"), transform: el.getAttribute("transform") }));
  let r: Range;
  let stageH = 0;
  let sheetTop = 0;
  let sheetH = 0;
  let plateH = 0;
  /** The drawing's units per screen px. */
  let unit = 1;
  let titleLines: HTMLElement[][] = chapters.map(() => []);
  let bodyLines: HTMLElement[][] = chapters.map(() => []);
  /** Each chapter's masked lines, top first: its label, its title's lines, its body's. */
  let lines: HTMLElement[][] = chapters.map(() => []);
  let live = false;
  const sleep = sleeper();

  const still = () => {
    labels.forEach((el) => clear(el, "transform"));
    clear(sheet, "clipPath");
    if (caption) clear(caption, "opacity");
    clear(render, "clipPath");
    clear(ink, "clipPath", "opacity");
    flag(ink, "data-ink", false);
    clear(scan, "transform", "opacity");
    clear(veil, "clipPath", "opacity");
    clear(eng, "opacity");
    for (const g of geometry) {
      if (g.d != null) setAttr(g.el, "d", g.d);
      if (g.transform != null) setAttr(g.el, "transform", g.transform);
    }
    [...bubbles, ...datums, structure, ...memberLabels.map((l) => l.el)].forEach((el) => el && clear(el, "opacity"));
    lines.forEach((ls) => ls.forEach((line) => clear(line, "transform")));
    toc.forEach((t) => {
      flag(t.li, "data-active", false);
      if (t.fill) clear(t.fill, "transform");
    });
    fields.forEach((el) => clear(el, "transform"));
    if (live) {
      live = false;
      section.removeAttribute("data-story-live");
    }
  };

  return {
    order: ORDER.story,
    measure(f) {
      sleep.wake();
      r = measureRange(section);
      stageH = stage.offsetHeight;
      sheetH = sheet.offsetHeight;
      plateH = plate.offsetHeight;
      unit = STORY_W / Math.max(1, plate.offsetWidth);
      flag(eng, "data-compact", plate.offsetWidth < STORY_COMPACT_PX);
      // The sheet's place in the stage (the stage may be stuck, so from the rects rather than the offsets).
      sheetTop = sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      if (f.tracks) {
        titleLines = chapters.map((c, i) => (c.title ? resplitIfNeeded(c.title, titleLines[i]) : []));
        bodyLines = chapters.map((c, i) => (c.body ? resplitIfNeeded(c.body, bodyLines[i]) : []));
      } else if (titleLines.some((l) => l.length) || bodyLines.some((l) => l.length)) {
        chapters.forEach((c) => [c.title, c.body].forEach((el) => el && unsplit(el)));
        titleLines = chapters.map(() => []);
        bodyLines = chapters.map(() => []);
      }
      lines = chapters.map((c, i) => [...(c.label ? [c.label] : []), ...titleLines[i], ...bodyLines[i]]);
    },
    update(f) {
      if (sleep.skip(r, f)) return;
      if (!f.tracks) return still();
      labelRoll(labels, r, f, LABEL_IN.story);
      const e = sso(r, f) - 1;
      const st = storyState(e);

      // The sheet wipes up from its bottom edge, or from the bottom of the screen while that edge is still below it (its shadow kept clear of the clip).
      const top = Math.min(Math.max(r.top - f.scroll, 0), r.top + r.height - f.scroll - stageH) + sheetTop;
      setStyle(sheet, "clipPath", st.sheet < 1 ? `inset(${riseInset(st.sheet, top, sheetH, f.vh).toFixed(2)}% -2rem -3rem)` : "");
      if (caption) setStyle(caption, "opacity", num(st.sheet));

      // The rendering wipes up from the ground line. Until the ink, the lines are the sketch, clipped above the picture's edge; after it they are the drawing, exact.
      const cut = (1 - st.render) * 100;
      setStyle(render, "clipPath", `inset(${cut.toFixed(2)}% 0 0 0)`);
      const inked = st.ink > 0;
      flag(ink, "data-ink", inked);
      setStyle(ink, "clipPath", !inked && st.render > 0 ? `inset(0 0 ${(100 - cut).toFixed(2)}% 0)` : "");
      setStyle(ink, "opacity", inked ? num(st.ink) : "1");
      if (inked || st.render < 1) {
        for (const { el, lines: kind } of strokes) {
          if (!el) continue;
          let d = "";
          for (const { l, i } of kind) {
            const draw = inked ? 1 : storyLineDraw(st.sketch, i, storyLines.length);
            if (draw > 0) d += segD(storySeg(l.p, l.q, st.rectify, inked ? 0 : STORY_OVERSHOOT, draw));
          }
          setAttr(el, "d", d || NOTHING);
        }
      }

      // A hairline rides the edge of whichever layer is wiping up: the rendering, then the trace.
      const edge = st.render < 1 ? st.render : st.veil;
      setStyle(scan, "transform", `translate3d(0, ${px((1 - edge) * plateH)}, 0)`);
      setStyle(scan, "opacity", num(clamp(Math.min(edge, 1 - edge) * 10)));

      // The trace lets the picture through until it turns to paper.
      setStyle(veil, "clipPath", `inset(${((1 - st.veil) * 100).toFixed(2)}% 0 0 0)`);
      setStyle(veil, "opacity", st.veil > 0 ? num(mix(STORY.trace, 1, st.paper)) : "0");

      setStyle(eng, "opacity", st.eng > 0 ? "1" : "0");
      if (st.eng > 0) {
        const o = storyOverlay(st.eng, storyMembers.length);
        const t = st.rectify;
        let grid = "";
        storyGrid.forEach((g, i) => {
          if (o.grid[i] > 0) grid += segD(storySeg(g.p, g.q, t, 0, o.grid[i]));
          if (bubbles[i]) {
            setAttr(bubbles[i], "transform", markAt(mix(g.pb[0], g.qb[0], t), mix(g.pb[1], g.qb[1], t), unit));
            setStyle(bubbles[i], "opacity", num(o.bubbles[i]));
          }
        });
        if (axes) setAttr(axes, "d", grid || NOTHING);
        let lv = "";
        storyLevels.forEach((l, i) => {
          const s = storySeg(l.p, l.q, t, 0, o.levels[i]);
          if (o.levels[i] > 0) lv += segD(s);
          if (datums[i]) {
            setAttr(datums[i], "transform", markAt(s[0], s[1], unit));
            setStyle(datums[i], "opacity", num(o.levelLabels[i]));
          }
        });
        if (levels) setAttr(levels, "d", lv || NOTHING);
        // The structure is the engineer's: it goes as the trace turns to paper.
        const kept = 1 - st.paper;
        if (structure) setStyle(structure, "opacity", num(kept));
        if (kept > 0) {
          const out = { solid: "", hidden: "" };
          storyMembers.forEach((m, k) => {
            m.p.forEach((p, j) => {
              const side = storySide(o.members[k], j);
              const q = m.q[j];
              if (side > 0 && q) out[m.hidden ? "hidden" : "solid"] += segD(storySeg(p, q, t, 0, side));
            });
          });
          if (solid) setAttr(solid, "d", out.solid || NOTHING);
          if (hidden) setAttr(hidden, "d", out.hidden || NOTHING);
        }
        memberLabels.forEach(({ el, k }) => {
          const m = storyMembers[k];
          if (!m) return;
          setAttr(el, "transform", markAt(mix(m.pl[0], m.ql[0], t), mix(m.pl[1], m.ql[1], t), unit));
          setStyle(el, "opacity", num(o.memberLabels * kept));
        });
      }

      // The chapters' lines, and the contents.
      lines.forEach((ls, i) => ls.forEach((line, k) => setStyle(line, "transform", liftPercent(storyLine(e, i, n, k)))));
      const active = storyChapter(e, n);
      toc.forEach((c, i) => {
        flag(c.li, "data-active", i === active);
        if (c.fill) setStyle(c.fill, "transform", `scaleX(${num(storyFill(e, i))})`);
      });
      fields.forEach((el, k) => setStyle(el, "transform", liftPercent(storyField(e, k))));

      if (!live) {
        live = true;
        section.setAttribute("data-story-live", "");
      }
    },
    zones(f) {
      const counts = lines.map((ls) => ls.length);
      return zonesWhere(f, r.top - f.vh, r.top + r.height, (g) => storyPartWay(sso(r, g) - 1, counts, fields.length, labels.length > 0));
    },
    destroy() {
      section.removeAttribute("data-story-live");
    },
  };
}

/*
 * Works: a pinned viewer. One frame holds the three pictures; at each
 * handover the next wipes up from the bottom over the last, which dims as
 * it is covered, and the lines roll through their masks: eyebrow, title
 * lines, button. The first picture rises from the bottom of the screen
 * while the stage is still arriving, as the story's stage leaves.
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
  splitting.push(...items.map((it) => it.title));
  const labels = all("[data-label-roll]", section);
  // The corner label's block (its Container), in the same sticky screen as the stage.
  const label = one("h2", section)?.parentElement ?? null;
  const n = items.length;
  let r: Range;
  /** Screens the stage stays pinned (the section's height − 1 screen), shared by the projects. */
  let D = 1;
  let stageH = 0;
  let frameTop = 0;
  let frameH = 0;
  let titleLines: HTMLElement[][] = items.map(() => []);
  // Keyboard: focusing a project's button scrolls to the middle of its moment, where it is composed. Only keyboard focus: a press focuses the link too, and must not move the page under the pointer.
  const onFocus = (event: FocusEvent) => {
    if (!(event.target instanceof Element) || !event.target.matches(":focus-visible")) return;
    const i = items.findIndex((it) => it.button?.contains(event.target as Node));
    if (i >= 0 && r && engine.frame.tracks) engine.scrollTo(r.top + (i + 0.5) * (D / n) * engine.frame.vh);
  };
  section.addEventListener("focusin", onFocus);
  const sleep = sleeper();
  return {
    order: ORDER.works,
    measure(f) {
      sleep.wake();
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
      if (sleep.skip(r, f)) return;
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
      labelRoll(labels, r, f, LABEL_IN.works);
      const e = sso(r, f) - 1;
      // Where the frame is on the screen: the stage rides with the section until it pins, and after it releases.
      const top = Math.min(Math.max(r.top - f.scroll, 0), r.top + r.height - f.scroll - stageH) + frameTop;
      // A wipe rises from the frame's bottom edge, or from the screen's while that edge is still below it: `run` is the share of the frame above the bottom of the screen.
      const run = frameH > 0 ? clamp((Math.min(f.vh, top + frameH) - top) / frameH) : 1;
      shots.forEach((s, i) => {
        const st = worksShot(e, i, n, D);
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
    zones(f) {
      const counts = titleLines.map((ls) => ls.length);
      return zonesWhere(f, r.top - f.vh, r.top + r.height, (g) => worksPartWay(sso(r, g) - 1, D, counts, labels.length > 0));
    },
    destroy() {
      section.removeEventListener("focusin", onFocus);
    },
  };
}

/*
 * The making of a house: one board under a stage pinned for 6.75 screens
 * (MAKING). Its drawings are drafted a segment at a time (each path
 * rewritten up to the pen, as the story's sketch, each line run a little
 * past its ends, and only while it is drafted), and its layers fade by
 * their keyframes, a layer of their own only while they fade; the site
 * plan is drawn in, as one picture, until its house is the floor plan.
 * Once the house is shown at dusk its film, if it has one, plays from its
 * first frame; scrolled back, it rests there again.
 */
const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
type Seg4 = [number, number, number, number];

function making(): MotionModule | null {
  const section = one("[data-making]");
  const board = section && one("[data-mk-board]", section);
  if (!section || !board) return null;
  const draws = all<SVGPathElement>("[data-mk-draw]", section).map((path) => {
    const d = path.getAttribute("d") ?? "";
    const n = numbers(d);
    const segs: Seg4[] = [];
    for (let k = 0; k + 3 < n.length; k += 4) segs.push([n[k], n[k + 1], n[k + 2], n[k + 3]]);
    return { path, d, segs, key: path.dataset.mkDraw as MakingDraw, last: -1 };
  });
  const fades = all("[data-mk-fade]", section).map((el) => ({ el, key: el.dataset.mkFade as MakingFade }));
  const zoomEl = one("[data-mk-zoom]", section);
  const film = one<HTMLVideoElement>("[data-mk-film]", section);
  /** A drawing drafted `t` of the way, its lines run past their ends. */
  const drafted = (x: (typeof draws)[number], t: number) => {
    let d = "";
    x.segs.forEach((s, j) => {
      const draw = storyLineDraw(t, j, x.segs.length, MAKING_LINE_DUR);
      if (draw > 0) d += segD(storySeg(s, s, 0, MAKING_OVERSHOOT, draw));
    });
    return d || NOTHING;
  };
  const chapters = all("[data-mk-chapter]", section).map((li) => ({ label: one("[data-mk-roll]", li), title: one("[data-mk-title]", li), body: one("[data-mk-body]", li) }));
  for (const c of chapters) splitting.push(...[c.title, c.body].filter((el) => el !== null));
  const toc = all("[data-mk-toc]", section).map((li) => ({ li, fill: one("[data-mk-fill]", li) }));
  const labels = all("[data-label-roll]", section);
  const n = chapters.length;
  let r: Range;
  let titleLines: HTMLElement[][] = chapters.map(() => []);
  let bodyLines: HTMLElement[][] = chapters.map(() => []);
  /** Each chapter's masked lines, top first: its label, its title's lines, its body's. */
  let lines: HTMLElement[][] = chapters.map(() => []);
  let live = false;
  let playing = false;
  const sleep = sleeper();
  const onPlaying = () => flag(section, "data-mk-film-on", playing);
  film?.addEventListener("playing", onPlaying);

  const rest = () => {
    if (!film) return;
    if (playing) {
      film.pause();
      playing = false;
    }
    if (film.currentTime > 0) film.currentTime = 0;
    flag(section, "data-mk-film-on", false);
  };

  const still = () => {
    labels.forEach((el) => clear(el, "transform"));
    for (const x of draws) {
      setAttr(x.path, "d", x.d);
      x.last = -1;
    }
    for (const f of fades) clear(f.el, "opacity", "willChange");
    if (zoomEl) clear(zoomEl, "transform", "willChange");
    lines.forEach((ls) => ls.forEach((line) => clear(line, "transform")));
    toc.forEach((t) => {
      flag(t.li, "data-active", false);
      if (t.fill) clear(t.fill, "transform");
    });
    rest();
    if (live) {
      live = false;
      section.removeAttribute("data-mk-live");
    }
  };

  return {
    order: ORDER.making,
    measure(f) {
      sleep.wake();
      r = measureRange(section);
      if (f.tracks) {
        titleLines = chapters.map((c, i) => (c.title ? resplitIfNeeded(c.title, titleLines[i]) : []));
        bodyLines = chapters.map((c, i) => (c.body ? resplitIfNeeded(c.body, bodyLines[i]) : []));
      } else if (titleLines.some((l) => l.length) || bodyLines.some((l) => l.length)) {
        chapters.forEach((c) => [c.title, c.body].forEach((el) => el && unsplit(el)));
        titleLines = chapters.map(() => []);
        bodyLines = chapters.map(() => []);
      }
      lines = chapters.map((c, i) => [...(c.label ? [c.label] : []), ...titleLines[i], ...bodyLines[i]]);
    },
    update(f) {
      if (sleep.skip(r, f)) {
        rest();
        return;
      }
      if (!f.tracks) return still();
      labelRoll(labels, r, f, LABEL_IN.making);
      const e = sso(r, f) - 1;

      // The drawings: a path is rewritten only while it is drafted (and once more as it ends).
      for (const x of draws) {
        const t = makingDraw(e, x.key);
        if (t === x.last) continue;
        x.last = t;
        setAttr(x.path, "d", t <= 0 ? NOTHING : t >= 1 ? x.d : drafted(x, t));
      }
      for (const fd of fades) {
        const { value, moving } = makingFade(e, fd.key);
        setStyle(fd.el, "opacity", num(value));
        setStyle(fd.el, "willChange", moving ? "opacity" : "");
      }
      if (zoomEl) {
        const z = makingZoom(e);
        const k = 1 + (MK_SITE_ZOOM - 1) * z;
        setStyle(zoomEl, "transform", z <= 0 ? "none" : partWay(z) ? `scale3d(${num(k)}, ${num(k)}, 1)` : `scale(${num(k)})`);
      }
      if (film) {
        const on = e >= MAKING_FILM_AT;
        if (on && !playing) {
          playing = true;
          // Shown once it is really playing (onPlaying), so a browser that cannot play it keeps the still.
          void film.play().catch(() => undefined);
        } else if (!on && playing) rest();
      }

      // The chapters' lines, and the contents.
      lines.forEach((ls, i) => ls.forEach((line, k) => setStyle(line, "transform", liftPercent(makingLine(e, i, n, k)))));
      const active = makingChapter(e);
      toc.forEach((c, i) => {
        flag(c.li, "data-active", i === active);
        if (c.fill) setStyle(c.fill, "transform", `scaleX(${num(makingFill(e, i))})`);
      });

      if (!live) {
        live = true;
        section.setAttribute("data-mk-live", "");
      }
    },
    zones(f) {
      const counts = lines.map((ls) => ls.length);
      return zonesWhere(f, r.top - f.vh, r.top + r.height, (g) => makingPartWay(sso(r, g) - 1, counts, labels.length > 0));
    },
    destroy() {
      rest();
      film?.removeEventListener("playing", onPlaying);
      section.removeAttribute("data-mk-live");
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
  const sleep = sleeper();

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
      sleep.wake();
      rSection = measureRange(section);
      rOuters = outers.map(measureRange);
      rFrames = frames.map(measureRange);
      stageH = stage.offsetHeight;
      const frameW = rFrames[0]?.width ?? 0;
      setStyle(stage, "--values-frame-w", f.tracks && frameW ? px(frameW) : "");
      fitTitles(f, frameW);
      // Split every description once here, never in a frame. Here rather than with the other blocks (splitter): the frame's width, just set, decides theirs.
      if (f.tracks) {
        splitAll(copies.flatMap((c) => c.descs));
        lines = copies.map((c, ci) => c.descs.map((d, i) => resplitIfNeeded(d, lines[ci]?.[i] ?? [])));
      } else if (lines.some((c) => c.some((l) => l.length))) {
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
      if (sleep.skip(rSection, f)) return;
      if (!f.tracks) {
        labels.forEach((el) => clear(el, "transform"));
        images.forEach((img) => clear(img, "transform", "filter"));
        copies.forEach((c) => c.rolls.forEach((el) => clear(el, "transform")));
        lines.forEach((c) => c.forEach((ls) => ls.forEach((line) => clear(line, "transform"))));
        return;
      }
      labelRoll(labels, rSection, f, LABEL_IN.values);
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
    zones(f) {
      const counts = (lines[0] ?? []).map((ls) => ls.length);
      return zonesWhere(f, rSection.top - f.vh, rSection.top + rSection.height, (g) => valuesPartWay(rOuters.map((ro) => (g.scroll - ro.top) / g.vh), sso(rSection, g), counts, labels.length > 0));
    },
  };
}

/*
 * Services. On the pinned track (screens from 768px wide and 720px tall;
 * globals.css) the whole composition comes up through the dusk and holds
 * for two screens. The stage rides 0.3 screen ahead of its track until the
 * dusk is over and settles into the pin (servicesLead), so its picture
 * follows close under the last Values picture: the picture's sheet wipes
 * up from the bottom of the screen as the frame comes into view, then,
 * once the ground is past half night, the heading's lines rise out of
 * their masks, then the list's group labels and rows, each row's rule
 * drawing across; it is whole as the stage pins. While it holds,
 * scrolling walks the rows. The frame shows the row hovered (with a fine
 * pointer), else the one focused, else the one scrolling has reached; the
 * latest of a hover and a scroll wins, so a pointer resting on the list
 * never freezes the walk. A hover is taken only from the pointer moving,
 * and only while the stage holds, so rows rising under a resting pointer
 * never pick a picture. While the page is held (a page transition, the
 * menu) the frame keeps its picture. Each new picture wipes up over the
 * last, which darkens under it (swapTo), and the line on what the service
 * covers changes under it.
 *
 * Elsewhere the section flows. The heading rises with the track as it does
 * when pinned, and each group label and row arrives from its own place.
 * On phones there is no frame: each group's picture wipes up from the
 * bottom of the screen as it comes into view. On wide screens too short to
 * pin, the section starts close under the last Values picture and the
 * frame follows the row crossing the middle of the screen. Without the
 * tracks everything is still and the frame follows a hover or focus at
 * once.
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
  splitting.push(heading);
  const pics = all("[data-services-pic]", section);
  const captions = all("[data-caption]", section);
  const rows = all("[data-service-index]", section).map((li) => ({
    li,
    inner: one(".services-item__label .split-line__inner", li),
    rules: all("[data-services-rule]", li),
  }));
  // The list in order: each group's label, then its rows.
  const slots = all("[data-services-group-roll], [data-service-index]", list).map((el) => {
    const row = rows.find((r) => r.li === el);
    return row ? { box: el, row, roll: null } : { box: el.parentElement ?? el, row: null, roll: el };
  });
  // Phones: each group's own picture.
  const plates = all("[data-services-plate]", section).map((fig) => ({
    fig,
    frame: one(".services-plate__frame", fig),
    reveal: one("[data-services-plate-reveal]", fig),
    zoom: one("[data-services-plate-zoom]", fig),
    caption: one("[data-services-plate-caption]", fig),
  }));
  const eyebrow = one("[data-services-roll]", section);
  const caption = one("[data-services-caption]", section);
  const more = one("[data-services-all]", section);
  const n = rows.length;
  // Touch screens: the pictures and the flowing list come up with the page, so they play in on their own clocks.
  const sinceImage = entranceClock();
  const sinceCopy = entranceClock();
  const sleepImage = sleeper();
  const sleepCopy = sleeper();
  const deskTrack = matchMedia("(min-width: 768px) and (min-height: 720px)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let pinned = false;
  let frameShown = true;
  let rSection: Range, rTrack: Range, rCol: Range, rMore: Range | null = null;
  let rRows: Range[] = [];
  let rSlots: Range[] = [];
  let rPlates: (Range | null)[] = [];
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
  const inStage = (node: EventTarget | null) => node instanceof Node && stage.contains(node);
  // A hover is taken only from the pointer moving over a row: rows sliding under a resting pointer as the page scrolls fire pointerover (and in some engines a mousemove at the same place), and must never pick one. Watched from the window, so the pointer's last place is known before it reaches the list.
  let px0 = NaN;
  let py0 = NaN;
  const onMove = (event: PointerEvent) => {
    const moved = event.clientX !== px0 || event.clientY !== py0;
    px0 = event.clientX;
    py0 = event.clientY;
    if (!moved || engine.locked || !finePointer.matches || !(event.target instanceof Node) || !list.contains(event.target)) return;
    const i = rowOf(event.target);
    if (i >= 0) hoverIdx = i;
  };
  // While the page is held (a page transition growing over the list, the menu), the frame keeps what it shows.
  const onLeave = () => {
    if (!engine.locked) hoverIdx = null;
  };
  const onFocusIn = (event: FocusEvent) => {
    const i = rowOf(event.target);
    if (i < 0) return;
    focusIdx = i;
    // Keyboard focus arriving from outside the stage while it is not pinned: bring the stage to the row's place in the hold, where the list is whole. Only keyboard focus: a press must not move the page under the pointer.
    const f = engine.frame;
    const hold = rTrack ? rTrack.height - f.vh : 0;
    if (pinned && !inStage(event.relatedTarget) && hold > 0 && event.target instanceof Element && event.target.matches(":focus-visible") && !servicesHold(f.scroll, rTrack.top, rTrack.height, f.vh)) {
      engine.scrollTo(rTrack.top + ((i + 0.5) / n) * hold);
    }
  };
  // Focus moving on within the stage ('All services' after the last row) keeps the row it came from.
  const onFocusOut = (event: FocusEvent) => {
    if (!engine.locked && !inStage(event.relatedTarget)) focusIdx = null;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  list.addEventListener("pointerleave", onLeave);
  list.addEventListener("focusin", onFocusIn);
  stage.addEventListener("focusout", onFocusOut);

  const image: MotionModule = {
    order: ORDER.servicesImage,
    measure(f) {
      sleepImage.wake();
      rSection = measureRange(section);
      pinned = f.tracks && deskTrack.matches;
      if (pinned) section.dataset.servicesPinned = "";
      else delete section.dataset.servicesPinned;
      // The frame is not drawn on phones, and each group's picture only there.
      frameShown = frameCol.getClientRects().length > 0;
      rPlates = plates.map((p) => (p.frame && p.fig.getClientRects().length ? measureRange(p.frame) : null));
      rTrack = measureRange(track);
      rCol = measureRange(frameCol);
      rRows = rows.map((r) => measureRange(r.li));
      stageH = stage.offsetHeight;
      boxH = box.offsetHeight;
      // The frame's place in the stage (the stage may be stuck, so from the rects rather than the offsets).
      boxTop = box.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    },
    update(f) {
      if (sleepImage.skip(rSection, f)) return;
      // Each group's picture: its sheet wipes up from the bottom of the screen as it comes into view.
      plates.forEach((p, i) => {
        const r = rPlates[i];
        if (!p.reveal || !p.zoom) return;
        if (!f.tracks || !r) {
          clear(p.reveal, "clipPath");
          clear(p.zoom, "transform");
          if (p.caption) clear(p.caption, "opacity");
          return;
        }
        const top = r.top - f.scroll;
        const rise = (f.vh - top) / f.vh;
        const rv = f.touch ? servicesRevealAt(tween(sinceImage(f.time, p.fig, rise, 0.02), 0, SHEET_S, ease.power3Out)) : servicesReveal(rise);
        setStyle(p.reveal, "clipPath", `inset(${riseInset(rv.r, top, r.height, f.vh).toFixed(2)}% 0 0 0)`);
        setStyle(p.zoom, "transform", `translate3d(0, ${rv.y.toFixed(2)}%, 0) scale(${num(rv.scale)})`);
        if (p.caption) setStyle(p.caption, "opacity", num(rv.r));
      });
      if (!frameShown) {
        // No frame, so no row is the one it shows.
        if (shown >= 0) rows.forEach((r) => flag(r.li, "data-active", false));
        shown = -1;
        return;
      }
      // The row the frame shows.
      const reached = pinned ? servicesIndex(f.scroll, rTrack.top, rTrack.height, f.vh, n) : f.tracks ? rRows.reduce((k, r, i) => (r.top < f.scroll + 0.5 * f.vh ? i : k), 0) : scrollIdx;
      // Scrolling to a new row takes over from a resting pointer, and on the pinned track a hover counts only while the stage holds (not as the list rises under the pointer, or leaves).
      if (reached !== scrollIdx || (pinned && !servicesHold(f.scroll, rTrack.top, rTrack.height, f.vh))) hoverIdx = null;
      scrollIdx = reached;
      // While the page is held the frame keeps its picture: a click on a row moves focus and the transition's cover passes under the pointer, and neither may swap the picture just chosen.
      const next = engine.locked ? target : (hoverIdx ?? focusIdx ?? (f.tracks ? scrollIdx : target));
      if (next !== target) {
        target = next;
        stack = swapTo(stack, target, f.time, f.reduced);
      }
      if (shown !== target) {
        rows.forEach((r, i) => flag(r.li, "data-active", i === target));
        // The caption says what the service covers, and what the picture arriving is: a client rendering or a study.
        captions.forEach((el, i) => flag(el, "data-on", i === target));
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
      const rise = (f.vh - top) / f.vh;
      const rv = f.touch ? servicesRevealAt(tween(sinceImage(f.time, box, rise, 0.02), 0, SHEET_S, ease.power3Out)) : servicesReveal(rise);
      setStyle(reveal, "clipPath", `inset(${riseInset(rv.r, top, boxH, f.vh).toFixed(2)}% 0 0 0)`);
      setStyle(zoom, "transform", `translate3d(0, ${rv.y.toFixed(2)}%, 0) scale(${num(rv.scale)})`);
      if (caption) setStyle(caption, "opacity", num(rv.r));
    },
    destroy() {
      window.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      list.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
      delete section.dataset.servicesPinned;
    },
  };

  const copy: MotionModule = {
    order: ORDER.services,
    measure(f) {
      sleepCopy.wake();
      rMore = more ? measureRange(more) : null;
      rSlots = slots.map((slot) => measureRange(slot.box));
      if (f.tracks) headLines = resplitIfNeeded(heading, headLines);
      else if (headLines.length) {
        unsplit(heading);
        headLines = [];
      }
    },
    update(f) {
      if (sleepCopy.skip(rSection, f)) return;
      if (!f.tracks) {
        if (eyebrow) clear(eyebrow, "transform");
        for (const slot of slots) if (slot.roll) clear(slot.roll, "transform");
        for (const r of rows) {
          if (r.inner) clear(r.inner, "transform");
          r.rules.forEach((el) => clear(el, "transform"));
          mark(r.li, false);
        }
        if (more) mark(more, false);
        return;
      }
      // Whatever holds focus is in place, whatever the scroll.
      const focused = document.activeElement;
      const show = (slot: (typeof slots)[number], t: number, y: number, meta: boolean) => {
        if (slot.roll) return setStyle(slot.roll, "transform", liftPercent(y));
        const r = slot.row;
        const held = focused instanceof Node && r.li.contains(focused);
        if (r.inner) setStyle(r.inner, "transform", liftPercent(held ? 0 : y));
        r.rules.forEach((el) => setStyle(el, "transform", `scaleX(${num(held ? 1 : t)})`));
        mark(r.li, held || meta);
      };
      // The eyebrow and the heading from the track, as the ground passes night.
      const s = sso(rTrack, f);
      if (eyebrow) setStyle(eyebrow, "transform", liftPercent(sectionLabel(s, LABEL_IN.services)));
      headLines.forEach((line, j) => setStyle(line, "transform", liftPercent(servicesHeading(s, j))));
      if (pinned) {
        // The list from the track too, so the composition is whole as the stage pins.
        slots.forEach((slot, k) => {
          const st = servicesRow(s, k);
          show(slot, st.t, st.y, st.meta);
        });
        if (more) mark(more, servicesRow(s, slots.length - 1).meta);
        return;
      }
      // Flowing: each label and row from its own place (on touch screens, on its own clock from there).
      slots.forEach((slot, k) => {
        const sk = sso(rSlots[k], f);
        const t = f.touch ? tween(sinceCopy(f.time, slot.box, sk, 0.06, LINE_GAP), 0, LINE_S, ease.power3Out) : tween(sk, 0.06, 0.22, ease.power3Out);
        show(slot, t, roll(t, 0), t >= SERVICES_META_ON);
      });
      if (more && rMore) mark(more, tween(sso(rMore, f), 0.06, 0.22, ease.power3Out) >= SERVICES_META_ON);
    },
    zones(f) {
      // On the pinned track the list comes up with the stage; where the section flows, its rows play in on their own.
      return zonesWhere(f, rTrack.top - f.vh, rTrack.top + (pinned ? rTrack.height : f.vh), (g) => servicesPartWay(sso(rTrack, g), headLines.length, pinned ? slots.length : 0, eyebrow !== null));
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
 * Contact: the label, the heading and the paragraph rise line by line from
 * their masks as each comes up, and the actions rise into place after them;
 * the picture's sheet wipes up from the bottom and settles; the title block
 * is drawn in from the left, its cells coming in behind the drawing's edge,
 * left to right along each row. Each part runs from its own place on the
 * screen, so the order holds at every width. Whatever holds focus is in
 * place, whatever the scroll.
 */
function contact(): MotionModule | null {
  const section = one("[data-contact]");
  const heading = section && one("[data-contact-heading]", section);
  const body = section && one("[data-contact-body]", section);
  if (!section || !heading || !body) return null;
  splitting.push(heading, body);
  const label = one("[data-contact-roll]", section);
  const actions = one("[data-contact-actions]", section);
  const pic = one("[data-contact-pic]", section);
  const wipe = one("[data-contact-wipe]", section);
  const img = one("[data-contact-wipe] img", section);
  const caption = one("[data-contact-caption]", section);
  const block = one("[data-contact-block]", section);
  const cells = all("[data-contact-cell]", section);
  let headLines: HTMLElement[] = [];
  let bodyLines: HTMLElement[] = [];
  let rLabel: Range | null = null;
  let rHeading: Range;
  let rBody: Range;
  let rActions: Range | null = null;
  let rPic: Range | null = null;
  let rBlock: Range | null = null;
  // Each shown cell's place, and its rank in its row (left to right).
  let rCells: { el: HTMLElement; r: Range; rank: number }[] = [];
  // Touch screens: the close comes up with the page, so each part plays in on its own clock.
  const since = entranceClock();
  const sleep = sleeper();
  let rSection: Range;

  const reset = () => {
    for (const el of [label, ...headLines, ...bodyLines]) if (el) clear(el, "transform");
    for (const el of [actions, ...cells]) if (el) clear(el, "transform", "opacity");
    if (wipe) clear(wipe, "clipPath");
    if (img) clear(img, "transform");
    if (caption) clear(caption, "opacity");
    if (block) clear(block, "clipPath");
  };

  return {
    order: ORDER.contact,
    measure(f) {
      sleep.wake();
      rSection = measureRange(section);
      if (f.tracks) {
        headLines = resplitIfNeeded(heading, headLines);
        bodyLines = resplitIfNeeded(body, bodyLines);
      } else if (headLines.length || bodyLines.length) {
        reset();
        unsplit(heading);
        unsplit(body);
        headLines = [];
        bodyLines = [];
      }
      rLabel = label ? measureRange(label) : null;
      rHeading = measureRange(heading);
      rBody = measureRange(body);
      rActions = actions ? measureRange(actions) : null;
      rPic = pic ? measureRange(pic) : null;
      rBlock = block ? measureRange(block) : null;
      const shown = cells.filter((el) => el.offsetParent).map((el) => ({ el, r: measureRange(el), rank: 0 }));
      for (const c of shown) c.rank = shown.filter((o) => Math.abs(o.r.top - c.r.top) < 2 && o.r.left < c.r.left).length;
      rCells = shown;
    },
    update(f) {
      if (sleep.skip(rSection, f)) return;
      if (!f.tracks) return reset();
      const focused = document.activeElement;
      const holds = (el: HTMLElement | null) => !!el && focused instanceof Node && el.contains(focused);
      // How far a part is in from its own clock, `delay` s after it starts (touch screens).
      const played = (key: HTMLElement, s: number, from: number, duration: number, curve: (t: number) => number, gap = 0, delay = 0) => tween(since(f.time, key, s, from, gap), delay, duration, curve);
      // A masked line: on touch screens all of a block's lines start together as it comes up, 0.07s apart.
      const line = (el: HTMLElement, s: number, j: number) => (f.touch ? roll(played(el, s, 0.06, LINE_S, ease.power3Out, LINE_GAP), 0) : contactLine(s, j));
      if (label && rLabel) setStyle(label, "transform", liftPercent(line(label, sso(rLabel, f), 0)));
      const sh = sso(rHeading, f);
      headLines.forEach((el, j) => setStyle(el, "transform", liftPercent(line(el, sh, j))));
      const sb = sso(rBody, f);
      bodyLines.forEach((el, j) => setStyle(el, "transform", liftPercent(line(el, sb, j))));
      if (actions && rActions) {
        const sa = sso(rActions, f);
        const st = holds(actions) ? { y: 0, opacity: 1 } : f.touch ? contactRiseAt(played(actions, sa, 0.06, BLOCK_S, ease.power3Out)) : contactRise(sa);
        setStyle(actions, "transform", st.y > 0.005 ? lift(st.y) : "none");
        setStyle(actions, "opacity", num(st.opacity));
      }
      if (pic && rPic) {
        const sp = sso(rPic, f);
        const st = f.touch ? contactPictureAt(played(pic, sp, 0.04, SHEET_S, ease.power3Out)) : contactPicture(sp);
        if (wipe) setStyle(wipe, "clipPath", `inset(${riseInset(st.t, rPic.top - f.scroll, rPic.height, f.vh).toFixed(2)}% 0 0 0)`);
        if (img) setStyle(img, "transform", st.scale > 1.00005 ? `scale(${num(st.scale)})` : "none");
        if (caption) setStyle(caption, "opacity", num(st.t));
      }
      if (block && rBlock) {
        const sk = sso(rBlock, f);
        const draw = holds(block) ? 1 : f.touch ? played(block, sk, 0.02, LINE_S, ease.power2InOut) : contactBlock(sk);
        // Written out even when drawn: the tracks' initial state in globals.css holds the block undrawn until now.
        setStyle(block, "clipPath", draw < 0.9995 ? `inset(0 ${((1 - draw) * 100).toFixed(2)}% 0 0)` : "none");
      }
      for (const c of rCells) {
        const sc = sso(c.r, f);
        // On touch screens a cell follows the drawing's edge in: 0.15s after it starts, and 0.12s more for each cell before it in its row.
        const st = holds(c.el) ? { y: 0, opacity: 1 } : f.touch ? contactRiseAt(played(c.el, sc, 0.06, 0.6, ease.power3Out, 0.06, 0.15 + c.rank * 0.12), 12) : contactCell(sc, c.rank);
        setStyle(c.el, "transform", st.y > 0.005 ? lift(st.y) : "none");
        setStyle(c.el, "opacity", num(st.opacity));
      }
    },
  };
}

/*
 * Splitter: every block of text the modules split into lines, split
 * together before any of them measures, so finding where all their lines
 * break lays the page out twice in all rather than twice a block
 * (split.ts). The modules then find their lines already split. (Values
 * splits its own descriptions, together, once it has set the width they
 * wrap to.)
 */
function splitter(targets: HTMLElement[]): MotionModule {
  return {
    order: ORDER.lines,
    measure(f) {
      if (f.tracks) splitAll(targets);
    },
    update() {},
  };
}

export function HomeMotion() {
  useEffect(() => {
    const shared: Shared = { fade: 0 };
    splitting = [];
    const modules = [ground(shared), hero(), intro(), story(), works(), making(), values(shared), ...services(), handover(), contact()].filter((m): m is MotionModule => Boolean(m));
    modules.push(splitter(splitting));
    const offs = modules.map((m) => engine.register(m));
    return () => offs.forEach((off) => off());
  }, []);
  return null;
}
