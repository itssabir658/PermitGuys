"use client";

import { useEffect, useRef } from "react";

/**
 * Drives the homepage hero's scroll sequence. Marks the hero as live (which
 * pins it for one extra screen of scrolling, see globals.css) and writes
 * scroll progress through that screen to --p, from 0 to 1. Only on large
 * screens, and never for visitors who prefer reduced motion.
 */
export function HeroScroll() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const query = matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const travel = hero.offsetHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / travel)) : 0;
      hero.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const apply = () => {
      if (query.matches) {
        hero.dataset.live = "";
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
      } else {
        delete hero.dataset.live;
        hero.style.removeProperty("--p");
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={ref} hidden />;
}
