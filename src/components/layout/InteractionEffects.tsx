"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { REVEAL_SETTLE, ROW_SELECTOR, readingOrder, revealDelay } from "@/lib/motion/reveal";
import { resplitIfNeeded, splitLines } from "@/lib/motion/split";

interface Arrival {
  el: HTMLElement;
  top: number;
  left: number;
}

/**
 * Renders nothing. Adds page-wide effects without wrapping content in
 * client components:
 * - Scroll reveals on inner pages (globals.css, "Inner pages"). Headings
 *   marked data-reveal-lines are split into masked lines once the fonts
 *   are in, and split again when their width changes. In a group marked
 *   data-reveal-type="rows" every row is revealed on its own, so a long
 *   chart or list comes in as it is reached rather than as one slab. Other
 *   data-reveal elements rise, unveil, draw a rule or draw an outline.
 *   Each piece is hidden, then shown as it reaches the bottom 8% of the
 *   screen; pieces that arrive together follow one another in reading
 *   order, and anything already in the first screen waits for the page
 *   header's entrance (data-revealed). Content is visible by default, so it
 *   stays readable without JavaScript and for crawlers. Skipped for
 *   visitors who prefer reduced motion.
 * - Section tracking: the "On this page" index marks the section being read.
 */
export function InteractionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const headings = [...document.querySelectorAll<HTMLElement>("[data-reveal-lines]")];
    if (!("IntersectionObserver" in window) || !("ResizeObserver" in window)) {
      // Never leave a heading waiting for a split that will not come.
      headings.forEach((el) => el.removeAttribute("data-reveal-lines"));
      return;
    }
    let alive = true;
    let first = true;
    let waiting: Arrival[] = [];

    const show = (batch: Arrival[], base: number) => {
      readingOrder(batch).forEach(({ el }, k) => {
        el.style.setProperty("--o", String(revealDelay(k, base)));
        el.dataset.reveal = "shown";
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const batch: Arrival[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          batch.push({ el: entry.target as HTMLElement, top: entry.boundingClientRect.top, left: entry.boundingClientRect.left });
        }
        // The first batch is the first screen: it follows the header's entrance.
        const base = first ? REVEAL_SETTLE : 0;
        first = false;
        if (batch.length === 0) return;
        if ("revealed" in root.dataset) show(batch, base);
        else waiting.push(...batch);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // The preloader or the page transition has lifted: the first screen comes in after the header.
    const lifted = new MutationObserver(() => {
      if (!("revealed" in root.dataset) || waiting.length === 0) return;
      show(waiting, REVEAL_SETTLE);
      waiting = [];
    });
    lifted.observe(root, { attributes: true, attributeFilter: ["data-revealed"] });

    // Anything wholly above the screen (a page opened at a fragment) is left as it is.
    const hide = (el: HTMLElement) => {
      if (el.dataset.reveal === "shown" || el.getBoundingClientRect().bottom <= 0) return false;
      el.dataset.reveal = "hidden";
      return true;
    };

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (hide(el)) observer.observe(el);
    });

    document.querySelectorAll<HTMLElement>('[data-reveal-type="rows"]').forEach((group) => {
      group.querySelectorAll<HTMLElement>(ROW_SELECTOR).forEach((row) => {
        const outer = row.parentElement?.closest(ROW_SELECTOR);
        if ((outer && group.contains(outer)) || row.closest(".sr-only, [data-reveal]")) return;
        row.dataset.revealType = "row";
        if (hide(row)) observer.observe(row);
      });
    });

    // Headings: only plain text is split, so inline links or markup are never flattened.
    const lines = new Map<HTMLElement, HTMLElement[]>();
    const index = (el: HTMLElement, inners: HTMLElement[]) => {
      lines.set(el, inners);
      inners.forEach((inner, i) => inner.parentElement?.style.setProperty("--i", String(i)));
    };
    const plain: HTMLElement[] = [];
    for (const el of headings) {
      if (el.children.length > 0 && !("split" in el.dataset)) {
        el.removeAttribute("data-reveal-lines");
        continue;
      }
      plain.push(el);
      if (el.dataset.revealLines !== "entrance") hide(el);
    }
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const el of plain) {
          const current = lines.get(el);
          if (!current) continue;
          const next = resplitIfNeeded(el, current);
          if (next === current) continue;
          // The page title's entrance has played (or is playing): its new lines are simply there.
          if (el.dataset.revealLines === "entrance" && "revealed" in root.dataset) el.dataset.settled = "";
          index(el, next);
        }
      });
    });
    const fontsIn = Promise.race([document.fonts.ready, new Promise((resolve) => window.setTimeout(resolve, 2500))]);
    fontsIn.then(() => {
      if (!alive) return;
      for (const el of plain) {
        index(el, splitLines(el));
        resize.observe(el);
        if (el.dataset.reveal === "hidden") observer.observe(el);
      }
    });

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      lifted.disconnect();
      resize.disconnect();
      // Never leave content hidden when the page changes underneath us.
      document.querySelectorAll<HTMLElement>('[data-reveal="hidden"]').forEach((el) => (el.dataset.reveal = "shown"));
    };
  }, [pathname]);

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
