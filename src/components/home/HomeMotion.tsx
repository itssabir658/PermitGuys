"use client";

import { useEffect } from "react";
import { ORDER, engine, hso, measureRange, setStyle, sso, type Frame, type MotionModule, type Range } from "@/lib/motion/engine";
import {
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
  servicesHeadingLine,
  servicesReveal,
  servicesW,
  MASK,
  roll,
  valuesDescLine,
  valuesImage,
  valuesTitle,
  worksLine,
  worksStudy,
  type OrbitPath,
} from "@/lib/motion/home";
import { clamp, damp, ease, mix, toHex, tween } from "@/lib/motion/math";
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

function clear(el: HTMLElement, ...props: string[]) {
  for (const p of props) setStyle(el, p, "");
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
  const n = items.length;
  let r: Range;
  /** Screens the stage stays pinned (the section's height − 1 screen), shared by the studies. */
  let D = 1;
  let stageH = 0;
  let frameTop = 0;
  let frameH = 0;
  let titleLines: HTMLElement[][] = items.map(() => []);
  // Keyboard: focusing a study's button scrolls to the middle of its moment, where it is composed.
  const onFocus = (event: FocusEvent) => {
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
        // The button travels 1.3 × as far, so its focus ring clears the mask too; it takes the pointer only while it is in place.
        const by = worksLine(e, i, n, D, L + 1);
        if (it.button) setStyle(it.button, "transform", liftPercent(by * 1.3));
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
  // The ink copy first, then the ivory one inside the mask.
  const copies = all(".values-text", stage).map((root) => ({ root, titles: all("[data-values-title]", root), rolls: all("[data-values-roll]", root), descs: all("[data-values-desc]", root) }));
  const n = outers.length;
  let rSection: Range;
  let rOuters: Range[] = [];
  let rFrames: Range[] = [];
  let stageH = 0;
  let lines: HTMLElement[][][] = copies.map((c) => c.descs.map(() => []));

  /** Below 1024px each word is fitted a little wider than the picture (frame × 1.3, within the gutters), the same size in both copies, so the picture's edges split every word. */
  const fitTitles = (f: Frame, frameW: number) => {
    for (const c of copies) c.titles.forEach((t) => setStyle(t, "fontSize", ""));
    const ink = copies[0];
    if (!ink || !f.tracks || f.vw >= 1024 || !frameW) return;
    const gutter = parseFloat(getComputedStyle(ink.root).paddingLeft) || 0;
    const target = Math.min(f.vw - 2 * gutter, frameW * 1.3);
    // All reads first, then the writes.
    const sizes = ink.rolls.map((el) => ({ w0: el.offsetWidth, base: parseFloat(getComputedStyle(el).fontSize) }));
    sizes.forEach(({ w0, base }, i) => {
      if (!w0 || !base) return;
      const size = px(clamp((base * target) / w0, 0.85 * base, 1.9 * base));
      for (const c of copies) if (c.titles[i]) setStyle(c.titles[i], "fontSize", size);
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

      // Every word and description line from its own value's x, in both copies.
      xs.forEach((x, i) => {
        const y = liftPercent(valuesTitle(x, i, n));
        for (const c of copies) if (c.rolls[i]) setStyle(c.rolls[i], "transform", y);
      });
      lines.forEach((c) => c.forEach((ls, i) => ls.forEach((line, k) => setStyle(line, "transform", liftPercent(valuesDescLine(xs[i], i, n, k))))));

      // Clip the ivory copy to every picture on screen, as each is drawn right now, in the stage's own px.
      const stageTop = Math.min(Math.max(rSection.top - f.scroll, 0), rSection.top + rSection.height - f.scroll - stageH);
      let d = "";
      xs.forEach((x, i) => {
        const fr = rFrames[i];
        if (!fr || Math.abs(x) >= 1.2) return;
        const scale = valuesImage(x, 0).scale;
        const w = fr.width * scale;
        const h = fr.height * scale;
        const cx = fr.left + fr.width / 2;
        const cy = fr.top - f.scroll + fr.height / 2 - stageTop;
        const [l, t, rr, b] = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2].map((v) => v.toFixed(2));
        d += `M${l} ${t}H${rr}V${b}H${l}Z`;
      });
      setStyle(mask, "clipPath", d ? `path('${d}')` : "inset(50%)");
    },
  };
}

/* Services: the frame wipes in and settles; the strip follows the hovered, focused or scrolled-to service. */
function services(): MotionModule[] {
  const section = one("[data-services]");
  const track = section && one("[data-services-track]", section);
  const frameCol = section && one("[data-services-frame]", section);
  const reveal = section && one("[data-services-reveal]", section);
  const zoom = section && one("[data-services-zoom]", section);
  const strip = section && one("[data-services-strip]", section);
  const heading = section && one("[data-services-heading]", section);
  const body = section && one("[data-services-body]", section);
  if (!section || !track || !frameCol || !reveal || !zoom || !strip || !heading || !body) return [];
  const items = all("[data-service-index]", section);
  const desktop = matchMedia("(min-width: 768px)");
  const phoneTrack = matchMedia("(max-width: 767px) and (min-height: 700px)");
  let target = 0;
  let pos = 0;
  let shown = -1;
  let rTrack: Range, rFrame: Range, rHeading: Range, rBody: Range;
  let headLines: HTMLElement[] = [];

  const listeners = items.map((li, i) => {
    const enter = () => {
      if (desktop.matches) target = i;
    };
    const focus = () => {
      target = i;
    };
    li.addEventListener("pointerenter", enter);
    li.addEventListener("focusin", focus);
    return () => {
      li.removeEventListener("pointerenter", enter);
      li.removeEventListener("focusin", focus);
    };
  });

  const image: MotionModule = {
    order: ORDER.servicesImage,
    measure() {
      rTrack = measureRange(track);
      rFrame = measureRange(frameCol);
    },
    update(f) {
      const phone = f.tracks && phoneTrack.matches;
      const rv = f.tracks ? servicesReveal(phone ? sso(rTrack, f) : sso(rFrame, f)) : { inset: 0, scale: 1 };
      setStyle(reveal, "clipPath", `inset(0 0 ${rv.inset.toFixed(2)}% 0)`);
      setStyle(zoom, "transform", `scale(${num(rv.scale)})`);
      if (phone) {
        // On phones the row comes from how far the pinned list has been scrolled.
        const p = clamp((f.scroll - rTrack.top) / Math.max(1, rTrack.height - f.vh));
        target = Math.min(items.length - 1, Math.floor(p * items.length));
        pos = target;
      } else if (f.reduced) pos = target;
      else pos = damp(pos, target, 12, f.dt);
      setStyle(strip, "transform", `translate3d(0, ${(-pos * 100).toFixed(3)}%, 0)`);
      if (shown !== target) {
        items[shown]?.removeAttribute("data-active");
        items[target]?.setAttribute("data-active", "");
        shown = target;
      }
    },
    destroy() {
      listeners.forEach((off) => off());
    },
  };

  const list: MotionModule = {
    order: ORDER.services,
    measure(f) {
      rHeading = measureRange(heading);
      rBody = measureRange(body);
      if (f.tracks) headLines = resplitIfNeeded(heading, headLines);
      else if (headLines.length) {
        unsplit(heading);
        headLines = [];
      }
    },
    update(f) {
      // On the phone track the heading and rows are pinned, so they are simply shown.
      const phone = phoneTrack.matches;
      if (!f.tracks || phone) items.forEach((li) => clear(li, "opacity", "transform"));
      if (!f.tracks) return;
      const w0 = phone ? 1 : servicesW(sso(rHeading, f), 0);
      headLines.forEach((line, j) => setStyle(line, "transform", liftPercent(servicesHeadingLine(w0, j, headLines.length).yPercent)));
      if (phone) return;
      const x = sso(rBody, f);
      items.forEach((li, i) => {
        const W = servicesW(x, i + 1);
        setStyle(li, "opacity", num(W));
        setStyle(li, "transform", lift((1 - W) * 40));
      });
    },
  };
  return [image, list];
}

/* Contact: each piece rises 28px into place over its own stretch of scroll. */
function contact(): MotionModule | null {
  const els = all("[data-contact-reveal]");
  if (!els.length) return null;
  let ranges: Range[] = [];
  return {
    order: ORDER.contact,
    measure() {
      ranges = els.map(measureRange);
    },
    update(f) {
      els.forEach((el, i) => {
        if (!f.tracks) return clear(el, "opacity", "transform");
        const c = contactReveal(sso(ranges[i], f));
        setStyle(el, "opacity", num(c.opacity));
        setStyle(el, "transform", lift(c.y));
      });
    },
  };
}

export function HomeMotion() {
  useEffect(() => {
    const shared: Shared = { fade: 0 };
    const modules = [ground(shared), hero(), intro(), works(), values(shared), ...services(), contact()].filter((m): m is MotionModule => Boolean(m));
    const offs = modules.map((m) => engine.register(m));
    return () => offs.forEach((off) => off());
  }, []);
  return null;
}
