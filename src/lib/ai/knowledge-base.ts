import { guides } from "@/content/guides";
import { GTA_PERMITS_CHECKED_ON, gtaPermits, ontarioPermitFacts, type MunicipalPermitInfo, type SourceLink } from "@/content/gta-permits";
import { homeFaqs } from "@/content/faqs";
import { locations } from "@/content/locations";
import { otherWork } from "@/content/other-work";
import { homeSteps } from "@/content/process";
import { services } from "@/content/services";
import { site } from "@/content/site";
import type { Faq, ProcessStep } from "@/content/types";
import { paths } from "@/lib/routes";
import { PROJECT_TYPES, type ProjectTypeKey } from "./project-types";

export * from "./project-types";

/*
 * Everything the permit strategist may say about PermitGuys, as one typed
 * object. It is built from the same content files as the pages, so the
 * assistant knows exactly what the site publishes and nothing more: change
 * a content file and the assistant knows after the next deployment.
 *
 * What the business has not confirmed (prices, packages, turnaround times,
 * the areas it serves) is not filled in. `pendingBusinessInputs` below holds
 * those as nulls; the tools say "to be confirmed by PermitGuys" until someone
 * at PermitGuys sets them. Search for PLACEHOLDER.
 *
 * Shared by the server (prompt and tools) and the browser (labels on the
 * scope card), so it stays free of server-only and browser-only APIs.
 */

/** Services that are no longer offered. Kept out even if a content file still lists them. */
const RETIRED_SERVICES = new Set(["landlord-permits"]);

export interface ServiceKnowledge {
  slug: string;
  name: string;
  category: "residential" | "commercial";
  page: string;
  scope: string;
  directAnswer: string;
  overview: string[];
  whoItsFor: string[];
  /** The drawings and documents an application of this kind commonly includes, in the site's words. */
  drawingSet: { intro: string; items: string[]; qualifier: string };
  process: ProcessStep[];
  costFactors: string[];
  timelineFactors: string[];
  faqs: Faq[];
}

/**
 * PLACEHOLDER: facts only PermitGuys can supply. While a value is null the
 * assistant says it is confirmed in the quote and never estimates it. Fill
 * these in (in the business's own words) to let the scope card show them.
 */
export const pendingBusinessInputs = {
  /** How long PermitGuys typically takes to prepare permit drawings, e.g. "2 to 3 weeks after the site measure". */
  draftingTurnaround: null as string | null,
  /** Named packages with what each includes and, if published, a starting price. */
  packages: null as { name: string; includes: string; startingPrice?: string }[] | null,
  /** What happens when the municipality asks for revisions (for example, whether responses to comments are included). */
  revisionPolicy: null as string | null,
  /** How soon the team replies to a request from the assistant, e.g. "within one business day". */
  responseTime: null as string | null,
};


const sources = (list: SourceLink[]) => list.map((s) => ({ label: s.label, url: s.url }));

function serviceKnowledge(): ServiceKnowledge[] {
  return services
    .filter((s) => !RETIRED_SERVICES.has(s.slug))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      category: s.category,
      page: paths.service(s.slug),
      scope: s.scope,
      directAnswer: s.directAnswer,
      overview: s.overview,
      whoItsFor: s.whoItsFor,
      drawingSet: { intro: s.typicalRequirements.intro, items: s.typicalRequirements.items, qualifier: s.typicalRequirements.qualifier },
      process: s.process,
      costFactors: s.costFactors,
      timelineFactors: s.timelineFactors,
      faqs: s.faqs,
    }));
}

/** Review time frames the site publishes (the permit costs and timelines guide). */
function reviewTimeframes() {
  const guide = guides.find((g) => g.slug === "permit-costs-and-timelines");
  const section = guide?.sections.find((s) => s.table);
  return {
    summary: guide?.directAnswer ?? "",
    notes: section?.paragraphs ?? [],
    /** Published by the City of Toronto only; other municipalities publish their own. */
    toronto: section?.table ? { caption: section.table.caption, rows: section.table.rows.map(([building, days]) => ({ building, days })), source: section.table.source } : null,
    page: paths.guide("permit-costs-and-timelines"),
  };
}

/**
 * Answers to the objections visitors raise most, built only from what the
 * site says. Each line can be said as it stands; none promises an outcome.
 */
