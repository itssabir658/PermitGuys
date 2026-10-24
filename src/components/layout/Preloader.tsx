"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { GTA_BORDERS, GTA_HEIGHT, GTA_OUTLINE, GTA_REGIONS, GTA_WIDTH } from "@/content/gta-map";
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from "@/content/intro-wordmark";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { INTRO_COMPLETE_MS, INTRO_EXIT_MS, INTRO_REPEAT_EXIT_MS, borderTiming, outlineTiming, revealTiming, wordmarkTiming } from "@/lib/motion/intro";
import { openingAssets } from "@/lib/motion/opening";

/*
 * The load sequence: the Greater Toronto Area intro. docs/MOTION.md, "Load
 * sequence"; the timeline is in src/lib/motion/intro.ts.
 *
 * Once per tab (sessionStorage), a charcoal screen holds, the outline of the
 * Greater Toronto Area draws itself up the lakeshore and round, the borders
 * between its five regions follow, and the regions come to life west to
 * east: Halton, Peel, York, Toronto, Durham, each a client rendering fading
 * up and settling inside its region's shape, under the white lines. The
 * finished map holds, then the screen crossfades onto the page. Under the
 * map the name, PermitGuys, draws itself in white line with the outline. All of it is
 * CSS; the screen and the pictures' loading start before first paint, and
 * the timeline starts (data-intro="play") two frames after hydration, since
 * the drawing is painted on the main thread and the hydration would stall a
 * line mid-stroke. The head script starts it anyway after 1.5s. The pictures
 * fade and settle on the compositor, and the page underneath is first
 * measured only once the map is complete (engine.measureAfter), in the hold.
 *
 * A later full load in the same tab shows only the charcoal screen, which
 * fades as soon as the page is ready. The pictures are CSS backgrounds that
 * apply only during the intro, so a later load never fetches them; one that
 * fails to load leaves its region in a dark tone.
 *
 * The screen waits for the fonts and the page's opening pictures as before
 * (openingAssets, capped at 3.5s). Then, T₀: the page is put back at the
 * top, the document gets data-loaded and data-revealed so the page's own
 * entrance plays through the crossfade, and data-preloaded marks the end and
 * removes the screen. The page is held still while the screen is up and
 * released at 60% of the crossfade, or 8s after navigation whatever happens.
 *
 * `motionScript` runs in the document head before first paint. It turns the
 * sequence on only for visitors who allow motion and have JavaScript, marks
 * the first full load in the tab for the intro (data-intro), starts it
 * after 1.5s should the page not have hydrated by then, and sets every
 * flag after 8s whatever happens, so the page can never be held. With
 * reduced motion there is no screen at all: the page is simply there.
 */
export const motionScript = `(function(){var d=document.documentElement;try{history.scrollRestoration="manual"}catch(e){}var go=function(){d.dataset.loaded="";d.dataset.revealed="";d.dataset.preloaded=""};if(matchMedia("(prefers-reduced-motion: reduce)").matches)go();else{d.dataset.motion="";try{if(!sessionStorage.getItem("pg_intro")){sessionStorage.setItem("pg_intro","1");d.dataset.intro="";setTimeout(function(){d.dataset.intro="play"},1500)}}catch(e){}}setTimeout(function(){if(!("preloaded" in d.dataset))go()},8000)})()`;

