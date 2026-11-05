"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import {
  LOADER_BLADES,
  LOADER_FADE_MS,
  LOADER_GENTLE_FADE_MS,
  LOADER_HOLD_MS,
  LOADER_JOINTS,
  LOADER_LIFT_MS,
  LOADER_LIGHT,
  LOADER_LINE,
  LOADER_LOGO,
  LOADER_OPEN_DEG,
  LOADER_OPEN_MS,
  LOADER_RULE,
  bladeDelay,
  openDuration,
} from "@/lib/motion/intro";
import { openingAssets } from "@/lib/motion/opening";
import { Logo } from "./Logo";

/*
 * The load sequence: the façade. docs/MOTION.md, "Load sequence"; the
 * timeline is in src/lib/motion/intro.ts.
 *
 * On every full load the screen is a dark façade of tall vertical blades,
 * seamless at first. A raking light crosses it from left to right, as low
 * sun crosses a building, and picks out the joints between the blades. The
 * logo rises in the middle, a red rule is drawn out under it, and the firm's
 * line comes up below. After a short hold the logo lifts away and the blades
 * pivot open on their centres, from the middle outward, like a brise-soleil
 * turning to let the light in; each catches the light as it turns, and the
 * page is seen through them. The last of the screen fades as they come edge
 * on.
 *
 * All of it is transforms and opacity: the light is one gradient moved
 * across each blade (each blade shows its own slice of one screen-wide
 * gradient, so the light reads as one), and the blades turn with rotateY on
 * the compositor. The timeline starts (data-intro="play") two frames after
 * hydration, as before; the head script starts it anyway after 1.5s. The
 * page underneath is first measured once the façade is complete
 * (engine.measureAfter), in the hold.
 *
 * The screen waits for the fonts and the page's opening pictures as before
 * (openingAssets, capped at 3.5s). Then, T₀: the page is put back at the
 * top, the document gets data-loaded and data-revealed so the page's own
 * entrance plays as the blades open, and data-preloaded marks the end and
 * removes the screen. The page is held still while the screen is up and
 * released at 60% of the opening, or 8s after navigation whatever happens.
 * With reduced motion (data-gentle) the light does not travel, the blades
 * stay still, and the screen fades.
 *
 * `motionScript` runs in the document head before first paint. It turns the
 * sequence on for every visitor with JavaScript (visitors who prefer reduced
 * motion get it too, with data-gentle: see "Gentle motion" in globals.css), marks
 * the load for the intro (data-intro), starts it
 * after 1.5s should the page not have hydrated by then, and sets every
 * flag after 8s whatever happens, so the page can never be held.
 */
export const motionScript = `(function(){var d=document.documentElement;try{history.scrollRestoration="manual"}catch(e){}var go=function(){d.dataset.loaded="";d.dataset.revealed="";d.dataset.preloaded=""};if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.gentle="";d.dataset.motion="";d.dataset.intro="";setTimeout(function(){d.dataset.intro="play"},1500);setTimeout(function(){if(!("preloaded" in d.dataset))go()},8000)})()`;

/** From navigation start, as the head script: the page is released by then whatever happens. */
const SAFETY_MS = 8000;
/** Never hold the page for slow assets longer than this. */
const ASSET_CAP_MS = 3500;

