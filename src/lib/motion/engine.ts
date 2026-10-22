import Lenis from "lenis";

/*
 * The scroll engine (docs/MOTION.md, "Scroll engine").
 *
 * One requestAnimationFrame loop drives the whole site, in a fixed order:
 *   1. Lenis advances the smoothed scroll position;
 *   2. per-frame callbacks (roll links and other small interactions);
 *   3. page modules, in their `order` (on the homepage: page ground, hero,
 *      intro, works, values, services image, services, contact);
 *   4. the navigation.
 * Modules are pure readers of the frame: they compute styles from the
 * scroll position and write them, so scrolling back up runs everything
 * backwards exactly. Nothing fires once.
 *
 * `dt` is clamped to 1/20 s so a stalled or hidden tab cannot make the
 * exponential smoothers jump.
 */

export interface Frame {
  /** Seconds since boot. */
  time: number;
  /** Seconds since the last frame, at most 1/20. */
  dt: number;
  scroll: number;
  vw: number;
  vh: number;
  /** The visitor prefers reduced motion. */
  reduced: boolean;
  /**
   * Scroll-scrubbed sticky tracks are on: motion allowed and the screen at
   * least 500px tall. Otherwise sections fall back to a still, normal-flow
   * layout (see the `tracks` variant in globals.css).
   */
  tracks: boolean;
}

export interface MotionModule {
  order: number;
  /** Re-read layout after a resize, a font load or a route change. */
  measure?(frame: Frame): void;
  update(frame: Frame): void;
  /** Remove listeners when the page goes away. */
  destroy?(): void;
}

type Callback = (frame: Frame) => void;

/** Keep in step with the `tracks` custom variant in globals.css. */
export const TRACKS_QUERY = "(prefers-reduced-motion: no-preference) and (min-height: 500px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Element geometry in document coordinates, from its layout position (our transforms never affect it). */
export interface Range {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * The element's flow position: the summed offsetTop chain, which ignores
 * transforms. Measure only elements that are not inside a sticky stage.
 */
export function measureRange(el: HTMLElement): Range {
  let top = 0;
  let left = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
    left += node.offsetLeft;
  }
  return { top, left, width: el.offsetWidth, height: el.offsetHeight };
}

/** 0 when the element's top meets the bottom of the screen, 1 when it meets the top. */
export function sso(range: Range, f: Frame) {
  return -(range.top - f.scroll - f.vh) / f.vh;
}

/** −1 when the element's bottom meets the bottom of the screen, 0 when it meets the top. */
export function hso(range: Range, f: Frame) {
  return -(range.top - f.scroll + range.height) / f.vh;
}

/** −1 entering at the bottom, +1 leaving at the top. */
export function screenRatio(range: Range, f: Frame) {
  const s = range.top - f.scroll;
  const t = (s - f.vh) / (-range.height - f.vh);
  return Math.min(1, Math.max(-1, -1 + 2 * t));
}

const written = new WeakMap<HTMLElement | SVGElement, Record<string, string>>();

/** Write a style only when it changed since the last frame. */
export function setStyle(el: HTMLElement | SVGElement, prop: string, value: string) {
  let cache = written.get(el);
  if (!cache) written.set(el, (cache = {}));
  if (cache[prop] === value) return;
  cache[prop] = value;
  if (prop.startsWith("--")) el.style.setProperty(prop, value);
  else (el.style as unknown as Record<string, string>)[prop] = value;
}

/** Forget cached writes (after clearing inline styles by hand). */
export function clearStyleCache(el: HTMLElement | SVGElement) {
  written.delete(el);
}

class Engine {
  lenis: Lenis | null = null;
  frame: Frame = { time: 0, dt: 0, scroll: 0, vw: 0, vh: 0, reduced: false, tracks: false };
  private modules: MotionModule[] = [];
  private callbacks = new Set<Callback>();
  private raf = 0;
  private last = 0;
  private started = 0;
  private needsMeasure = true;
  private booted = false;

  boot() {
    if (this.booted || typeof window === "undefined") return;
    this.booted = true;
    const reduced = matchMedia(REDUCED_QUERY).matches;
    this.lenis = new Lenis({
      autoRaf: false,
      autoResize: false,
      smoothWheel: !reduced,
      gestureOrientation: "vertical",
      syncTouch: false,
      touchInertiaExponent: 2,
      duration: reduced ? 0 : 1.2,
      // expo.out; with a duration set, Lenis glides by time rather than by its default lerp.
      easing: reduced ? (n) => n : (n) => Math.min(1, 1.001 - Math.pow(2, -10 * n)),
    });
    const remeasure = () => this.requestMeasure();
    window.addEventListener("resize", remeasure, { passive: true });
    matchMedia(TRACKS_QUERY).addEventListener("change", remeasure);
    new ResizeObserver(remeasure).observe(document.body);
    document.fonts?.ready.then(remeasure);
    this.started = performance.now();
    this.last = this.started;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const f = this.frame;
    f.dt = Math.min((now - this.last) / 1000, 1 / 20);
    f.time = (now - this.started) / 1000;
    this.last = now;
    this.lenis?.raf(now);
    if (this.needsMeasure) this.measure();
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    this.callbacks.forEach((cb) => cb(f));
    for (const m of this.modules) m.update(f);
  };

  private measure() {
    this.needsMeasure = false;
    const f = this.frame;
    f.vw = document.documentElement.clientWidth;
    f.vh = window.innerHeight;
    f.reduced = matchMedia(REDUCED_QUERY).matches;
    f.tracks = "motion" in document.documentElement.dataset && matchMedia(TRACKS_QUERY).matches;
    // Update the scroll limit without cutting short a glide in progress.
    this.lenis?.dimensions.resize();
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    for (const m of this.modules) m.measure?.(f);
  }

  /** Re-read layout at the start of the next frame. */
  requestMeasure = () => {
    this.needsMeasure = true;
  };

  register(module: MotionModule) {
    this.modules.push(module);
    this.modules.sort((a, b) => a.order - b.order);
    this.requestMeasure();
    return () => {
      this.modules = this.modules.filter((m) => m !== module);
      module.destroy?.();
    };
  }

  onFrame(cb: Callback) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  /** Hold the page still (menu open, page transition). */
  stop() {
    this.lenis?.stop();
  }

  start() {
    this.lenis?.start();
  }

  scrollTo(target: number, immediate = false) {
    if (this.lenis) this.lenis.scrollTo(target, { immediate, force: true });
    else window.scrollTo({ top: target, behavior: immediate ? "instant" : "smooth" });
  }
}

export const engine = new Engine();

/** Module order on the homepage; the page ground runs first because Values reads its fade. */
export const ORDER = {
  ground: 0,
  hero: 1,
  intro: 2,
  works: 3,
  values: 4,
  servicesImage: 5,
  services: 6,
  contact: 7,
  parallax: 20,
  nav: 90,
} as const;