const objections = [
  {
    objection: "Why not let my contractor pull the permit?",
    response: [
      "Whoever submits the application, the municipality reviews the drawings, and drawings that leave questions unanswered are what lead to revision rounds.",
      "In Ontario, designers who are not architects or engineers must be qualified and registered (a BCIN), and most applications include a Schedule 1 form naming the designer. We are Small Buildings BCIN certified with architectural stamps in house, and we design and engineer the project rather than only drafting it.",
      "Many visitors use both: we prepare the design and permit drawings and respond to the municipality's review comments, and their contractor builds from a permitted set.",
    ],
  },
  {
    objection: "How long does the city take?",
    response: [
      "Ontario's Building Code sets time frames for a municipality to decide on a complete application. The City of Toronto, for example, lists 10 business days for houses and 15 for small buildings. Other municipalities publish their own.",
      "Those clocks start only once the application is complete, and they can restart when revisions are needed, which is why a complete, clear set matters more than anything else you control. Drawing time and any planning approval come before that.",
    ],
  },
  {
    objection: "What if the city asks for revisions?",
    response: [
      "Municipalities often ask questions or request revisions; it is a normal part of review. We respond to review comments on our drawings.",
      "We check the main zoning and Building Code considerations we can identify before drawing, and flag anything that needs another consultant or a planning approval early, to reduce revision rounds. Nobody but the municipality decides when a permit is issued.",
    ],
  },
  {
    objection: "How much will it cost?",
    response: [
      "Our fees depend on the scope, so we quote after we understand what you want to build. Municipal permit fees are separate and set by your municipality.",
      "The things that move the cost are the size and complexity of the project, whether a survey or existing-condition measurements are needed, whether other consultants are involved, whether a variance is needed, and how many revision rounds the review requires.",
    ],
  },
  {
    objection: "Do I really need a permit?",
    response: [
      "It depends on the work and the municipality. Building, adding to or structurally altering a building generally needs one in Ontario, and many municipalities list what does and does not. Your building department makes the final call for your property.",
    ],
  },
  {
    objection: "I already started (or got a stop-work order).",
    response: [
      "It happens. The way forward is usually drawings of what is there and what is proposed, submitted to the municipality. We can assess what exists and prepare the drawings; what the municipality requires next is its decision.",
    ],
  },
] as const;

export const PERMIT_GUYS_KNOWLEDGE = {
  firm: {
    name: site.name,
    description: site.description,
    positioning:
      "An architecture and engineering firm in Oakville. It designs and engineers residential and commercial projects across the Greater Toronto Area and prepares the drawings and documents for the building permit. Permits are the outcome, not the identity.",
    region: site.region,
    office: site.contact.address,
    hours: site.contact.hours,
    phone: site.contact.phone,
    email: site.contact.email,
    credentials: site.credentials,
    reviews: site.reviews ? { rating: site.reviews.rating, count: site.reviews.count, asOf: site.reviews.asOf } : null,
    permitsIssued: site.projectsMap?.permits ?? null,
    pages: {
      services: paths.services,
      howItWorks: paths.howItWorks,
      guides: paths.guides,
      projects: paths.projects,
      about: paths.about,
      contact: paths.contact,
      privacy: paths.privacy,
    },
  },
  services: serviceKnowledge(),
  otherWork: otherWork.map((w) => w.label),
  process: homeSteps,
  faqs: homeFaqs,
  guides: guides.map((g) => ({
    slug: g.slug,
    title: g.title,
    page: paths.guide(g.slug),
    directAnswer: g.directAnswer,
    sections: g.sections.map((s) => ({ heading: s.heading, paragraphs: s.paragraphs, list: s.list ?? [] })),
    faqs: g.faqs,
  })),
  reviewTimeframes: reviewTimeframes(),
  /** Municipalities the business has confirmed it serves (src/content/locations.ts). Empty means none confirmed yet. */
  confirmedServiceAreas: locations.filter((l) => l.coverage === "confirmed").map((l) => l.name),
  ontario: { facts: ontarioPermitFacts.facts, sources: sources(ontarioPermitFacts.sources) },
  municipalities: { checkedOn: GTA_PERMITS_CHECKED_ON, list: gtaPermits },
  objections,
  pending: pendingBusinessInputs,
} as const;

export type PermitGuysKnowledge = typeof PERMIT_GUYS_KNOWLEDGE;

/* ---------- Lookups used by the tools ---------- */

export function serviceFor(type: ProjectTypeKey): ServiceKnowledge | null {
  const slug = PROJECT_TYPES[type].service;
  return slug ? (PERMIT_GUYS_KNOWLEDGE.services.find((s) => s.slug === slug) ?? null) : null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(the\s+)?(city|town|township|municipality)\s+of\s+/, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The GTA reference entry for a town or city the visitor named, if the site has one. */
export function municipalityFor(name: string | undefined | null): MunicipalPermitInfo | null {
  if (!name) return null;
  const n = norm(name);
  if (!n) return null;
  return gtaPermits.find((m) => norm(m.name) === n || n.includes(norm(m.name))) ?? null;
}

/** Whether the business has confirmed it serves a municipality. Unknown is not "no": the team confirms. */
export function isConfirmedServiceArea(name: string | undefined | null): boolean {
  if (!name) return false;
  const n = norm(name);
  return PERMIT_GUYS_KNOWLEDGE.confirmedServiceAreas.some((a) => norm(a) === n);
}

/** Lines of a municipality's reference that mention any of the keywords. */
export function municipalFactsAbout(m: MunicipalPermitInfo, keywords: readonly string[], max = 3): string[] {
  if (!keywords.length) return m.facts.slice(0, 1);
  // The lines that mention the most keywords first, in the reference's order among equals.
  const scored = m.facts
    .map((f, i) => ({ f, i, hits: keywords.filter((k) => f.toLowerCase().includes(k)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.i - b.i);
  return (scored.length ? scored.map((x) => x.f) : m.facts.slice(0, 1)).slice(0, max);
}

export const OFFICIAL_SOURCE_HOSTS = [
  ...new Set([...ontarioPermitFacts.sources, ...gtaPermits.flatMap((m) => m.sources)].map((s) => new URL(s.url).hostname.replace(/^www\./, ""))),
];
