"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { openingAssets } from "@/lib/motion/opening";
import { OntarioOutline } from "./OntarioOutline";

/*
 * Page transition (docs/MOTION.md, "Page transitions"): a graphite drawing
 * sheet with the outline of Ontario on it.
 *
 * In: the tapped link dims at once and the page darkens (0.25s) while the
 * sheet rises from the bottom edge (0.6s, --e-sheet). The outline draws on
 * the sheet from 0.15s (0.45s a stroke, 0.05s apart, the mainland 0.55s)
 * and the GTA dot pops as the last stroke closes, so the drawing comes up
 * with the sheet. The next page is requested only once the drawing is done
 * (about 0.85s), so React's commit never freezes a line half drawn.
 * Hold: two frames, and the new page's opening pictures decoded (0.9s at
 * most; openingAssets).
 * Out: the sheet leaves through the top (0.6s, power2.inOut, which gets
 * going sooner than the cover's ease) as the dimming clears (0.3s), so the
 * new page is never seen through a grey veil. The drawing stays on the
 * sheet, drifting up a little with it, until the sheet's edge passes over
 * it, so the exit never opens on a plain graphite screen. The pressed link
 * lets go. As it starts, focus moves to the new page's main content and its
 * entrance starts (the document gets data-revealed again, and
 * data-arrival="route", which hard loads never have, so the entrance runs on
 * its shorter route timing).
 *
 * Each navigation has an id, and every timer and animation callback checks
 * it, so a late timer from an earlier click can never lift the sheet over
 * the wrong page. A click while the sheet is leaving runs the exit back to
 * fully covered (phase "return") and navigates from there.
 *
 * Back and forward: each page's scroll position is kept (by URL, for the
 * session). The browser's own history step is held for a moment while the
 * finished drawing fades in over the page (0.28s), then handed to the
 * router; the page comes back at the place it was left (engine.restore),
 * with its entrance already played (data-returning), and the cover fades
 * away (0.32s).
 *
 * Links to the page itself glide to its top, and in-page links to their
 * section, which then takes focus; either closes the menu first. A link
 * that only changes the query is swapped in place by the router, with no
 * cover, and glides to the top too (the position it left is kept for Back).
 * From the keyboard, a link that goes to the top of the page moves focus to
 * the page's content, as a navigation does (on wide screens the menu button
 * is put away at the top). With reduced motion every cover is a 0.3s
 * crossfade and every glide a jump. Clicks with a modifier key, new-tab
 * links and downloads are left alone.
 */

type Phase = "idle" | "cover" | "return" | "back" | "reveal";
/** How the cover leaves: the sheet through the top, or a plain fade (back and forward, reduced motion). */
type Exit = "sheet" | "fade" | "quick";

const SHEET_MS = 600;
const UNDERLAY_MS = 250;
/** The drawing: strokes from 0.15s, 0.05s apart, 0.45s each (the mainland 0.55s), done by 0.8s; the dot pops as they close. */
const STROKE_AT = 150;
const STROKE_STEP = 50;
const STROKE_MS = 450;
const MAINLAND_MS = 550;
const LABEL_AT = 200;
const LABEL_MS = 300;
const DOT_AT = 550;
const DOT_MS = 300;
/** At most this long for the new page's opening picture. */
const HOLD_CAP_MS = 900;
/** On the way out the drawing rides up this far with the sheet, which clears it as its edge goes by. */
const MARK_LIFT_PX = 16;
/** The dimming clears with the sheet, so the new page is never shown grey. */
const UNDERLAY_OUT_MS = 300;
const QUICK_MS = 300;
const BACK_IN_MS = 280;
const BACK_OUT_MS = 320;
/** Never leave the screen covered, whatever happens to the navigation. */
const SAFETY_MS = 5000;

interface Pending {
  id: number;
  /** pathname + search when the navigation started. */
  from: string;
  exit: Exit;
  hash: boolean;
  /** Back or forward: where the page goes once it is measured. */
  restore: number | null;
  safety: number;
}

