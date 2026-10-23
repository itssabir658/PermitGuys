"use client";

import { useEffect } from "react";
import { ORDER, engine, hso, measureRange, setStyle, sso, type Frame, type MotionModule, type Range } from "@/lib/motion/engine";
import {
  ORBIT,
  contactReveal,
  heroState,
  introLine,
  introPhases,
  introProgress,
  orbitItem,
  pageGround,
  servicesHeadingLine,
  servicesReveal,
  servicesW,
  valuesImage,
  valuesLine,
  valuesText,
  worksButtonLive,
  worksElement,
  worksImageScale,
  worksT,
} from "@/lib/motion/home";
import { clamp, damp, toHex } from "@/lib/motion/math";
import { resplitIfNeeded, splitLines, unsplit } from "@/lib/motion/split";

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
 * on (Contact brings its own ivory, the footer its own charcoal). Published
 * as --ground too, so the phone header bar always matches it. The still
 * layout keeps the stylesheet's grounds: ivory, then Services' own charcoal.
 */
function ground(shared: Shared): MotionModule | null {
  const works = one("[data-works]");
  const services = one("[data-services]");
  const contact = one("[data-contact]");
  if (!works || !services || !contact) return null;
  const html = document.documentElement;
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
        setStyle(html, "--ground", "");
        setStyle(services, "backgroundColor", "");
        shared.fade = 0;
        setNight(false);
        return;
      }
      const g = pageGround(sso(rWorks, f), hso(rWorks, f), sso(rServices, f));
      shared.fade = g.fade;
      const color = toHex(g.color);
      setStyle(document.body, "backgroundColor", color);
      setStyle(html, "--ground", color);
      // On the tracks Services shows the night ground through itself.
      setStyle(services, "backgroundColor", "transparent");
      // Night until Contact's ivory reaches the header.
      setNight(g.fade > 0.5 && rContact.top - f.scroll > 64);
    },
    destroy() {
      setStyle(document.body, "backgroundColor", "");
      setStyle(html, "--ground", "");
      setStyle(services, "backgroundColor", "");
      delete html.dataset.ground;
    },
  };
}

/* Hero: the name rises and the statement sinks, both fading, over the second half of the track. */
function hero(): MotionModule | null {
  const section = one("[data-home-hero]");
  const heading = one("[data-hero-heading]");
  const sub = one("[data-hero-sub]");
  if (!section || !heading || !sub) return null;
  let r: Range;
  return {
    order: ORDER.hero,
    measure() {
      r = measureRange(section);
    },
    update(f) {
      if (!f.tracks) {
        clear(heading, "transform", "opacity");
        clear(sub, "transform", "opacity");
        return;
      }
      const s = heroState(f.scroll, r.top, r.height, f.vh);
      setStyle(heading, "transform", lift(s.headingY));
      setStyle(heading, "opacity", num(s.opacity));
      setStyle(sub, "transform", lift(s.subY));
      setStyle(sub, "opacity", num(s.opacity));
    },
  };
}

