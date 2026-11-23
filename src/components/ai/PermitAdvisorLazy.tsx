"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ASK_EVENT, askAssistant, type AskDetail } from "@/lib/chat/ask";

/*
 * The permit strategist (PermitAdvisorWidget.tsx), loaded once the page has
 * opened rather than with it. The widget carries the AI SDK and its schemas,
 * the largest script on the site, and nothing of it shows before the façade
 * has opened (Preloader.tsx), so it is fetched once the page is revealed and
 * the browser is idle: the page's own scripts hydrate sooner, and the
 * façade opens sooner on a slow phone.
 *
 * Should the homepage showcase ask before it has arrived (ASK_EVENT), the
 * question is kept, the widget is fetched at once, and the question is
 * asked again as soon as the widget listens.
 */

/** Never later than this after navigation, whatever the page is doing. */
const LATEST_MS = 9000;

export function PermitAdvisorLazy() {
  const [Widget, setWidget] = useState<ComponentType | null>(null);
  const pending = useRef<AskDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    const onAsk = (e: Event) => {
      pending.current = (e as CustomEvent<AskDetail>).detail;
      load();
    };
    const load = () => {
      if (started) return;
      started = true;
      void import("./PermitAdvisorWidget").then((m) => {
        if (cancelled) return;
        window.removeEventListener(ASK_EVENT, onAsk);
        setWidget(() => m.PermitAdvisorWidget);
      });
    };
    const html = document.documentElement;
    const idle = (fn: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: 2000 });
      else window.setTimeout(fn, 200);
    };
    const whenOpen = () => {
      if ("preloaded" in html.dataset || !("motion" in html.dataset)) idle(load);
    };
    whenOpen();
    const watch = new MutationObserver(whenOpen);
    watch.observe(html, { attributes: true, attributeFilter: ["data-preloaded"] });
    const latest = window.setTimeout(load, Math.max(0, LATEST_MS - performance.now()));
    window.addEventListener(ASK_EVENT, onAsk);
    return () => {
      cancelled = true;
      watch.disconnect();
      window.clearTimeout(latest);
      window.removeEventListener(ASK_EVENT, onAsk);
    };
  }, []);

  // A child's effects run before its parent's, so the widget is listening by now. Two frames on, it has also
  // seen where the showcase is (its first IntersectionObserver report), which decides where focus returns on close.
  useEffect(() => {
    if (!Widget || !pending.current) return;
    const detail = pending.current;
    pending.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => askAssistant(detail)));
  }, [Widget]);

  return Widget ? <Widget /> : null;
}
