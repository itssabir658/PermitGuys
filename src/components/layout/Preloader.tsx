"use client";

import { useEffect, useRef } from "react";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { openingAssets } from "@/lib/motion/opening";
import { OntarioOutline } from "./OntarioOutline";

/*
 * The load sequence, on every full page load.
 *
 * A graphite screen is in place before first paint and the outline of
 * Ontario draws itself (CSS, so it starts before any script runs): the
 * mainland over 0.9s, the islands overlapping its end; the GTA dot pops at
 * 0.95s and rings out once. The screen waits for the strokes (about 1.35s;
 * the dot finishes popping as the exit sets off), the fonts and the opening
 * pictures (openingAssets), and for at least 1.25s from navigation. The
 * page underneath is first measured only once the strokes are drawn and
 * the fonts are in, and the screen waits for that too: on a phone the
 * measure takes the main thread for a few frames, which would stall the
 * strokes mid-line (the dot's pop and ring run on the compositor).
 *
 * Then, T₀: the page is put back at the top and the document gets
 * data-loaded and data-revealed, so the page's own entrance (the hero, the
 * header, an inner page's title) plays as the screen opens. The drawing
 * grows 2.4× around the dot and fades (0.7s, accelerating), and from 0.25s
 * an iris opens from the dot itself (1s, --e-sheet; a registered --hole
 * radius in the screen's mask, globals.css). The hero picture settles from
 * the same point. data-preloaded marks the end and removes the screen.
 * Browsers without registered custom properties get a 0.6s fade instead.
 *
 * The page is held still while the screen is up (an impatient wheel would
 * otherwise scroll the hero away before its entrance) and released at 70%
 * of the iris, when it no longer looks held, or 8s after navigation
 * whatever happens. From data-loaded on, the screen lets the pointer through
 * to the page (globals.css).
 *
 * `motionScript` runs in the document head before first paint. It turns the
 * sequence on only for visitors who allow motion and have JavaScript, and
 * sets every flag after 8s whatever happens, so the page can never be held.
 */
export const motionScript = `(function(){var d=document.documentElement;try{history.scrollRestoration="manual"}catch(e){}var go=function(){d.dataset.loaded="";d.dataset.revealed="";d.dataset.preloaded=""};if(matchMedia("(prefers-reduced-motion: reduce)").matches)go();else d.dataset.motion="";setTimeout(function(){if(!("preloaded" in d.dataset))go()},8000)})()`;

/** From navigation start, the shortest the drawing is shown (it finishes at about 1.35s; the dot's pop ends during the exit's slow start). */
const MIN_MS = 1250;
/** From navigation start, as the head script: the page is released by then whatever happens. */
const SAFETY_MS = 8000;
/** Never hold the page for slow assets longer than this. */
const ASSET_CAP_MS = 3500;
const SHRINK_MS = 700;
const IRIS_DELAY_MS = 250;
const IRIS_MS = 1000;

export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = ref.current;
    if (!el || "loaded" in html.dataset) return;
    engine.boot();
    engine.lock("preloader");
    // Timed from navigation, not from hydration, so a slow script cannot hold the page past the head script's 8s.
    const safety = window.setTimeout(() => engine.unlock("preloader"), Math.max(0, SAFETY_MS - performance.now()));
    let release = 0;
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    // Only the strokes are waited for: the dot pops as the mainland closes and finishes during the exit's slow start, and its ring rings out through the exit.
    const drawing = el.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSAnimation && (a.animationName === "dot-in" || a.animationName === "dot-pulse")));
    const drawn = Promise.all(drawing.map((a) => a.finished.catch(() => undefined)));
    const fonts = Promise.race([document.fonts?.ready, wait(ASSET_CAP_MS)]);
    // The page underneath is first measured once the strokes are drawn and the fonts are in (engine.measureAfter), and the screen waits for that measure.
    const measured = engine.measureAfter(Promise.race([Promise.all([drawn, fonts]), wait(Math.max(0, SAFETY_MS - performance.now()))]));
    const assets = Promise.all([document.fonts?.ready, ...openingAssets()]);

    Promise.all([drawn, measured, Promise.race([assets, wait(ASSET_CAP_MS)]), wait(Math.max(0, MIN_MS - performance.now()))]).then(() => {
      if (cancelled) return;
      // Too late: the head script has already revealed the page (8s), so leave the page where the visitor has it.
      if ("preloaded" in html.dataset) {
        engine.unlock("preloader");
        return;
      }
      // The iris and the hero's settle open from the dot, wherever the drawing put it.
      const dot = el.querySelector(".ontario__dot")?.getBoundingClientRect();
      const x = dot ? dot.left + dot.width / 2 : window.innerWidth / 2;
      const y = dot ? dot.top + dot.height / 2 : window.innerHeight / 2;
      // On the screen and the hero's stage only: set on the root, a custom property restyles the whole document, just as the screen opens.
      for (const target of [el, ...document.querySelectorAll<HTMLElement>("[data-hero-stage]")]) {
        target.style.setProperty("--iris-x", `${x.toFixed(1)}px`);
        target.style.setProperty("--iris-y", `${y.toFixed(1)}px`);
      }
      // Back at the top before anything shows (data-loaded is what scripts and tests wait for).
      engine.scrollTo(0, true);
      html.dataset.loaded = "";
      html.dataset.revealed = "";
      const done = () => {
        html.dataset.preloaded = "";
      };
      const unlockAt = (ms: number) => {
        release = window.setTimeout(() => {
          if (!cancelled) engine.unlock("preloader");
        }, ms);
      };
      if (!("registerProperty" in CSS)) {
        const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 100, easing: cssEase.power1Out, fill: "forwards" });
        unlockAt(100 + 0.7 * 600);
        fade.finished.then(done, done);
        return;
      }
      const inner = el.querySelector<HTMLElement>(".preloader__inner");
      if (inner) {
        const box = inner.getBoundingClientRect();
        inner.style.transformOrigin = `${(x - box.left).toFixed(1)}px ${(y - box.top).toFixed(1)}px`;
        inner.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(2.4)", opacity: 0 }], { duration: SHRINK_MS, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" });
      }
      // Just past the farthest corner, so the whole of the ease is seen.
      const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 2;
      const iris = el.animate([{ "--hole": "0px" }, { "--hole": `${Math.ceil(reach)}px` }], { duration: IRIS_MS, delay: IRIS_DELAY_MS, easing: cssEase.sheet, fill: "forwards" });
      unlockAt(IRIS_DELAY_MS + 0.7 * IRIS_MS);
      iris.finished.then(done, done);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      window.clearTimeout(release);
      engine.unlock("preloader");
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="preloader">
      <div className="preloader__inner">
        <OntarioOutline className="preloader__map" />
        <p className="preloader__label">
          <span>Ontario</span>
          <span>Greater Toronto Area</span>
        </p>
      </div>
    </div>
  );
}
