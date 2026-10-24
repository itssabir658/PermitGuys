"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ORDER, engine, measureRange, screenRatio, setStyle, type Frame, type Range } from "@/lib/motion/engine";
import { footerLift, footerProgress } from "@/lib/motion/footer";
import { clamp, ease, fit } from "@/lib/motion/math";

/*
 * Starts the scroll engine (Lenis and the frame loop) and adds the motion
 * shared by every page (docs/MOTION.md):
 *   - parallax: [data-parallax] pictures sit at 120% and drift through a
 *     tenth of their height as they cross the screen ("slow": 110%, half
 *     the drift);
 *   - roll links: [data-roll] labels roll their characters on hover and
 *     keyboard focus, and roll back from wherever they have got to (the
 *     bottom row of characters is built on first use, see RollText);
 *   - the footer: its content rises out from under the sheet above it as it
 *     comes up.
 * Renders nothing.
 */

const ROLL_DURATION = 0.4;
const ROLL_STAGGER = 0.02;

interface Roll {
  time: number;
  dir: 1 | -1;
  top: HTMLElement[];
  bottom: HTMLElement[];
}

function rollLinks() {
  const rolls = new Map<HTMLElement, Roll>();
  const hostOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>("a, button") : null);
  const labelsOf = (host: HTMLElement) => [...host.querySelectorAll<HTMLElement>("[data-roll]")];
  // The bottom copy: each word's top row, cloned under it (out of sight until it rolls in).
  const bottomRows = (roll: HTMLElement) => {
    for (const top of roll.querySelectorAll<HTMLElement>("[data-roll-top]")) {
      if (top.nextElementSibling?.hasAttribute("data-roll-bottom")) continue;
      const bottom = top.cloneNode(true) as HTMLElement;
      bottom.removeAttribute("data-roll-top");
      bottom.setAttribute("data-roll-bottom", "");
      bottom.classList.add("roll__row--bottom");
      top.after(bottom);
    }
  };

  const set = (host: HTMLElement | null, dir: 1 | -1) => {
    if (!host || engine.frame.reduced) return;
    for (const roll of labelsOf(host)) {
      const state = rolls.get(roll);
      if (state) state.dir = dir;
      else if (dir === 1) {
        bottomRows(roll);
        rolls.set(roll, {
          time: 0,
          dir,
          top: [...roll.querySelectorAll<HTMLElement>("[data-roll-top] > *")],
          bottom: [...roll.querySelectorAll<HTMLElement>("[data-roll-bottom] > *")],
        });
      }
    }
  };
  const over = (e: Event) => {
    const host = hostOf(e.target);
    if (host && !host.contains((e as PointerEvent).relatedTarget as Node | null)) set(host, 1);
  };
  const out = (e: Event) => {
    const host = hostOf(e.target);
    if (host && !host.contains((e as PointerEvent).relatedTarget as Node | null)) set(host, -1);
  };
  const focus = (e: Event) => {
    const host = hostOf(e.target);
    if (host?.matches(":focus-visible")) set(host, 1);
  };
  const blur = (e: Event) => set(hostOf(e.target), -1);

  const tick = (f: Frame) => {
    rolls.forEach((r, el) => {
      const total = ROLL_DURATION + (r.top.length - 1) * ROLL_STAGGER;
      r.time = clamp(r.time + r.dir * f.dt, 0, total);
      r.top.forEach((c, i) => {
        const p = ease.power1InOut(clamp((r.time - i * ROLL_STAGGER) / ROLL_DURATION));
        setStyle(c, "transform", `translate3d(0, ${(-100 * p).toFixed(2)}%, 0)`);
        setStyle(r.bottom[i], "transform", `translate3d(0, ${(100 - 100 * p).toFixed(2)}%, 0)`);
      });
      if (r.dir === -1 && r.time === 0) rolls.delete(el);
    });
  };

  document.addEventListener("pointerover", over);
  document.addEventListener("pointerout", out);
  document.addEventListener("focusin", focus);
  document.addEventListener("focusout", blur);
  const off = engine.onFrame(tick);
  return () => {
    off();
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
    document.removeEventListener("focusin", focus);
    document.removeEventListener("focusout", blur);
  };
}

/** Pictures drift inside their frames: y = fit(screenRatio, −1, 1, −travel, travel). */
function parallax() {
  let items: { el: HTMLElement; frame: Range; travel: number; scale: number }[] = [];
  return engine.register({
    order: ORDER.parallax,
    measure(f) {
      items = [...document.querySelectorAll<HTMLElement>("[data-parallax]")].flatMap((el) => {
        const holder = el.parentElement;
        if (!holder) return [];
        const slow = el.dataset.parallax === "slow";
        const scale = slow ? 1.1 : 1.2;
        if (f.reduced) {
          setStyle(el, "transform", "");
          return [];
        }
        return [{ el, frame: measureRange(holder), travel: ((scale - 1) / 2) * el.offsetHeight, scale }];
      });
    },
    update(f) {
      for (const it of items) {
        const y = fit(screenRatio(it.frame, f), -1, 1, -it.travel, it.travel);
        setStyle(it.el, "transform", `translate3d(0, ${y.toFixed(2)}px, 0) scale(${it.scale})`);
      }
    },
  });
}

/*
 * The footer, on every page: its content rises out from under the sheet
 * above it. A pure function of the scroll (lib/motion/footer.ts), so it
 * plays back on the way up. With reduced motion or on the still layout it
 * simply sits in place.
 */
function footer() {
  const el = document.querySelector<HTMLElement>("body > footer");
  const inner = el?.firstElementChild;
  if (!el || !(inner instanceof HTMLElement)) return () => {};
  let r: Range;
  let height = 0;
  return engine.register({
    order: ORDER.footer,
    measure() {
      r = measureRange(el);
      height = document.documentElement.scrollHeight;
    },
    update(f) {
      if (f.reduced || !f.tracks) {
        setStyle(inner, "transform", "");
        return;
      }
      const x = footerProgress(f.scroll, f.vh, r.top, r.height, height);
      const y = footerLift(x, r.height, f.vh);
      setStyle(inner, "transform", y < -0.005 ? `translate3d(0, ${y.toFixed(2)}px, 0)` : "");
    },
  });
}

export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    engine.boot();
    // Every full load starts at the top, as on the reference (a link to a fragment still lands on it).
    if (!location.hash) engine.scrollTo(0, true);
    const offRoll = rollLinks();
    const offParallax = parallax();
    const offFooter = footer();
    return () => {
      offRoll();
      offParallax();
      offFooter();
    };
  }, []);

  // New page content: re-read the layout once it has painted. The first page needs no second reading: the engine measures it as its motion registers.
  const measuredPath = useRef(pathname);
  useEffect(() => {
    if (pathname === measuredPath.current) return;
    measuredPath.current = pathname;
    const raf = requestAnimationFrame(engine.requestMeasure);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
