/*
 * What the site knows about the current visit, packaged for the permit
 * strategist. Gathered in the browser by VisitorTelemetryProvider
 * (src/context/VisitorTelemetryContext.tsx), kept in the visitor's own tab
 * (sessionStorage), and sent only with a chat message or a request the
 * visitor submits. It never holds names, emails, phone numbers, addresses or
 * free text the visitor typed into a form.
 *
 * Shared by the browser and the server, so it stays free of server-only and
 * browser-only APIs and of zod (kept out of the page bundle).
 */

export interface ViewedSection {
  /** Stable id: the element's data-telemetry, id or data-* marker. */
  id: string;
  /** A readable name, from the section's heading where there is one. */
  label: string;
  path: string;
}

export interface ClickedCta {
  label: string;
  href: string;
  path: string;
}

/** Choices a visitor made on the site (never contact details or free text). */
export interface InteractionState {
  projectType?: string;
  municipality?: string;
  stage?: string;
  /** Anything else marked with data-telemetry-field, by field name. */
  fields?: Record<string, string>;
}

export interface VisitorSnapshot {
  currentPath: string;
  pageTitle: string;
  /** The section crossing the middle of the screen right now. */
  currentSection: ViewedSection | null;
  viewedSections: ViewedSection[];
  pagesViewed: string[];
  clickedCtas: ClickedCta[];
  interactionState: InteractionState;
  timeOnSiteSeconds: number;
  /** Host of the referring site only, never the full address. */
  referrer: string;
  utmParams: Record<string, string>;
}

export const snapshotLimits = {
  sections: 30,
  pages: 20,
  ctas: 15,
  text: 120,
  fields: 8,
} as const;

export const emptySnapshot = (): VisitorSnapshot => ({
  currentPath: "/",
  pageTitle: "",
  currentSection: null,
  viewedSections: [],
  pagesViewed: [],
  clickedCtas: [],
  interactionState: {},
  timeOnSiteSeconds: 0,
  referrer: "",
  utmParams: {},
});

const clip = (v: unknown, max: number = snapshotLimits.text) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f<>]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Looks like contact details: never kept, wherever it turns up. */
const PERSONAL = /@|\d{3}\D{0,3}\d{3}\D{0,3}\d{4}/;
const safe = (v: unknown, max?: number) => {
  const s = clip(v, max);
  return PERSONAL.test(s) ? "" : s;
};

const section = (v: unknown): ViewedSection | null => {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const id = safe(r.id, 60);
  return id ? { id, label: safe(r.label) || id, path: safe(r.path, 200) } : null;
};

/**
 * Checks a snapshot that came from the browser. Everything is optional and
 * capped; anything unexpected is dropped rather than rejected, so a bad
 * snapshot never stops a visitor's message.
 */
export function sanitizeSnapshot(raw: unknown): VisitorSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(-max) : []);
  const interaction = (r.interactionState && typeof r.interactionState === "object" ? r.interactionState : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (interaction.fields && typeof interaction.fields === "object") {
    for (const [k, v] of Object.entries(interaction.fields as Record<string, unknown>).slice(0, snapshotLimits.fields)) {
      const key = safe(k, 40);
      const value = safe(v, 80);
      if (key && value) fields[key] = value;
    }
  }
  const utm: Record<string, string> = {};
  if (r.utmParams && typeof r.utmParams === "object") {
    for (const [k, v] of Object.entries(r.utmParams as Record<string, unknown>)) {
      if (/^utm_(source|medium|campaign|term|content)$/.test(k)) {
        const value = safe(v, 100);
        if (value) utm[k] = value;
      }
    }
  }
  const seconds = Number(r.timeOnSiteSeconds);
  return {
    currentPath: safe(r.currentPath, 200) || "/",
    pageTitle: safe(r.pageTitle),
    currentSection: section(r.currentSection),
    viewedSections: list(r.viewedSections, snapshotLimits.sections).map(section).filter((s): s is ViewedSection => s !== null),
    pagesViewed: list(r.pagesViewed, snapshotLimits.pages).map((p) => safe(p, 200)).filter(Boolean),
    clickedCtas: list(r.clickedCtas, snapshotLimits.ctas)
      .map((c) => {
        const o = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
        return { label: safe(o.label, 80), href: safe(o.href, 200), path: safe(o.path, 200) };
      })
      .filter((c) => c.label || c.href),
    interactionState: {
      ...(safe(interaction.projectType, 60) ? { projectType: safe(interaction.projectType, 60) } : {}),
      ...(safe(interaction.municipality, 60) ? { municipality: safe(interaction.municipality, 60) } : {}),
      ...(safe(interaction.stage, 80) ? { stage: safe(interaction.stage, 80) } : {}),
      ...(Object.keys(fields).length ? { fields } : {}),
    },
    timeOnSiteSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.min(Math.round(seconds), 60 * 60 * 24) : 0,
    referrer: safe(r.referrer, 100),
    utmParams: utm,
  };
}

/** The snapshot as short lines for the system prompt. */
export function describeSnapshot(s: VisitorSnapshot): string {
  const minutes = Math.round(s.timeOnSiteSeconds / 60);
  const lines = [
    `Current page: ${s.pageTitle || s.currentPath} (${s.currentPath})`,
    s.currentSection ? `Section on screen now: ${s.currentSection.label}` : "",
    s.viewedSections.length ? `Sections viewed, oldest first: ${s.viewedSections.map((v) => `${v.label} (${v.path})`).join("; ")}` : "",
    s.pagesViewed.length ? `Pages viewed: ${s.pagesViewed.join(", ")}` : "",
    s.clickedCtas.length ? `Buttons and links clicked: ${s.clickedCtas.map((c) => `${c.label || c.href} on ${c.path}`).join("; ")}` : "",
    s.interactionState.projectType ? `Project type chosen on the site: ${s.interactionState.projectType}` : "",
    s.interactionState.municipality ? `Municipality entered on the site: ${s.interactionState.municipality}` : "",
    s.interactionState.stage ? `Project stage chosen on the site: ${s.interactionState.stage}` : "",
    s.interactionState.fields ? `Other choices: ${Object.entries(s.interactionState.fields).map(([k, v]) => `${k}=${v}`).join(", ")}` : "",
    `Time on site: ${minutes < 1 ? "under a minute" : `about ${minutes} minute${minutes === 1 ? "" : "s"}`}`,
    s.referrer ? `Came from: ${s.referrer}` : "",
    Object.keys(s.utmParams).length ? `Campaign: ${Object.entries(s.utmParams).map(([k, v]) => `${k}=${v}`).join(", ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
