"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Renders nothing. Adds page-wide effects without wrapping content in
 * client components:
 * - Scroll reveal: elements marked data-reveal that start below the fold
 *   fade up as they enter the viewport. Content is visible by default, so
 *   it stays readable without JavaScript and for crawlers.
 * - Spotlight: cards with the .spotlight class get a soft copper glow that
 *   follows the pointer.
 * - Section tracking: the "On this page" index marks the section being read.
 * The first two are skipped for visitors who prefer reduced motion.
 */
export function InteractionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const fold = window.innerHeight;
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.dataset.reveal === "shown" || el.getBoundingClientRect().top < fold) return;
      el.dataset.reveal = "hidden";
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
      // Never leave content hidden when the page changes underneath us.
      document.querySelectorAll<HTMLElement>('[data-reveal="hidden"]').forEach((el) => (el.dataset.reveal = "shown"));
    };
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const card = (e.target instanceof Element ? e.target : null)?.closest<HTMLElement>(".spotlight");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('nav[data-toc] a[href^="#"]')];
    if (links.length === 0 || !("IntersectionObserver" in window)) return;
    const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = [...byId.keys()].find((id) => visible.has(id));
        if (!current) return;
        byId.forEach((a, id) => (id === current ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
