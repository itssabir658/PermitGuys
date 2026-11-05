"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { HOUSE_DOOR, HOUSE_HEIGHT, HOUSE_WIDTH } from "@/content/house-drawing";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { LOADER_DOOR_MS, LOADER_ENTER_AT_MS, LOADER_ENTER_MS, LOADER_GENTLE_FADE_MS, LOADER_GROUND, LOADER_HOLD_MS, LOADER_LOGO, enterScale } from "@/lib/motion/intro";
import { openingAssets } from "@/lib/motion/opening";
import { HouseDrawing } from "./HouseDrawing";
import { Logo } from "./Logo";

/*
 * The load sequence: through the front door. docs/MOTION.md, "Load
 * sequence"; the timeline is in src/lib/motion/intro.ts, the drawing in
 * src/content/house-drawing.ts.
 *
 * On every full load a dark screen holds, a ground line runs out across it,
 * and the front elevation of a house is drawn on it as a drafter would:
 * faint construction lines first, then the walls, the roof meeting at the
 * ridge, the windows, and the front door last, in the brand red. The logo
 * comes up under the ground. Then the door swings open (inward, as front
 * doors do), the page shows through the doorway, and the whole screen grows
 * around the door until the doorway is bigger than the screen: the visitor
 * walks in.
 *
 * The screen is the dark spread of the doorway's box-shadow, so the doorway
 * is a real hole in it, and the door leaf a dark panel over that hole. The
 * drawing is CSS (stroke-dashoffset), started (data-intro="play") two frames
 * after hydration, since it is painted on the main thread; the head script
 * starts it anyway after 1.5s. The swing and the way in are compositor
 * animations (rotateY on the leaf, scale on the screen). The page underneath
 * is first measured once the drawing is complete (engine.measureAfter), in
 * the hold.
 *
 * The screen waits for the fonts and the page's opening pictures as before
 * (openingAssets, capped at 3.5s). Then, T₀: the page is put back at the
 * top, the document gets data-loaded and data-revealed so the page's own
 * entrance plays as the door opens, and data-preloaded marks the end and
 * removes the screen. The page is held still while the screen is up and
 * released at 60% of the way in, or 8s after navigation whatever happens.
 * With reduced motion (data-gentle) the lines fade up rather than draw, the
 * door stays shut and the screen fades.
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

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
const timing = (t: { at: number; ms: number }) => ({ "--at": `${t.at}ms`, "--ms": `${t.ms}ms` }) as CSSProperties;
const [DX, DY, DW, DH] = HOUSE_DOOR;

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
    // Two frames on, so every effect of the hydration has run and nothing heavy is left to stall the drawing.
    const composed = frame().then(frame).then(() => {
      html.dataset.intro = "play";
      // Reading them brings the styles up to date, which starts the animations.
      return settled(el.getAnimations({ subtree: true })).then(() => {
        composedAt = performance.now();
      });
    });
    const fonts = Promise.race([document.fonts?.ready, wait(ASSET_CAP_MS)]);
    // The page is first measured once the drawing is complete, so the measure lands in the hold, not on a line being drawn.
    const measured = engine.measureAfter(Promise.race([Promise.all([composed, fonts]), wait(Math.max(0, SAFETY_MS - performance.now()))]));
    const assets = Promise.all([document.fonts?.ready, ...openingAssets()]);

    Promise.all([composed, measured, Promise.race([assets, wait(ASSET_CAP_MS)])])
      // The finished drawing is held a moment, however long the page took to be ready.
      .then(() => wait(Math.max(0, LOADER_HOLD_MS - (performance.now() - composedAt))))
      .then(() => {
        if (cancelled) return;
        // Too late: the head script has already revealed the page (8s), so leave the page where the visitor has it.
        if ("preloaded" in html.dataset) {
          engine.unlock("preloader");
          return;
        }
        const door = el.querySelector(".loader__door")!.getBoundingClientRect();
        const cx = door.left + door.width / 2;
        const cy = door.top + door.height / 2;
        // The hero's picture settles from the doorway.
        for (const target of document.querySelectorAll<HTMLElement>("[data-hero-stage]")) {
          target.style.setProperty("--iris-x", `${cx.toFixed(1)}px`);
          target.style.setProperty("--iris-y", `${cy.toFixed(1)}px`);
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
        const leaf = el.querySelector<HTMLElement>(".loader__leaf");
        leaf?.animate(
          [
            { transform: "rotateY(0deg)", backgroundColor: "#121212" },
            { transform: "rotateY(84deg)", backgroundColor: "#262523" },
          ],
          { duration: LOADER_DOOR_MS, easing: cssEase.power2InOut, fill },
        );
        // The leaf is put away as the screen goes in, so its edge never sweeps the view.
        leaf?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: LOADER_ENTER_AT_MS + 120, easing: cssEase.power1Out, fill: "both" });
        // The drawing's faint pieces and the logo go first, so the way in is lines and light.
        for (const extra of el.querySelectorAll(".loader__extras, .house__stroke--guide, .house__stroke--dimension"))
          extra.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: LOADER_ENTER_AT_MS, easing: cssEase.power1Out, fill: "both" });
        const scale = enterScale(door, { width: innerWidth, height: innerHeight });
        el.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
        // Slow to start, as a step through the door, then fast, and soft at the end.
        const enter = el.animate([{ transform: "scale(1)" }, { transform: `scale(${scale.toFixed(3)})` }], {
          duration: LOADER_ENTER_MS,
          delay: LOADER_ENTER_AT_MS,
          easing: "cubic-bezier(0.7, 0, 0.16, 1)",
          fill: "both",
        });
        release = window.setTimeout(() => {
          if (!cancelled) engine.unlock("preloader");
        }, LOADER_ENTER_AT_MS + 0.6 * LOADER_ENTER_MS);
        enter.finished.then(done, done);
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
      <div className="loader" style={{ aspectRatio: `${HOUSE_WIDTH} / ${HOUSE_HEIGHT}` }}>
        {/* The doorway: a hole in the screen, which is this box's shadow, with the door leaf over it. */}
        <div className="loader__door" style={{ left: pct(DX, HOUSE_WIDTH), top: pct(DY, HOUSE_HEIGHT), width: pct(DW, HOUSE_WIDTH), height: pct(DH, HOUSE_HEIGHT) }}>
          <div className="loader__leaf">
            <span className="loader__handle" />
          </div>
        </div>
        <span className="loader__ground" style={timing(LOADER_GROUND)} />
        <HouseDrawing className="loader__drawing" />
        <div className="loader__extras" style={timing(LOADER_LOGO)}>
          <Logo onDark className="loader__logo" />
        </div>
      </div>
    </div>
  );
}