const timing = (t: { at: number; ms: number }) => ({ "--at": `${t.at}ms`, "--ms": `${t.ms}ms` }) as CSSProperties;

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
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const settled = (list: Animation[]) => Promise.all(list.map((a) => a.finished.catch(() => undefined)));
    let composedAt = 0;
    // Two frames on, so every effect of the hydration has run and nothing heavy is left to stall the light.
    const composed = frame().then(frame).then(() => {
      html.dataset.intro = "play";
      // Reading them brings the styles up to date, which starts the animations.
      return settled(el.getAnimations({ subtree: true })).then(() => {
        composedAt = performance.now();
      });
    });
    const fonts = Promise.race([document.fonts?.ready, wait(ASSET_CAP_MS)]);
    // The page is first measured once the façade is complete, so the measure lands in the hold.
    const measured = engine.measureAfter(Promise.race([Promise.all([composed, fonts]), wait(Math.max(0, SAFETY_MS - performance.now()))]));
    const assets = Promise.all([document.fonts?.ready, ...openingAssets()]);

    Promise.all([composed, measured, Promise.race([assets, wait(ASSET_CAP_MS)])])
      // The finished façade is held a moment, however long the page took to be ready.
      .then(() => wait(Math.max(0, LOADER_HOLD_MS - (performance.now() - composedAt))))
      .then(() => {
        if (cancelled) return;
        // Too late: the head script has already revealed the page (8s), so leave the page where the visitor has it.
        if ("preloaded" in html.dataset) {
          engine.unlock("preloader");
          return;
        }
        // The hero's picture settles from the middle of the screen, where the façade opens first.
        for (const target of document.querySelectorAll<HTMLElement>("[data-hero-stage]")) {
          target.style.setProperty("--iris-x", `${(innerWidth / 2).toFixed(1)}px`);
          target.style.setProperty("--iris-y", `${(innerHeight / 2).toFixed(1)}px`);
        }
        // Back at the top before anything shows (data-loaded is what scripts and tests wait for).
        engine.scrollTo(0, true);
        html.dataset.loaded = "";
        html.dataset.revealed = "";
        const done = () => {
          html.dataset.preloaded = "";
        };
        const fill = "forwards" as const;
        if ("gentle" in html.dataset) {
          const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LOADER_GENTLE_FADE_MS, easing: cssEase.power1InOut, fill });
          release = window.setTimeout(() => {
            if (!cancelled) engine.unlock("preloader");
          }, 0.6 * LOADER_GENTLE_FADE_MS);
          fade.finished.then(done, done);
          return;
        }
        el.querySelector(".loader__mark")?.animate(
          [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: "translateY(-0.75rem)" },
          ],
          { duration: LOADER_LIFT_MS, easing: cssEase.power2InOut, fill },
        );
        // Only the blades on show (phones show fewer).
        const blades = [...el.querySelectorAll<HTMLElement>(".loader__blade")].filter((b) => b.offsetWidth > 0);
        const count = blades.length;
        blades.forEach((blade, i) => {
          const timing = { duration: LOADER_OPEN_MS, delay: bladeDelay(i, count), easing: cssEase.sheet, fill: "both" as const };
          // Blades left of the middle turn one way, the rest the other, so the façade opens like a pair of shutters.
          const deg = i < count / 2 ? -LOADER_OPEN_DEG : LOADER_OPEN_DEG;
          blade.animate([{ transform: "rotateY(0deg)" }, { transform: `rotateY(${deg}deg)` }], timing);
          // Each blade catches the light as it turns.
          blade.querySelector(".loader__sheen")?.animate([{ opacity: 0 }, { opacity: 1 }], timing);
        });
        const total = openDuration(count);
        const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LOADER_FADE_MS, delay: total - LOADER_FADE_MS, easing: cssEase.in, fill: "both" });
        release = window.setTimeout(() => {
          if (!cancelled) engine.unlock("preloader");
        }, 0.6 * total);
        fade.finished.then(done, done);
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
      <div className="loader__facade" style={{ "--blades": LOADER_BLADES, ...timing(LOADER_LIGHT) } as CSSProperties}>
        {Array.from({ length: LOADER_BLADES }, (_, i) => (
          <div key={i} className="loader__blade" style={{ "--i": i, ...timing(LOADER_JOINTS) } as CSSProperties}>
            <span className="loader__light" />
            <span className="loader__sheen" />
          </div>
        ))}
      </div>
      <div className="loader__mark">
        <div className="loader__logo" style={timing(LOADER_LOGO)}>
          <Logo onDark className="loader__logo-mark" />
        </div>
        <span className="loader__rule" style={timing(LOADER_RULE)} />
        <p className="loader__line" style={timing(LOADER_LINE)}>
          Architecture <span className="loader__sep" /> Engineering <span className="loader__sep" /> Design
        </p>
      </div>
    </div>
  );
}
