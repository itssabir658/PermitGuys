import Lenis from "lenis";
import { clamp } from "./math";
import { mergeSpans, SETTLE_JOIN, SETTLE_WAIT, settleAt, settleDuration, settleTarget, type Span } from "./settle";

/*
 * The scroll engine (docs/MOTION.md, "Scroll engine").
 *
 * One requestAnimationFrame loop drives the whole site, in a fixed order:
 *   1. Lenis advances the smoothed scroll position;
 *   2. per-frame callbacks (roll links and other small interactions);
 *   3. page modules, in their `order` (on the homepage: page ground, hero,
 *      intro, story, works, values, services image, services, the handover
 *      to Contact, contact; on every page: the footer, then parallax);
 *   4. the navigation.
 * Modules are pure readers of the frame: they compute styles from the
 * scroll position and write them, so scrolling back up runs everything
 * backwards exactly. Nothing fires once. A module whose section is a screen
 * or more off the screen has nothing to change (`sleeper`): it writes its
 * frame once as the section leaves, then sleeps until it comes back, so a
 * phone spends each frame only on what it shows.
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
 * screens and pixel offsets mean nothing after a resize. Going back to a
 * page (`restore`) puts them back at the pixel they left from, once the new
 * page has been measured, so its tracks exist before the scroll is set.
 *
 * In-page links glide (`glideTo`: 1.1s on the same exponential ease as the
 * wheel, instant with reduced motion), and wait for the page to be released
 * first (`afterUnlock`), since releasing it cancels any glide under way.
 *
 * A page being printed takes the still layout: the tracks are off from
 * beforeprint to afterprint, so every module clears what it wrote first.
 *
 * Where a touch screen is the main way in, the page scrolls natively, and
 * a flick ends wherever its momentum runs out. Once it has come to rest
 * inside a change on a scene (a module's `zones`: lines part out of their
 * masks, a picture part wiped), the engine glides it on to the end of the
 * change in the direction it was going (settle.ts), so the page only ever
 * rests where every scene is whole.
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
  /**
   * A touch screen is the main way in, so the page scrolls natively and
   * settles (settle.ts). Pieces that come up with the page, rather than on a
   * pinned stage, play on their own clock once their start is reached, so
   * they are never left part way either.
   */
  touch: boolean;
}

export interface MotionModule {
  order: number;
  /** Re-read layout after a resize, a font load or a route change. */
  measure?(frame: Frame): void;
  update(frame: Frame): void;
  /**
   * Touch screens, after a measure: the spans of scroll (px) where something
   * of this module is part way through a change, a line part out of its
   * mask or a picture part wiped, so the page must not come to rest there.
   */
  zones?(frame: Frame): Span[];
  /** Remove listeners when the page goes away. */
  destroy?(): void;
}

type Callback = (frame: Frame) => void;

/** Keep in step with the `tracks` custom variant in globals.css (which also limits the tracks to screens; printing sets `printing` here). */
export const TRACKS_QUERY = "(prefers-reduced-motion: no-preference) and (min-height: 500px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
/** Phones and tablets: a touch screen is the main way in, and nothing hovers. */
const TOUCH_QUERY = "(pointer: coarse) and (hover: none)";

/** expo.out, the wheel's ease: in-page links glide on it too. */
const expoOut = (n: number) => Math.min(1, 1.001 - Math.pow(2, -10 * n));
const GLIDE_S = 1.1;

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

/**
 * A module's sleep: modules are pure functions of the scroll, so one whose
 * section is a screen or more off the screen writes the same styles every
 * frame. `skip` lets the frame be written once as the section leaves (on
 * either side), then skips it until the section comes back; `wake` (from
 * measure) has the next frame written whatever, as the layout may have
 * changed under it.
 */
