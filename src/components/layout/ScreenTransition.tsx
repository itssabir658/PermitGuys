"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { engine } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { OntarioOutline } from "./OntarioOutline";

/*
 * Page transition (docs/MOTION.md, "Page transitions"), with the outline of
 * Ontario drawn over it.
 *
 * In: a graphite panel at the centre of the screen unfolds in 3D (rotated
 * 90° on both axes to flat, 0.7s) while a dim underlay fades in; from 0.35s
 * it scales up from nothing to cover the screen (0.7s, accelerating). The
 * outline draws over it from 0.2s. The next page is requested once the
 * panel covers the screen, and the transition waits for the outline to
 * finish.
 * Out: everything fades away over 0.7s, focus moves to the new page's main
 * content, and the new page's own entrance starts (the document gets
 * data-revealed again, and data-arrival="route", which hard loads never
 * have, so the entrance runs on its shorter route timing).
 *
 * Each navigation has an id, and every timer and animation callback checks
 * it, so a late timer from an earlier click can never lift the veil over
 * the wrong page. A click while the veil is lifting runs the lift back to
 * fully covered (phase "return", the mark stays drawn) and navigates from
 * there, with no second unfold.
 *
 * With reduced motion it is a 0.3s crossfade either way. Clicks with a
 * modifier key, new-tab links, downloads and links to the same page (a jump
 * within it, or only a different query, which the router swaps in place)
 * are left alone.
 */

type Phase = "idle" | "cover" | "return" | "reveal";

/** Panel unfolded and scaled to cover; the outline's last stroke done. */
const COVER_MS = 1050;
const HOLD_MS = 1500;
const OUT_MS = 700;
const QUICK_MS = 300;
/** Never leave the screen covered, whatever happens to the navigation. */
const SAFETY_MS = 5000;

interface Pending {
  id: number;
  /** pathname + search when the navigation started. */
  from: string;
  startedAt: number;
  quick: boolean;
  hash: boolean;
  push: number;
  safety: number;
}

function internalHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== "_self") return null;
  if (link.hasAttribute("download")) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return null;
  // The same page: a jump within it, or only a different query, which the router swaps in without a cover.
  if (url.pathname === location.pathname) return null;
  return url.pathname + url.search + url.hash;
}