/** From navigation start, as the head script: the page is released by then whatever happens. */
const SAFETY_MS = 8000;
/** Never hold the page for slow assets longer than this. */
const ASSET_CAP_MS = 3500;

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
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
    const full = "intro" in html.dataset;
    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const settled = (list: Animation[]) => Promise.all(list.map((a) => a.finished.catch(() => undefined)));
    let composedAt = 0;
    // Two frames on, so every effect of the hydration has run and nothing heavy is left to stall the drawing.
    const composed = (full ? frame().then(frame) : Promise.resolve()).then(() => {
      if (full) html.dataset.intro = "play";
      // Reading them brings the styles up to date, which starts the animations.
      return settled(el.getAnimations({ subtree: true })).then(() => {
        composedAt = performance.now();
      });
    });
    const fonts = Promise.race([document.fonts?.ready, wait(ASSET_CAP_MS)]);
    // The page is first measured once the map is complete, so the measure lands in the hold, not on a line being drawn.
    const measured = engine.measureAfter(Promise.race([Promise.all([composed, fonts]), wait(Math.max(0, SAFETY_MS - performance.now()))]));
    const assets = Promise.all([document.fonts?.ready, ...openingAssets()]);

    Promise.all([composed, measured, Promise.race([assets, wait(ASSET_CAP_MS)])])
      // The finished map is held a moment, however long the page took to be ready.
      .then(() => (full ? wait(Math.max(0, INTRO_COMPLETE_MS - (performance.now() - composedAt))) : undefined))
      .then(() => {
        if (cancelled) return;
        // Too late: the head script has already revealed the page (8s), so leave the page where the visitor has it.
        if ("preloaded" in html.dataset) {
          engine.unlock("preloader");
          return;
        }
        // The hero's picture settles from where Toronto was on the map.
        const map = el.querySelector(".intro")?.getBoundingClientRect();
        const toronto = GTA_REGIONS.find((r) => r.key === "toronto");
        const x = map && toronto ? map.left + (toronto.centre[0] / GTA_WIDTH) * map.width : window.innerWidth / 2;
        const y = map && toronto ? map.top + (toronto.centre[1] / GTA_HEIGHT) * map.height : window.innerHeight / 2;
        for (const target of document.querySelectorAll<HTMLElement>("[data-hero-stage]")) {
          target.style.setProperty("--iris-x", `${x.toFixed(1)}px`);
          target.style.setProperty("--iris-y", `${y.toFixed(1)}px`);
        }
        // Back at the top before anything shows (data-loaded is what scripts and tests wait for).
        engine.scrollTo(0, true);
        html.dataset.loaded = "";
        html.dataset.revealed = "";
        const ms = full ? INTRO_EXIT_MS : INTRO_REPEAT_EXIT_MS;
        const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: cssEase.power1InOut, fill: "forwards" });
        el.querySelector(".intro-stage")?.animate([{ transform: "scale(1)" }, { transform: "scale(1.035)" }], { duration: ms, easing: cssEase.power2Out, fill: "forwards" });
        release = window.setTimeout(() => {
          if (!cancelled) engine.unlock("preloader");
        }, 0.6 * ms);
        const done = () => {
          html.dataset.preloaded = "";
        };
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
      <div className="intro-stage">
        <div className="intro" style={{ aspectRatio: `${GTA_WIDTH} / ${GTA_HEIGHT}` }}>
          {GTA_REGIONS.map((r, i) => {
            const [x, y, w, h] = r.box;
            return (
              <div
                key={r.key}
                className="intro__region"
                style={{
                  left: pct(x, GTA_WIDTH),
                  top: pct(y, GTA_HEIGHT),
                  width: pct(w, GTA_WIDTH),
                  height: pct(h, GTA_HEIGHT),
                  clipPath: `url(#intro-clip-${r.key})`,
                  ...timing(revealTiming(i)),
                }}
              >
                <div
                  className="intro__picture"
                  style={
                    {
                      "--picture-small": `url(${r.picture.small})`,
                      "--picture-medium": `url(${r.picture.medium})`,
                      "--picture-full": `url(${r.picture.full})`,
                      transformOrigin: `${pct(r.centre[0] - x, w)} ${pct(r.centre[1] - y, h)}`,
                    } as CSSProperties
                  }
                />
              </div>
            );
          })}
          <svg className="intro__lines" viewBox={`0 0 ${GTA_WIDTH} ${GTA_HEIGHT}`} fill="none" focusable="false">
            <defs>
              {GTA_REGIONS.map((r) => (
                <clipPath key={r.key} id={`intro-clip-${r.key}`} clipPathUnits="objectBoundingBox">
                  <path d={r.clip} />
                </clipPath>
              ))}
            </defs>
            {/* A soft dark line under the white ones, for the pictures' pale skies. */}
            <g className="intro__keyline" style={timing(revealTiming(1))}>
              {[...GTA_OUTLINE, ...GTA_BORDERS].map((d) => (
                <path key={d.slice(0, 32)} d={d} />
              ))}
            </g>
            {GTA_BORDERS.map((d, i) => (
              <path key={d.slice(0, 32)} d={d} pathLength={1} className="intro__stroke intro__stroke--border" style={timing(borderTiming(i))} />
            ))}
            {GTA_OUTLINE.map((d, i) => (
              <path key={d.slice(0, 32)} d={d} pathLength={1} className="intro__stroke" style={timing(outlineTiming(i))} />
            ))}
          </svg>
        </div>
        {/* The name under the map, its letters drawn in white line alongside the outline. */}
        <svg className="intro__name" viewBox={WORDMARK_VIEWBOX} fill="none" focusable="false">
          {WORDMARK_LETTERS.map((d, i) => (
            <path key={i} d={d} pathLength={1} className="intro__stroke intro__stroke--letter" style={timing(wordmarkTiming(i))} />
          ))}
        </svg>
      </div>
    </div>
  );
}
