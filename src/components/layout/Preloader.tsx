"use client";

import { useEffect, useRef } from "react";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { OntarioOutline } from "./OntarioOutline";

/*
 * The load sequence (docs/MOTION.md, "Load sequence").
 *
 * On every full page load a graphite screen is in place before first paint
 * and the outline of Ontario draws itself in five strokes (0.7s each, 0.14s
 * apart; CSS, so it starts before any script runs). The screen waits for
 * the drawing, the fonts and the opening picture, and for at least 0.6s,
 * then fades away over 0.6s. That moment is T₀: the document gets
 * data-loaded and data-revealed, the header fades in at T₀ + 1.6s and the
 * hero's name rises at T₀ + 1.5s (globals.css).
 *
 * The page is held at the top while the screen is up (an impatient wheel
 * would otherwise scroll the whole hero entrance away unseen) and released
 * as the screen starts to leave, or after 8s whatever happens.
 *
 * `motionScript` runs in the document head before first paint. It turns the
 * sequence on only for visitors who allow motion and have JavaScript, and
 * releases the page after 8s whatever happens.
 */
export const motionScript = `(function(){var d=document.documentElement;try{history.scrollRestoration="manual"}catch(e){}var go=function(){d.dataset.loaded="";d.dataset.revealed=""};if(matchMedia("(prefers-reduced-motion: reduce)").matches)go();else d.dataset.motion="";setTimeout(function(){if(!("loaded" in d.dataset))go()},8000)})()`;

const MIN_MS = 600;
/** Never hold the page for slow assets longer than this. */
const ASSET_CAP_MS = 3500;

export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = ref.current;
    if (!el || "loaded" in html.dataset) return;
    engine.boot();
    engine.lock("preloader");
    const safety = window.setTimeout(() => engine.unlock("preloader"), 8000);
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const drawn = Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
    const picture = document.querySelector<HTMLImageElement>("[data-hero-image] img");
    const assets = Promise.all([document.fonts?.ready, picture && !picture.complete ? picture.decode().catch(() => undefined) : undefined]);

    Promise.all([drawn, Promise.race([assets, wait(ASSET_CAP_MS)]), wait(Math.max(0, MIN_MS - performance.now()))]).then(() => {
      if (cancelled) return;
      engine.scrollTo(0, true);
      engine.unlock("preloader");
      const exit = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 100, easing: cssEase.power1Out, fill: "forwards" });
      exit.finished
        .catch(() => undefined)
        .then(() => {
          html.dataset.loaded = "";
          html.dataset.revealed = "";
        });
    });
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
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