/** Scroll positions by URL (path, query and fragment), kept for the session. */
const POSITIONS_KEY = "pg:positions";
const positions = new Map<string, number>();
let positionsRead = false;

function readPositions() {
  if (positionsRead) return;
  positionsRead = true;
  try {
    const saved = JSON.parse(sessionStorage.getItem(POSITIONS_KEY) ?? "[]") as unknown;
    if (Array.isArray(saved)) for (const entry of saved) if (Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "number") positions.set(entry[0], entry[1]);
  } catch {
    // Storage blocked: positions last as long as the page.
  }
}

function keepPosition(key: string, y: number) {
  positions.delete(key);
  positions.set(key, Math.round(y));
  try {
    sessionStorage.setItem(POSITIONS_KEY, JSON.stringify([...positions].slice(-40)));
  } catch {
    // As above.
  }
}

const page = () => location.pathname + location.search;
const entry = () => page() + location.hash;

/** The anchor a plain left click landed on, unless the browser should handle it (modifier keys, new tabs, downloads, other sites). */
function linkOf(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== "_self") return null;
  if (link.hasAttribute("download")) return null;
  return new URL(link.href, location.href).origin === location.origin ? link : null;
}

/**
 * Close the menu if it is open, and let a pointer click leave no focus behind (the header would read it as someone
 * tabbing). From the keyboard, focus goes to `focus` when one is given (the page's content, for a link that goes to the
 * top of the page, where wide screens put the menu button away), or else back to the menu button.
 */
function settle(pointer: boolean, focus?: HTMLElement | null) {
  window.dispatchEvent(new CustomEvent("pg:close-menu", { detail: { keyboard: !pointer && !focus } }));
  if (pointer) (document.activeElement as HTMLElement | null)?.blur?.();
  else focus?.focus({ preventScroll: true });
}

const frames = (n: number) => new Promise<void>((resolve) => {
  const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
  step(n);
});
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** The new page is ready to be shown: laid out, and its opening pictures decoded (not waited for past the cap). */
function arrived() {
  return Promise.race([Promise.all([frames(2), ...openingAssets()]), wait(HOLD_CAP_MS)]);
}