export function sleeper() {
  let side = 0;
  return {
    skip(r: Range, f: Frame) {
      const s = r.top - f.scroll > 2 * f.vh ? 1 : r.top + r.height - f.scroll < -f.vh ? -1 : 0;
      if (s !== 0 && s === side) return true;
      side = s;
      return false;
    },
    wake() {
      side = 0;
    },
  };
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
  frame: Frame = { time: 0, dt: 0, scroll: 0, vw: 0, vh: 0, reduced: false, tracks: false, touch: false };
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
  /** Where the next measure puts the reader (a page gone back to). */
  private pendingRestore: number | null = null;
  /** Run once the page is released (a glide asked for while the menu was still closing). */
  private unlocked: (() => void)[] = [];
  /** The page is being printed: the tracks are off until it is done. */
  private printing = false;
  /** Holds on the frame loop (`measureAfter`): while any is on, nothing is measured or written. */
  private holds = 0;
  /** Waiting for the next measure (`measureAfter`). */
  private measuredWaiting: (() => void)[] = [];
  /** Touch screens: where the page must not rest (the modules' zones, joined; found when the page first comes to rest after a measure, so never in a frame that moves), and the settle under way. */
  private zones: Span[] | null = null;
  private glide: { from: number; to: number; t0: number; duration: number; at: number } | null = null;
  /** A finger is down. */
  private touching = false;
  /** The page's last position, which way it last moved, since when it has been still (ms), and whether it has moved (or its zones have) since it was last judged at rest. */
  private lastY = 0;
  private dir = 1;
  private stillAt = 0;
  private moved = false;

  boot() {
    if (this.booted || typeof window === "undefined") return;
    this.booted = true;
    const reduced = matchMedia(REDUCED_QUERY).matches;
    // Lenis smooths the wheel. A touch screen scrolls natively, without it: its touch listeners cannot be passive, so every touch would wait for the page's script before the page could move.
    if (!matchMedia(TOUCH_QUERY).matches) {
      this.lenis = new Lenis({
        autoRaf: false,
        autoResize: false,
        smoothWheel: !reduced,
        gestureOrientation: "vertical",
        syncTouch: false,
        touchInertiaExponent: 2,
        duration: reduced ? 0 : 1.2,
        // expo.out; with a duration set, Lenis glides by time rather than by its default lerp.
        easing: reduced ? (n) => n : expoOut,
      });
      if (this.locks.size) this.lenis.stop();
    } else {
      // Watched, never held: passive, so a touch never waits for the script.
      for (const type of ["touchstart", "touchend", "touchcancel"]) window.addEventListener(type, this.onTouch as EventListener, { capture: true, passive: true });
    }
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
    // A printed page takes the still layout (the tracks are for screens), so the modules clear what they wrote before it prints, and write it again after.
    const printing = (on: boolean) => () => {
      this.printing = on;
      this.measure();
      this.run();
    };
    window.addEventListener("beforeprint", printing(true));
    window.addEventListener("afterprint", printing(false));
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
    if (this.holds) return;
    const measured = this.needsMeasure;
    if (measured) this.measure();
    this.settle(now);
    this.run();
    // Note the reading position against the layout the sections were measured in.
    if (!measured) this.anchor = this.readAnchor(f);
    else this.measuredWaiting.splice(0).forEach((resolve) => resolve());
  };

  /** Write the frame: the per-frame callbacks, then the modules in order. */
  private run() {
    const f = this.frame;
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    this.callbacks.forEach((cb) => cb(f));
    for (const m of this.modules) m.update(f);
  }

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
    f.tracks = !this.printing && "motion" in document.documentElement.dataset && matchMedia(TRACKS_QUERY).matches;
    f.touch = !this.lenis && matchMedia(TOUCH_QUERY).matches;
    // A layout change moves every change on the page: a settle under way is dropped, and the page judged again on the new zones once it is still.
    this.glide = null;
    this.moved = true;
    // Only a new screen moves the reader; content growing within the page (a disclosure opening) keeps the pixel position.
    const view = `${f.vw}x${f.vh} ${f.tracks}`;
    const keep = this.keepPlace && view !== this.view ? this.anchor : null;
    this.keepPlace = false;
    this.view = view;
    // Update the scroll limit without cutting short a glide in progress.
    this.lenis?.dimensions.resize();
    // A page gone back to: the reader returns to the pixel they left from (it wins over the reading anchor).
    const restore = this.pendingRestore;
    this.pendingRestore = null;
    if (restore != null) this.jump(restore);
    f.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
    for (const m of this.modules) m.measure?.(f);
    this.zones = null;
    this.sections = [...document.querySelectorAll<HTMLElement>("main > :not(script), body > footer")].map(measureRange);
    // After a resize or rotation: the same point of the same section, wherever it now is.
    const r = restore == null && keep && this.sections[keep.i];
    if (keep && r && r.height > 0) this.jump(Math.max(0, Math.round(r.top + keep.p * r.height)));
  }

  /**
   * Touch screens: carry on with a settle under way; else note how the page
   * is moving, and once it has come to rest inside a change (no finger
   * down, still for SETTLE_WAIT), set off for its end (settleTarget). Runs
   * before the modules, so they draw the frame where the glide has put it.
   */
  private settle(now: number) {
    if (!this.frame.touch) return;
    const g = this.glide;
    // Anything else that scrolls the page (a key, a link, focus, the last of a flick's momentum) takes over from the settle; the page is judged again once it is still.
    if (g && Math.abs(window.scrollY - g.at) > 2) this.glide = null;
    else if (g) {
      const elapsed = (now - g.t0) / 1000;
      window.scrollTo({ top: settleAt(g.from, g.to, elapsed, g.duration), behavior: "instant" });
      g.at = window.scrollY;
      if (elapsed >= g.duration) this.glide = null;
      this.lastY = g.at;
      this.stillAt = now;
      return;
    }
    const y = window.scrollY;
    if (Math.abs(y - this.lastY) > 0.5) {
      this.dir = y > this.lastY ? 1 : -1;
      this.lastY = y;
      this.stillAt = now;
      this.moved = true;
      return;
    }
    if (!this.moved || this.touching || this.locks.size || now - this.stillAt < SETTLE_WAIT) return;
    this.moved = false;
    const f = this.frame;
    if (!this.zones) this.zones = f.tracks ? mergeSpans(this.modules.flatMap((m) => m.zones?.(f) ?? []), SETTLE_JOIN * f.vh) : [];
    const to = settleTarget(y, this.dir, this.zones);
    if (to === null) return;
    // Whole px, rounded away from the change, within the page.
    const target = clamp(to > y ? Math.ceil(to) : Math.floor(to), 0, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    if (Math.abs(target - y) >= 1) this.glide = { from: y, to: target, t0: now, duration: settleDuration(target - y, f.vh), at: y };
  }

  /** A finger down stops any settle; the page is judged again once it has come to rest after it. */
  private onTouch = (e: TouchEvent) => {
    this.touching = e.touches.length > 0;
    if (e.type !== "touchstart" || !this.glide) return;
    this.glide = null;
    this.moved = true;
  };

  private jump(y: number) {
    if (this.lenis) {
      this.lenis.scrollTo(y, { immediate: true, force: true });
      this.frame.scroll = this.lenis.scroll;
    } else {
      window.scrollTo({ top: y, behavior: "instant" });
      this.frame.scroll = window.scrollY;
    }
  }

  /**
   * Hold the frame loop (no measure, no writes) until `until` settles, then
   * measure; resolves once that measure has run. The preloader holds the
   * page's first measure until its drawing is done: on a phone, splitting
   * every block of text into lines and reading every section takes the
   * main thread for several frames, and would stall the strokes mid-line.
   * The page is hidden under the screen meanwhile.
   */
  measureAfter(until: Promise<unknown>) {
    this.holds++;
    const go = () => {
      this.holds--;
      this.requestMeasure();
      return new Promise<void>((resolve) => this.measuredWaiting.push(resolve));
    };
    return until.then(go, go);
  }

  /** Put the reader back at `y` once the page now showing has been measured (going back to a page). */
  restore(y: number) {
    this.requestMeasure();
    this.pendingRestore = Math.max(0, y);
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
      this.zones = null;
      module.destroy?.();
    };
  }

  onFrame(cb: Callback) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  /**
   * Hold the page still for `reason` (menu, route, preloader) until every
   * reason is released. Lenis cancels wheel and touch while stopped (where
   * the page scrolls natively, `blockPanels` does), except over
   * [data-lenis-prevent] panels, which it leaves alone: those may scroll
   * themselves but never chain to the page.
   */
  lock(reason: string) {
    this.locks.add(reason);
    this.lenis?.stop();
    if (this.glide) {
      this.glide = null;
      this.moved = true;
    }
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
    const waiting = this.unlocked;
    this.unlocked = [];
    waiting.forEach((cb) => cb());
  }

  /** Run `cb` now, or as soon as the page is released (Lenis cancels any glide when it starts again). */
  afterUnlock(cb: () => void) {
    if (this.locks.size) this.unlocked.push(cb);
    else cb();
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
    // A panel that scrolls by itself keeps the gesture; one that cannot would chain it to the page. Elsewhere the page is held by Lenis, or here when there is none.
    const hold = own ? !(t && scrollsWithin(t, own)) : !this.lenis;
    if (hold && e.cancelable) e.preventDefault();
  };

  scrollTo(target: number, immediate = false) {
    if (this.lenis) this.lenis.scrollTo(target, { immediate, force: true });
    else window.scrollTo({ top: target, behavior: immediate ? "instant" : "smooth" });
  }

  /**
   * Glide to a point, or to an element (its scroll-margin and the root's
   * scroll-padding respected, as the browser would), then call `done`.
   * Instant with reduced motion. Call it through `afterUnlock`.
   */
  glideTo(target: number | HTMLElement, done?: () => void) {
    const immediate = matchMedia(REDUCED_QUERY).matches;
    if (this.lenis) {
      // A native scroll this very frame (a keyboard jump, the scrollbar) has not reached Lenis yet: start from where the page is.
      if (!this.lenis.isScrolling && Math.abs(this.lenis.scroll - window.scrollY) > 1) this.jump(window.scrollY);
      this.lenis.scrollTo(target, { duration: GLIDE_S, easing: expoOut, immediate, onComplete: () => done?.() });
      return;
    }
    if (typeof target === "number") window.scrollTo({ top: target, behavior: immediate ? "instant" : "smooth" });
    else target.scrollIntoView({ behavior: immediate ? "instant" : "smooth" });
    done?.();
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

/** Module order on the homepage; the lines are split before anything measures, and the page ground runs first because Values reads its fade. */
export const ORDER = {
  lines: -1,
  ground: 0,
  hero: 1,
  intro: 2,
  story: 3,
  works: 4,
  making: 5,
  values: 6,
  servicesImage: 7,
  services: 8,
  handover: 9,
  contact: 10,
  footer: 19,
  parallax: 20,
  nav: 90,
} as const;
