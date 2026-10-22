"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GTA_POINT, ONTARIO_PATHS, ONTARIO_VIEWBOX } from "@/content/ontario";

/*
 * Screen transition with the Ontario outline.
 *
 * First visit of a session ("intro"): a graphite screen is already in place
 * when the page paints, the outline of Ontario draws itself, the Greater
 * Toronto Area is marked, and the screen lifts away to reveal the hero. This
 * part is pure CSS (globals.css, "Screen transition"), so it finishes even
 * if JavaScript never runs. A small script in the document head skips it on
 * later pages of the same visit.
 *
 * In-site navigation ("cover" then "reveal"): clicking an internal link
 * wipes the screen up from the bottom while the outline draws, the next page
 * loads underneath, and the screen lifts away again.
 *
 * Visitors who prefer reduced motion get neither: links navigate normally
 * and the intro is hidden.
 */

type Phase = "intro" | "idle" | "cover" | "reveal";

/** Time from click until the next page is requested, and until it may be revealed. */
const COVER_MS = 700;
const MIN_HOLD_MS = 1250;
const REVEAL_MS = 900;

export const INTRO_KEY = "pg-intro-seen";

/** Runs before first paint: skip the intro after the first page of a visit. */
export const introScript = `try{if(sessionStorage.getItem("${INTRO_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.introSeen=""}catch(e){}`;

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
  const [phase, setPhase] = useState<Phase>("intro");
  const pending = useRef<{ from: string; startedAt: number } | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Intro: end it once its CSS has played, or at once if it was skipped.
  useEffect(() => {
    const seen = "introSeen" in document.documentElement.dataset;
    if (!seen) {
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        // Storage can be unavailable; the intro then plays on each full page load.
      }
    }
    const t = window.setTimeout(() => setPhase("idle"), seen ? 0 : 2600);
    return () => window.clearTimeout(t);
  }, []);

  // Intercept internal link clicks and cover the screen before navigating.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const href = internalHref(event);
      if (!href) return;
      event.preventDefault();
      if (pending.current) return;
      pending.current = { from: location.pathname, startedAt: performance.now() };
      setPhase("cover");
      router.prefetch(href as Route);
      later(() => router.push(href as Route), COVER_MS);
      // Never leave the screen covered, whatever happens to the navigation.
      later(() => {
        if (pending.current) {
          pending.current = null;
          setPhase("reveal");
          later(() => setPhase("idle"), REVEAL_MS);
        }
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
    const wait = Math.max(0, MIN_HOLD_MS - (performance.now() - p.startedAt));
    const t1 = window.setTimeout(() => setPhase("reveal"), wait);
    const t2 = window.setTimeout(() => setPhase("idle"), wait + REVEAL_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return (
    <div aria-hidden="true" data-phase={phase} className="screen-veil">
      <div className="screen-veil__inner">
        <svg viewBox={ONTARIO_VIEWBOX} className="screen-veil__map" fill="none">
          {ONTARIO_PATHS.map((d, i) => (
            <path key={i} d={d} pathLength={1} className={i === 0 ? "screen-veil__land" : "screen-veil__isle"} />
          ))}
          <circle cx={GTA_POINT.x} cy={GTA_POINT.y} r={11} className="screen-veil__dot" />
          <circle cx={GTA_POINT.x} cy={GTA_POINT.y} r={11} className="screen-veil__pulse" />
        </svg>
        <p className="screen-veil__label">
          <span>Ontario</span>
          <span>Greater Toronto Area</span>
        </p>
      </div>
    </div>
  );
}
