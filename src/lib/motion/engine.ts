import Lenis from "lenis";

/*
 * The scroll engine (docs/MOTION.md, "Scroll engine").
 *
 * One requestAnimationFrame loop drives the whole site, in a fixed order:
 *   1. Lenis advances the smoothed scroll position;
 *   2. per-frame callbacks (roll links and other small interactions);
 *   3. page modules, in their `order` (on the homepage: page ground, hero,
 *      intro, works, values, services image, services, the handover to
 *      Contact, contact; on every page: the footer, then parallax);
 *   4. the navigation.
 * Modules are pure readers of the frame: they compute styles from the
 * scroll position and write them, so scrolling back up runs everything
 * backwards exactly. Nothing fires once.
 *
 * `dt` is clamped to 1/20 s so a stalled or hidden tab cannot make the
 * exponential smoothers jump.
 *
 * A screen is the large viewport (100lvh, read from a fixed probe), the
 * unit the tracks are sized in, so a phone's toolbar showing or hiding never
 * rescales the choreography; height-only resizes on touch screens are
 * ignored for the same reason.
 *
 * The page is held still (menu open, page transition, preloader) by a
 * reference-counted lock: Lenis stops wheel and touch, and the scrolling
 * keys are cancelled. The root's overflow is never touched, so a classic
 * scrollbar never disappears and nothing shifts sideways.
 *
 * When the layout changes under the reader (a resize, a rotation, the
 * tracks turning on or off, content above growing), the engine puts them
 * back at the same point of the same section, since tracks are sized in
 * screens and pixel offsets mean nothing after a resize.
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

/** Keys that scroll the page; cancelled while it is locked, except where they operate a control. */
const SCROLL_KEYS = [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"];

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
  private locks = new Set<string>();
  /** 100lvh, measured: the screen the tracks are sized in. */
  private probe: HTMLElement | null = null;
  private lastW = 0;
  /** Top-level blocks of the page, for the reading anchor. */
  private sections: Range[] = [];
  /** Where the reader is: section index and progress through it (scroll − top) / height. */
  private anchor: { i: number; p: number } | null = null;
  /** The next measure follows a layout change: if the screen changed too, the reader goes back to the anchor. */
  private keepPlace = false;
  /** The screen at the last measure, as `vw×vh tracks`. */
  private view = "";

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
    if (this.locks.size) this.lenis.stop();
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none";
    this.probe = document.body.appendChild(probe);
    const layoutChanged = () => {
      this.keepPlace = true;
      this.needsMeasure = true;
    };
    window.addEventListener(
      "resize",
      () => {
        // A phone's toolbar showing or hiding changes only the height: the tracks are in lvh, so nothing moved.
        if (matchMedia("(pointer: coarse)").matches && window.innerWidth === this.lastW) return;
        layoutChanged();
      },
      { passive: true },
    );
    matchMedia(TRACKS_QUERY).addEventListener("change", layoutChanged);
    new ResizeObserver(layoutChanged).observe(document.body);
    document.fonts?.ready.then(this.requestMeasure);
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
    const measured = this.needsMeasure;
    if (measured) this.measure();
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    this.callbacks.forEach((cb) => cb(f));
    for (const m of this.modules) m.update(f);
    // Note the reading position against the layout the sections were measured in.
    if (!measured) this.anchor = this.readAnchor(f);
  };

  private readAnchor(f: Frame) {
    const y = f.scroll + 0.5 * f.vh;
    let i = -1;
    this.sections.forEach((r, k) => {
      if (r.height > 0 && r.top <= y) i = k;
    });
    const r = this.sections[i];
    return r ? { i, p: (f.scroll - r.top) / r.height } : null;
  }

  private measure() {
    this.needsMeasure = false;
    const f = this.frame;
    f.vw = document.documentElement.clientWidth;
    f.vh = this.probe?.offsetHeight || window.innerHeight;
    this.lastW = window.innerWidth;
    f.reduced = matchMedia(REDUCED_QUERY).matches;
    f.tracks = "motion" in document.documentElement.dataset && matchMedia(TRACKS_QUERY).matches;
    // Only a new screen moves the reader; content growing within the page (a disclosure opening) keeps the pixel position.
    const view = `${f.vw}x${f.vh} ${f.tracks}`;
    const keep = this.keepPlace && view !== this.view ? this.anchor : null;
    this.keepPlace = false;
    this.view = view;
    // Update the scroll limit without cutting short a glide in progress.
    this.lenis?.dimensions.resize();
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    for (const m of this.modules) m.measure?.(f);
    this.sections = [...document.querySelectorAll<HTMLElement>("main > :not(script), body > footer")].map(measureRange);
    // After a resize or rotation: the same point of the same section, wherever it now is.
    const r = keep && this.sections[keep.i];
    if (keep && r && r.height > 0) {
      const y = Math.max(0, Math.round(r.top + keep.p * r.height));
      if (this.lenis) {
        this.lenis.scrollTo(y, { immediate: true, force: true });
        f.scroll = this.lenis.scroll;
      } else {
        window.scrollTo({ top: y, behavior: "instant" });
        f.scroll = window.scrollY;
      }
    }
  }

  /** Re-read layout at the start of the next frame (new page content, fonts). The reading position is not kept: the page is a new one. */
  requestMeasure = () => {
    this.needsMeasure = true;
    this.anchor = null;
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

  /**
   * Hold the page still for `reason` (menu, route, preloader) until every
   * reason is released. Lenis cancels wheel and touch while stopped, except
   * over [data-lenis-prevent] panels, which it leaves alone: those may
   * scroll themselves but never chain to the page.
   */
  lock(reason: string) {
    this.locks.add(reason);
    this.lenis?.stop();
    window.addEventListener("keydown", this.blockKeys, { capture: true });
    window.addEventListener("wheel", this.blockPanels, { capture: true, passive: false });
    window.addEventListener("touchmove", this.blockPanels, { capture: true, passive: false });
  }

  unlock(reason: string) {
    if (!this.locks.delete(reason) || this.locks.size) return;
    this.lenis?.start();
    window.removeEventListener("keydown", this.blockKeys, { capture: true });
    window.removeEventListener("wheel", this.blockPanels, { capture: true });
    window.removeEventListener("touchmove", this.blockPanels, { capture: true });
  }

  get locked() {
    return this.locks.size > 0;
  }

  private blockKeys = (e: KeyboardEvent) => {
    if (!SCROLL_KEYS.includes(e.key)) return;
    const t = e.target instanceof Element ? e.target : null;
    // Fields keep their keys, controls keep Space, and a panel that scrolls by itself (the menu) keeps them all.
    if (t?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
    if (e.key === " " && t?.closest("button, summary, [role='button']")) return;
    const own = t?.closest<HTMLElement>("[data-lenis-prevent]");
    if (own && t && scrollsWithin(t, own)) return;
    e.preventDefault();
  };

  private blockPanels = (e: Event) => {
    const t = e.target instanceof Element ? e.target : null;
    const own = t?.closest<HTMLElement>("[data-lenis-prevent]");
    if (own && t && !scrollsWithin(t, own) && e.cancelable) e.preventDefault();
  };

  scrollTo(target: number, immediate = false) {
    if (this.lenis) this.lenis.scrollTo(target, { immediate, force: true });
    else window.scrollTo({ top: target, behavior: immediate ? "instant" : "smooth" });
  }
}

/** Whether some box between `el` and `root` (inclusive) can scroll vertically by itself. */
function scrollsWithin(el: Element, root: HTMLElement) {
  for (let n: Element | null = el; n; n = n.parentElement) {
    if (n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return true;
    if (n === root) break;
  }
  return false;
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
  handover: 7,
  contact: 8,
  footer: 19,
  parallax: 20,
  nav: 90,
} as const;
