"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
 * Out: everything fades away over 0.7s, and the new page's own entrance
 * starts (the document gets data-revealed again).
 *
 * With reduced motion it is a 0.3s crossfade either way. Clicks with a
 * modifier key, new-tab links, downloads and jumps within the page are left
 * to the browser.
 */

type Phase = "idle" | "cover" | "reveal";

/** Panel unfolded and scaled to cover; the outline's last stroke done. */
const COVER_MS = 1050;
const HOLD_MS = 1500;
const OUT_MS = 700;
const QUICK_MS = 300;

function internalHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== "_self") return null;
  if (link.hasAttribute("download")) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return null;
  // Same page, or a jump within it: let the browser handle it.
  if (url.pathname === location.pathname && url.search === location.search) return null;
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
  const pending = useRef<{ from: string; startedAt: number; quick: boolean; hash: boolean } | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const reveal = (quick: boolean) => {
    document.documentElement.dataset.revealed = "";
    engine.start();
    setPhase("reveal");
    const out = veil.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: quick ? QUICK_MS : OUT_MS,
      easing: quick ? cssEase.power2InOut : cssEase.power1InOut,
      fill: "forwards",
    });
    const done = () => {
      veil.current?.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      setPhase("idle");
    };
    if (out) out.finished.then(done, done);
    else done();
  };

  // Intercept internal link clicks and cover the screen before navigating.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const href = internalHref(event);
      if (!href) return;
      event.preventDefault();
      if (pending.current) return;
      const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
      pending.current = { from: location.pathname, startedAt: performance.now(), quick, hash: href.includes("#") };
      delete document.documentElement.dataset.revealed;
      engine.stop();
      setPhase("cover");
      if (quick) {
        veil.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: QUICK_MS, easing: cssEase.power2InOut, fill: "both" });
      } else {
        underlay.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 200, easing: cssEase.power1InOut, fill: "both" });
        panel.current?.animate([{ transform: "rotateX(90deg) rotateY(90deg)" }, { transform: "rotateX(0deg) rotateY(0deg)" }], { duration: 700, easing: cssEase.power1InOut, fill: "both" });
        scaler.current?.animate([{ transform: "translate(-50%, -50%) scale(0)" }, { transform: "translate(-50%, -50%) scale(1)" }], { duration: 700, delay: 350, easing: cssEase.in, fill: "both" });
      }
      router.prefetch(href as Route);
      later(() => router.push(href as Route), quick ? QUICK_MS : COVER_MS);
      // Never leave the screen covered, whatever happens to the navigation.
      later(() => {
        if (!pending.current) return;
        pending.current = null;
        reveal(quick);
      }, 5000);
    };
    document.addEventListener("click", onClick, { capture: true });
    const pendingTimers = timers.current;
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      pendingTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [router]);

  // The new page has arrived: lift the screen once the outline has drawn.
  useEffect(() => {
    const p = pending.current;
    if (!p || pathname === p.from) return;
    pending.current = null;
    // Start the new page at the top (a link to a fragment is left to the router).
    if (!p.hash) engine.scrollTo(0, true);
    engine.requestMeasure();
    const wait = Math.max(0, (p.quick ? QUICK_MS : HOLD_MS) - (performance.now() - p.startedAt));
    const t = window.setTimeout(() => reveal(p.quick), wait);
    return () => window.clearTimeout(t);
  }, [pathname]);

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