/* Intro: six studies orbit the centre while two paragraphs pass through it. */
function intro(): MotionModule | null {
  const section = one("[data-intro]");
  if (!section) return null;
  const items = all("[data-orbit-slot]", section);
  const copies = all("[data-intro-copy]", section);
  const { copyIn, sectionVh } = introPhases(copies.length);
  let r: Range;
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
    },
    update(f) {
      // Without the tracks: a still ring, every study spread out, the paragraphs as text.
      const { e, exit } = f.tracks ? introProgress(sso(r, f), sectionVh / 100) : { e: ORBIT.spreadVh + 0.25, exit: 0 };
      for (const el of items) {
        const o = orbitItem(Number(el.dataset.orbitSlot), e, exit, f.vw, f.vh);
        setStyle(el, "transform", `translate(-50%, -50%) translate3d(${px(o.x)}, ${px(o.y)}, 0) scale(${num(o.scale)})`);
        setStyle(el, "opacity", num(o.opacity));
      }
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

/* Works: each study's text resolves at its panel's moment, nested title → type → button. */
function works(): MotionModule | null {
  const section = one("[data-works]");
  if (!section) return null;
  const panels = all("[data-works-panel]", section);
  const images = panels.map((p) => one("[data-works-image]", p)).filter((el): el is HTMLElement => Boolean(el));
  const parts = all("[data-works-item]", section).map((item) => ({
    title: one("[data-works-title]", item)!,
    type: one("[data-works-type]", item)!,
    button: one("[data-works-button]", item)!,
  }));
  let ranges: Range[] = [];
  // Keyboard: focusing a study's button scrolls to its moment, where it is visible.
  const onFocus = (event: FocusEvent) => {
    const i = parts.findIndex((p) => p.button.contains(event.target as Node));
    if (i >= 0 && ranges[i] && engine.frame.tracks) engine.scrollTo(ranges[i].top + 0.25 * engine.frame.vh);
  };
  section.addEventListener("focusin", onFocus);
  const apply = (el: HTMLElement, s: { opacity: number; y: number }) => {
    setStyle(el, "opacity", num(s.opacity));
    setStyle(el, "transform", lift(s.y));
  };
  return {
    order: ORDER.works,
    measure() {
      ranges = panels.map(measureRange);
    },
    update(f) {
      if (!f.tracks) {
        for (const p of parts) {
          clear(p.title, "opacity", "transform");
          clear(p.type, "opacity", "transform");
          clear(p.button, "opacity", "transform", "pointerEvents");
        }
        images.forEach((img) => clear(img, "transform"));
        return;
      }
      ranges.forEach((r, i) => {
        const t = worksT(sso(r, f));
        const p = parts[i];
        if (p) {
          apply(p.title, worksElement(t, 0, 60));
          apply(p.type, worksElement(t, 1, 60));
          apply(p.button, worksElement(t, 2, 40));
          setStyle(p.button, "pointerEvents", worksButtonLive(t) ? "auto" : "none");
        }
        if (images[i]) setStyle(images[i], "transform", `translate3d(0, 100px, 0) scale(${num(worksImageScale(t))})`);
      });
    },
    destroy() {
      section.removeEventListener("focusin", onFocus);
    },
  };
}

/* Values: pictures grow at their moment; one pinned title and description, ivory where they cross the picture. */
function values(shared: Shared): MotionModule | null {
  const section = one("[data-values]");
  const mask = section && one("[data-values-mask]", section);
  if (!section || !mask) return null;
  const outers = all("[data-values-outer]", section);
  const frames = outers.map((o) => one("[data-values-frame]", o)!);
  const images = outers.map((o) => one("[data-values-image]", o)!);
  const titles = all("[data-values-title]", section);
  const descs = all("[data-values-desc]", section);
  const data = outers.map((o) => ({ title: o.dataset.title ?? "", desc: o.dataset.desc ?? "" }));
  let rSection: Range;
  let rOuters: Range[] = [];
  let rFrames: Range[] = [];
  let active = 0;
  let lines: HTMLElement[][] = descs.map(() => []);

  const show = (i: number, f: Frame) => {
    active = i;
    for (const t of titles) t.textContent = data[i].title;
    for (const d of descs) {
      d.dataset.splitText = data[i].desc;
      if (!f.tracks) d.textContent = data[i].desc;
    }
    lines = f.tracks ? descs.map(splitLines) : descs.map(() => []);
  };

  return {
    order: ORDER.values,
    measure(f) {
      rSection = measureRange(section);
      rOuters = outers.map(measureRange);
      rFrames = frames.map(measureRange);
      if (f.tracks) lines = descs.map((d, i) => resplitIfNeeded(d, lines[i]));
      else if (lines.some((l) => l.length)) {
        descs.forEach(unsplit);
        lines = descs.map(() => []);
      }
    },
    update(f) {
      if (!f.tracks) {
        images.forEach((img) => clear(img, "transform", "filter"));
        return;
      }
      const xs = rOuters.map((r) => (f.scroll - r.top) / f.vh);
      let s = 0;
      xs.forEach((x, i) => {
        if (Math.abs(x) < Math.abs(xs[s])) s = i;
      });
      if (s !== active) show(s, f);

      images.forEach((img, i) => {
        const st = valuesImage(xs[i], shared.fade);
        setStyle(img, "transform", `scale(${num(st.scale)})`);
        setStyle(img, "filter", `brightness(${num(st.brightness)})`);
      });

      const tx = valuesText(xs[s]);
      for (const t of titles) {
        setStyle(t, "opacity", num(clamp(tx.titleOpacity)));
        setStyle(t, "transform", lift(tx.titleY));
      }
      descs.forEach((d, k) => {
        setStyle(d, "opacity", num(tx.descOpacity));
        setStyle(d, "transform", lift(tx.descY));
        lines[k].forEach((line, j) => setStyle(line, "transform", liftPercent(valuesLine(tx.a, j, lines[k].length).yPercent)));
      });

      // Clip the ivory copy to the active picture's outline, as it is drawn right now.
      const fr = rFrames[s];
      const scale = valuesImage(xs[s], 0).scale;
      const w = fr.width * scale;
      const h = fr.height * scale;
      const cx = fr.left + fr.width / 2;
      const cy = fr.top - f.scroll + fr.height / 2;
      const stageTop = Math.min(Math.max(rSection.top - f.scroll, 0), rSection.top + rSection.height - f.scroll - f.vh);
      setStyle(mask, "clipPath", `inset(${px(cy - h / 2 - stageTop)} ${px(f.vw - (cx + w / 2))} ${px(stageTop + f.vh - (cy + h / 2))} ${px(cx - w / 2)})`);
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