export function ScreenTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const veil = useRef<HTMLDivElement>(null);
  const underlay = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const navId = useRef(0);
  const phaseNow = useRef<Phase>("idle");
  const pending = useRef<Pending | null>(null);
  const coverAnims = useRef<Animation[]>([]);
  const outAnim = useRef<Animation | null>(null);

  // The phase is written to the DOM at once (a click must not wait on React) and kept in state for the render.
  const show = useCallback((next: Phase) => {
    phaseNow.current = next;
    if (veil.current) veil.current.dataset.phase = next;
    setPhase(next);
  }, []);

  const reveal = useCallback((id: number, quick: boolean) => {
    if (navId.current !== id) return;
    // The new page's entrance runs on its route timing (sooner than after the preloader), as the cover lifts.
    document.documentElement.dataset.arrival = "route";
    document.documentElement.dataset.revealed = "";
    // Start keyboard and screen reader users at the new page's content, not on the link they left from.
    document.getElementById("main")?.focus({ preventScroll: true });
    engine.unlock("route");
    show("reveal");
    outAnim.current?.cancel();
    const out = veil.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: quick ? QUICK_MS : OUT_MS,
      easing: quick ? cssEase.power2InOut : cssEase.power1InOut,
      fill: "forwards",
    });
    outAnim.current = out ?? null;
    const done = () => {
      // A newer navigation owns the veil now (it may have turned this very fade around).
      if (navId.current !== id) return;
      coverAnims.current.forEach((a) => a.cancel());
      coverAnims.current = [];
      outAnim.current?.cancel();
      outAnim.current = null;
      show("idle");
    };
    if (out) out.finished.then(done, done);
    else done();
  }, [show]);

  // Intercept internal link clicks and cover the screen before navigating.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const href = internalHref(event);
      if (!href) return;
      event.preventDefault();
      // A pointer click leaves focus on the link; the header would read it as someone tabbing through it.
      if (event.detail > 0) (document.activeElement as HTMLElement | null)?.blur();
      if (pending.current) return;
      const id = ++navId.current;
      const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
      delete document.documentElement.dataset.revealed;
      engine.lock("route");
      router.prefetch(href as Route);
      const go = () => {
        if (navId.current === id) router.push(href as Route);
      };
      let push = 0;
      const lifting = outAnim.current;
      if (lifting && lifting.playState === "running") {
        // Mid-lift: run the fade back to fully covered, then navigate, with no second unfold.
        show("return");
        lifting.reverse();
        lifting.finished.then(
          () => {
            if (navId.current !== id) return;
            // Covered again: the stylesheet's own opacity holds it.
            lifting.cancel();
            if (outAnim.current === lifting) outAnim.current = null;
            go();
          },
          go,
        );
      } else if (phaseNow.current !== "idle") {
        // Still covered (the new page is holding): navigate straight from here.
        push = window.setTimeout(go, 0);
      } else {
        show("cover");
        if (quick) {
          coverAnims.current = [veil.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: QUICK_MS, easing: cssEase.power2InOut, fill: "both" })].filter((a): a is Animation => Boolean(a));
        } else {
          coverAnims.current = [
            underlay.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 200, easing: cssEase.power1InOut, fill: "both" }),
            panel.current?.animate([{ transform: "rotateX(90deg) rotateY(90deg)" }, { transform: "rotateX(0deg) rotateY(0deg)" }], { duration: 700, easing: cssEase.power1InOut, fill: "both" }),
            scaler.current?.animate([{ transform: "translate(-50%, -50%) scale(0)" }, { transform: "translate(-50%, -50%) scale(1)" }], { duration: 700, delay: 350, easing: cssEase.in, fill: "both" }),
          ].filter((a): a is Animation => Boolean(a));
        }
        push = window.setTimeout(go, quick ? QUICK_MS : COVER_MS);
      }
      const safety = window.setTimeout(() => {
        if (pending.current?.id !== id) return;
        pending.current = null;
        reveal(id, quick);
      }, SAFETY_MS);
      pending.current = { id, from: location.pathname + location.search, startedAt: performance.now(), quick, hash: href.includes("#"), push, safety };
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      const p = pending.current;
      if (p) {
        window.clearTimeout(p.push);
        window.clearTimeout(p.safety);
      }
    };
  }, [router, reveal, show]);

  // The new page has arrived: lift the screen once the outline has drawn.
  useEffect(() => {
    const p = pending.current;
    if (!p || location.pathname + location.search === p.from) return;
    window.clearTimeout(p.push);
    window.clearTimeout(p.safety);
    pending.current = null;
    // Start the new page at the top (a link to a fragment is left to the router).
    if (!p.hash) engine.scrollTo(0, true);
    engine.requestMeasure();
    const wait = Math.max(0, (p.quick ? QUICK_MS : HOLD_MS) - (performance.now() - p.startedAt));
    const t = window.setTimeout(() => reveal(p.id, p.quick), wait);
    return () => window.clearTimeout(t);
  }, [pathname, reveal]);

  return (
    <div ref={veil} aria-hidden="true" data-phase={phase} className="screen-veil">
      <div ref={underlay} className="screen-veil__underlay" />
      <div ref={scaler} className="screen-veil__scaler">
        <div ref={panel} className="screen-veil__panel" />
      </div>
      <div className="screen-veil__mark">
        <OntarioOutline className="screen-veil__map" />
        <p className="screen-veil__label">
          <span>Ontario</span>
          <span>Greater Toronto Area</span>
        </p>
      </div>
    </div>
  );
}