export function ScreenTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const veil = useRef<HTMLDivElement>(null);
  const underlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const navId = useRef(0);
  const phaseNow = useRef<Phase>("idle");
  const pending = useRef<Pending | null>(null);
  const coverAnims = useRef<Animation[]>([]);
  const outAnims = useRef<Animation[]>([]);
  /** Resolves once the screen is fully covered (the cover, a return or the fade before a history step). */
  const covered = useRef<Promise<unknown>>(Promise.resolve());
  /** The page on screen (pathname + search), and its entry with the fragment. */
  const shown = useRef("");
  const shownEntry = useRef("");
  /** A history step held back from the router until the cover is up. */
  const held = useRef(false);
  const replaying = useRef(false);

  // The phase is written to the DOM at once (a click must not wait on React) and kept in state for the render.
  const show = useCallback((next: Phase) => {
    phaseNow.current = next;
    if (veil.current) veil.current.dataset.phase = next;
    setPhase(next);
  }, []);

  const reveal = useCallback(
    (id: number, exit: Exit) => {
      if (navId.current !== id) return;
      const html = document.documentElement;
      // Whatever way the cover goes (an arrival, the safety, a step back to where it started), the pressed link lets go.
      document.querySelectorAll<HTMLElement>("[data-pressed]").forEach((el) => delete el.dataset.pressed);
      // The new page's entrance runs on its route timing (sooner than after the preloader), as the cover lifts.
      html.dataset.arrival = "route";
      html.dataset.revealed = "";
      // Start keyboard and screen reader users at the new page's content, not on the link they left from.
      document.getElementById("main")?.focus({ preventScroll: true });
      engine.unlock("route");
      show("reveal");
      outAnims.current.forEach((a) => a.cancel());
      const fill = "forwards" as const;
      const anims =
        exit === "sheet"
          ? [
              mark.current?.animate([{ transform: "none" }, { transform: `translateY(-${MARK_LIFT_PX}px)` }], { duration: SHEET_MS, easing: cssEase.power2InOut, fill }),
              panel.current?.animate([{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: SHEET_MS, easing: cssEase.power2InOut, fill }),
              underlay.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: UNDERLAY_OUT_MS, easing: cssEase.power1InOut, fill }),
            ]
          : [veil.current?.animate([{ opacity: 1 }, { opacity: 0 }], exit === "quick" ? { duration: QUICK_MS, easing: cssEase.power2InOut, fill } : { duration: BACK_OUT_MS, easing: cssEase.power2Out, fill })];
      const out = anims.filter((a): a is Animation => Boolean(a));
      outAnims.current = out;
      const done = () => {
        // A newer navigation owns the veil now (it may have turned this very exit around).
        if (navId.current !== id) return;
        coverAnims.current.forEach((a) => a.cancel());
        coverAnims.current = [];
        outAnims.current.forEach((a) => a.cancel());
        outAnims.current = [];
        show("idle");
      };
      Promise.all(out.map((a) => a.finished)).then(done, done);
    },
    [show],
  );

  /** A navigation that the veil now owns: earlier timers and callbacks stand down, and the screen is never left covered. */
  const begin = useCallback(
    (from: string, exit: Exit, hash: boolean, restore: number | null) => {
      const prev = pending.current;
      if (prev) window.clearTimeout(prev.safety);
      const id = ++navId.current;
      const safety = window.setTimeout(() => {
        if (pending.current?.id !== id) return;
        pending.current = null;
        reveal(id, exit);
      }, SAFETY_MS);
      pending.current = { id, from, exit, hash, restore, safety };
      return id;
    },
    [reveal],
  );

  /** Run the exit back to fully covered (a click or a history step while the cover is leaving). */
  const turnBack = useCallback(() => {
    const leaving = outAnims.current;
    show("return");
    leaving.forEach((a) => a.reverse());
    covered.current = Promise.all(leaving.map((a) => a.finished)).then(() => {
      // Covered again: the cover's own animations (or the stylesheet) hold it.
      leaving.forEach((a) => a.cancel());
      if (outAnims.current === leaving) outAnims.current = [];
    });
    return covered.current;
  }, [show]);

  useEffect(() => {
    readPositions();
    shown.current = page();
    shownEntry.current = entry();
  }, []);

  // Internal links to other pages: cover the screen, then navigate. Links to this page glide.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = linkOf(event);
      if (!link) return;
      const url = new URL(link.href, location.href);
      const pointer = event.detail > 0;
      if (url.pathname === location.pathname) {
        // A jump within the page is handled on the way back up, after the link's own handlers (onFragment).
        if (url.search === location.search && url.hash.length > 1) return;
        const busy = phaseNow.current !== "idle" || pending.current !== null;
        const main = document.getElementById("main");
        if (url.search === location.search) {
          // The page itself: glide to its top (a navigation would only reload what is already here).
          event.preventDefault();
          if (busy) return;
          settle(pointer, main);
          engine.afterUnlock(() => engine.glideTo(0));
          return;
        }
        // Only the query differs: the router swaps the page in place, with no cover; the reader goes to its top.
        if (busy) {
          event.preventDefault();
          return;
        }
        // Back comes here again: keep the place, under this entry's own key.
        keepPosition(entry(), window.scrollY);
        settle(pointer, main);
        engine.afterUnlock(() => engine.glideTo(0));
        // The router writes the new entry once the new query's page is in: from then on it is the page showing.
        const next = url.pathname + url.search;
        const until = performance.now() + SAFETY_MS;
        const watch = () => {
          if (page() === next) {
            shown.current = page();
            shownEntry.current = entry();
          } else if (performance.now() < until) requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
        return;
      }
      event.preventDefault();
      if (pointer) (document.activeElement as HTMLElement | null)?.blur();
      if (pending.current) return;
      const href = url.pathname + url.search + url.hash;
      const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const html = document.documentElement;
      keepPosition(entry(), window.scrollY);
      delete html.dataset.revealed;
      engine.lock("route");
      router.prefetch(href as Route);
      const id = begin(page(), quick ? "quick" : "sheet", url.hash.length > 1, null);
      const go = () => {
        if (navId.current !== id) return;
        // Out of sight now: the page gone back to earlier may play entrances again.
        delete html.dataset.returning;
        router.push(href as Route);
      };
      if (phaseNow.current === "reveal" && outAnims.current.some((a) => a.playState === "running")) {
        // Mid-exit: run it back to fully covered, then navigate, with no second rise.
        turnBack().then(go, go);
        return;
      }
      if (phaseNow.current !== "idle") {
        // Still covered (the last page is holding, or the cover is coming back): navigate as soon as it is up.
        covered.current.then(go, go);
        return;
      }
      if (!quick) link.dataset.pressed = "";
      show("cover");
      coverAnims.current.forEach((a) => a.cancel());
      if (quick) {
        coverAnims.current = [veil.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: QUICK_MS, easing: cssEase.power2InOut, fill: "both" })].filter((a): a is Animation => Boolean(a));
        covered.current = Promise.all(coverAnims.current.map((a) => a.finished));
        covered.current.then(go, go);
        return;
      }
      const fill = "both" as const;
      const strokes = [...(veil.current?.querySelectorAll<SVGGElement>(".ontario__stroke") ?? [])].flatMap((group, i) =>
        [...group.querySelectorAll<SVGPathElement>("path")].map((path) =>
          path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: i === 0 ? MAINLAND_MS : STROKE_MS, delay: STROKE_AT + i * STROKE_STEP, easing: cssEase.power2InOut, fill }),
        ),
      );
      const dot = veil.current?.querySelector<SVGElement>(".ontario__dot")?.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: DOT_MS, delay: DOT_AT, easing: cssEase.power3Out, fill });
      const sheet = panel.current?.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], { duration: SHEET_MS, easing: cssEase.sheet, fill });
      coverAnims.current = [
        underlay.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: UNDERLAY_MS, easing: cssEase.power1Out, fill }),
        sheet,
        veil.current?.querySelector<HTMLElement>(".screen-veil__label")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: LABEL_MS, delay: LABEL_AT, easing: cssEase.power2Out, fill }),
        dot,
        ...strokes,
      ].filter((a): a is Animation => Boolean(a));
      covered.current = Promise.all([sheet?.finished]);
      // Navigate once the last line is drawn, not on a timer: the router's commit must not freeze a stroke.
      Promise.all([...strokes, dot].map((a) => a?.finished)).then(go, go);
    };

    // A jump within the page glides to its section, which then takes focus. Run after the link's own handlers, so a link that
    // handles itself (the form's error summary) is left alone. The entry is pushed through the router's history, so going back
    // to it later restores this page (a native fragment jump leaves an entry the router cannot restore).
    const onFragment = (event: MouseEvent) => {
      const link = linkOf(event);
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname || url.search !== location.search || url.hash.length < 2) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target || phaseNow.current !== "idle") return;
      event.preventDefault();
      settle(event.detail > 0);
      if (url.hash !== location.hash) {
        keepPosition(entry(), window.scrollY);
        history.pushState(null, "", url.hash);
        shownEntry.current = entry();
      }
      engine.afterUnlock(() => engine.glideTo(target, () => target.focus({ preventScroll: true })));
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("click", onFragment);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("click", onFragment);
      const p = pending.current;
      if (p) window.clearTimeout(p.safety);
    };
  }, [router, begin, show, turnBack]);

  // Back and forward.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      // Our own hand-over of a held step: the router takes it from here.
      if (replaying.current) return;
      keepPosition(shownEntry.current, engine.frame.scroll);
      const key = entry();
      const saved = positions.get(key);
      if (location.pathname === new URL(shownEntry.current || location.href, location.href).pathname) {
        // The same page (another fragment or query): glide back to where the reader was, or to the section.
        shown.current = page();
        shownEntry.current = key;
        if (phaseNow.current !== "idle") return;
        const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
        if (saved != null || target) engine.afterUnlock(() => engine.glideTo(saved ?? target ?? 0));
        return;
      }
      // Entries the router did not write are its own business (it reloads them), except one with no state at all (a
      // fragment typed into the address bar): the router ignores those and would leave the other page showing.
      if (!(event.state as { __NA?: boolean } | null)?.__NA) {
        if (event.state == null) location.reload();
        return;
      }
      const html = document.documentElement;
      html.dataset.returning = "";
      shownEntry.current = key;
      const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const running = pending.current;
      const exit: Exit = quick ? "quick" : phaseNow.current === "cover" || phaseNow.current === "return" ? running?.exit ?? "sheet" : "fade";
      begin(shown.current, exit, false, saved ?? 0);
      engine.lock("route");
      // Hold the step until the screen is covered, so the page never cuts under a half-drawn cover.
      event.stopImmediatePropagation();
      if (held.current) return;
      held.current = true;
      if (phaseNow.current === "idle") {
        show("back");
        coverAnims.current.forEach((a) => a.cancel());
        coverAnims.current = [veil.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: BACK_IN_MS, easing: cssEase.power1Out, fill: "both" })].filter((a): a is Animation => Boolean(a));
        covered.current = Promise.all(coverAnims.current.map((a) => a.finished));
      } else if (phaseNow.current === "reveal") turnBack();
      let handed = false;
      const handOver = () => {
        if (handed) return;
        handed = true;
        held.current = false;
        const p = pending.current;
        // Back where we started (back, then forward again): nothing will arrive, so lift the cover over this page.
        if (p && page() === p.from) {
          pending.current = null;
          window.clearTimeout(p.safety);
          engine.restore(p.restore ?? 0);
          arrived().then(() => reveal(p.id, p.exit));
          return;
        }
        replaying.current = true;
        try {
          window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
        } finally {
          replaying.current = false;
        }
      };
      covered.current.then(handOver, handOver);
      window.setTimeout(handOver, SHEET_MS + 300);
    };
    // Capture: at the window, capture listeners run before the router's own listener, which this one may hold back.
    window.addEventListener("popstate", onPop, { capture: true });
    return () => window.removeEventListener("popstate", onPop, { capture: true });
  }, [begin, reveal, show, turnBack]);

  // The new page has arrived: lift the cover once it is laid out and its opening picture is ready.
  useEffect(() => {
    const p = pending.current;
    if (!p || page() === p.from) return;
    window.clearTimeout(p.safety);
    pending.current = null;
    shown.current = page();
    shownEntry.current = entry();
    if (p.restore != null) engine.restore(p.restore);
    // Start the new page at the top (a link to a fragment is left to the router).
    else if (!p.hash) engine.scrollTo(0, true);
    engine.requestMeasure();
    let live = true;
    arrived().then(() => {
      if (live) reveal(p.id, p.exit);
    });
    return () => {
      live = false;
    };
  }, [pathname, reveal]);

  return (
    <div ref={veil} aria-hidden="true" data-phase={phase} className="screen-veil">
      <div ref={underlay} className="screen-veil__underlay" />
      <div ref={panel} className="screen-veil__panel">
        <div ref={mark} className="screen-veil__mark">
          <OntarioOutline className="screen-veil__map" />
          <p className="screen-veil__label">
            <span>Ontario</span>
            <span>Greater Toronto Area</span>
          </p>
        </div>
      </div>
    </div>
  );
}
