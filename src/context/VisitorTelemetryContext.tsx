"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { ATTRIBUTION_STORAGE_KEY, sanitizeAttribution } from "@/lib/inquiry/attribution";
import { emptySnapshot, snapshotLimits, type ClickedCta, type InteractionState, type ViewedSection, type VisitorSnapshot } from "@/lib/ai/visitor-snapshot";

/*
 * First-party visit context for the permit strategist. It notes, in this tab
 * only, which pages and sections the visitor has looked at, which calls to
 * action they clicked and the project choices they made on the site (project
 * type, municipality, stage), so the assistant does not ask again. Nothing is
 * sent anywhere until the visitor writes to the assistant or submits a
 * request; there are no third-party trackers, cookies or beacons.
 *
 * Cheap by design: one IntersectionObserver on a line across the middle of
 * the screen (it fires only when a section crosses it), and one click and one
 * change listener on the document, both passive. Components that only need
 * the snapshot when sending read it with getVisitorSnapshot() and never
 * re-render; the widget subscribes to the current section alone.
 */

const STORAGE_KEY = "pg_visit";
/** Form fields that may be noted: choices about the project, never contact details or descriptions. */
const PROJECT_FIELDS = new Set(["projectType", "municipality", "stage"]);
/** Section markers that describe behaviour, not content. */
const IGNORED_MARKERS = new Set(["tone", "reveal", "lenis-prevent", "arrive", "telemetry"]);

interface Stored {
  startedAt: number;
  viewedSections: ViewedSection[];
  pagesViewed: string[];
  clickedCtas: ClickedCta[];
  interactionState: InteractionState;
}

type Listener = () => void;

export interface VisitorTelemetryStore {
  getVisitorSnapshot(): VisitorSnapshot;
  /** The section crossing the middle of the screen, for the advisor's greeting. */
  getCurrentSection(): ViewedSection | null;
  subscribe(listener: Listener): () => void;
  /** Lets a component (the advisor's cards) note a project choice. */
  noteInteraction(patch: InteractionState): void;
}

function createStore(): VisitorTelemetryStore & {
  setPage(path: string): void;
  setSection(section: ViewedSection | null): void;
  noteClick(cta: ClickedCta): void;
} {
  let stored: Stored = { startedAt: Date.now(), viewedSections: [], pagesViewed: [], clickedCtas: [], interactionState: {} };
  let restored = false;
  let currentPath = "/";
  let current: ViewedSection | null = null;
  const listeners = new Set<Listener>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const restore = () => {
    if (restored || typeof window === "undefined") return;
    restored = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
      if (parsed && typeof parsed.startedAt === "number") {
        stored = {
          startedAt: parsed.startedAt,
          viewedSections: Array.isArray(parsed.viewedSections) ? parsed.viewedSections.slice(-snapshotLimits.sections) : [],
          pagesViewed: Array.isArray(parsed.pagesViewed) ? parsed.pagesViewed.slice(-snapshotLimits.pages) : [],
          clickedCtas: Array.isArray(parsed.clickedCtas) ? parsed.clickedCtas.slice(-snapshotLimits.ctas) : [],
          interactionState: parsed.interactionState && typeof parsed.interactionState === "object" ? parsed.interactionState : {},
        };
      }
    } catch {
      // Storage can be unavailable (private browsing); the visit is then remembered for this page only.
    }
  };

  const save = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // See restore().
      }
    }, 800);
  };

  const pushUnique = <T,>(list: T[], item: T, same: (a: T) => boolean, max: number) => {
    const i = list.findIndex(same);
    if (i >= 0) list.splice(i, 1);
    list.push(item);
    if (list.length > max) list.splice(0, list.length - max);
  };

  return {
    setPage(path) {
      restore();
      currentPath = path;
      pushUnique(stored.pagesViewed, path, (p) => p === path, snapshotLimits.pages);
      if (current) {
        current = null;
        listeners.forEach((l) => l());
      }
      save();
    },
    setSection(section) {
      if (current?.id === section?.id && current?.path === section?.path) return;
      current = section;
      if (section) pushUnique(stored.viewedSections, section, (s) => s.id === section.id && s.path === section.path, snapshotLimits.sections);
      listeners.forEach((l) => l());
      save();
    },
    noteClick(cta) {
      restore();
      stored.clickedCtas.push(cta);
      if (stored.clickedCtas.length > snapshotLimits.ctas) stored.clickedCtas.shift();
      save();
    },
    noteInteraction(patch) {
      restore();
      stored.interactionState = {
        ...stored.interactionState,
        ...patch,
        ...(patch.fields ? { fields: { ...stored.interactionState.fields, ...patch.fields } } : {}),
      };
      save();
    },
    getCurrentSection: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVisitorSnapshot() {
      restore();
      if (typeof window === "undefined") return emptySnapshot();
      let attribution: ReturnType<typeof sanitizeAttribution> = {};
      try {
        attribution = sanitizeAttribution(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "");
      } catch {
        attribution = {};
      }
      const utmParams: Record<string, string> = {};
      for (const [k, v] of Object.entries(attribution)) if (k.startsWith("utm_") && v) utmParams[k] = v;
      return {
        currentPath: currentPath,
        pageTitle: document.title.replace(/\s*\|\s*PermitGuys\s*$/, "").slice(0, 120),
        currentSection: current,
        viewedSections: [...stored.viewedSections],
        pagesViewed: [...stored.pagesViewed],
        clickedCtas: [...stored.clickedCtas],
        interactionState: { ...stored.interactionState },
        timeOnSiteSeconds: Math.max(0, Math.round((Date.now() - stored.startedAt) / 1000)),
        referrer: attribution.referrer_host ?? "",
        utmParams,
      };
    },
  };
}

/** One store per tab, so the visit carries across client-side page changes. */
let singleton: ReturnType<typeof createStore> | null = null;
const getStore = () => (singleton ??= createStore());

const VisitorTelemetryContext = createContext<VisitorTelemetryStore | null>(null);

const clean = (s: string | null | undefined, max = 80) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** A section's stable id: data-telemetry, its id, or its first content marker (data-praise → "praise"). */
function sectionId(el: HTMLElement): string {
  if (el.dataset.telemetry) return el.dataset.telemetry;
  if (el.id) return el.id;
  for (const attr of el.getAttributeNames()) {
    if (!attr.startsWith("data-")) continue;
    const name = attr.slice(5);
    if (!IGNORED_MARKERS.has(name)) return name;
  }
  return el.getAttribute("aria-labelledby") ?? "";
}

function sectionLabel(el: HTMLElement, id: string): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  const heading = (labelledBy && document.getElementById(labelledBy)) || el.querySelector("h1, h2");
  return clean(heading?.textContent, 80) || id.replace(/[-_]/g, " ");
}

export function VisitorTelemetryProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => getStore(), []);
  const pathname = usePathname();

  // Pages viewed, and the section crossing the middle of the screen.
  useEffect(() => {
    store.setPage(pathname);
    let io: IntersectionObserver | null = null;
    // After the new page has rendered.
    const frame = requestAnimationFrame(() => {
      const sections = [...document.querySelectorAll<HTMLElement>("main section, [data-telemetry]")].filter((el) => !el.closest("#pg-chat"));
      if (!sections.length) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            const id = sectionId(el);
            if (id) store.setSection({ id, label: sectionLabel(el, id), path: pathname });
          }
        },
        // A line across the middle of the screen: cheap, and right for tall pinned sections.
        { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
      );
      sections.forEach((s) => io?.observe(s));
    });
    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
    };
  }, [pathname, store]);

  // Calls to action clicked, and project choices made in forms.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target || target.closest("#pg-chat")) return;
      const el = target.closest<HTMLElement>("a[href], [data-telemetry-cta]");
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      const isCta =
        el.hasAttribute("data-telemetry-cta") ||
        href.startsWith("/contact") ||
        href.startsWith("/services/") ||
        href.startsWith("/permit-guides/") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:");
      if (!isCta) return;
      // Phone and email links are noted by kind only.
      const safeHref = href.startsWith("tel:") ? "tel:" : href.startsWith("mailto:") ? "mailto:" : href.split("#")[0].slice(0, 200);
      store.noteClick({ label: clean(el.dataset.telemetryCta || el.getAttribute("aria-label") || el.textContent, 80), href: safeHref, path: window.location.pathname });
    };
    const onChange = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || el.closest("#pg-chat")) return;
      if (el instanceof HTMLInputElement && !["radio", "checkbox", "text", "search"].includes(el.type)) return;
      if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox") && !el.checked) return;
      const value = clean(el.value, 80);
      if (!value) return;
      if (PROJECT_FIELDS.has(el.name)) store.noteInteraction({ [el.name]: value } as InteractionState);
      else if (el.dataset.telemetryField) store.noteInteraction({ fields: { [el.dataset.telemetryField]: value } });
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    document.addEventListener("change", onChange, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("change", onChange, { capture: true });
    };
  }, [store]);

  return <VisitorTelemetryContext.Provider value={store}>{children}</VisitorTelemetryContext.Provider>;
}

/** The telemetry store. Works outside the provider too (it is one per tab). */
export function useVisitorTelemetry(): VisitorTelemetryStore {
  return useContext(VisitorTelemetryContext) ?? getStore();
}

/** The section on screen now; re-renders only when it changes. */
export function useCurrentSection(): ViewedSection | null {
  const store = useVisitorTelemetry();
  return useSyncExternalStore(store.subscribe, store.getCurrentSection, () => null);
}

/** The current visit, packaged for /api/chat and for a lead the visitor submits. */
export const getVisitorSnapshot = (): VisitorSnapshot => getStore().getVisitorSnapshot();
