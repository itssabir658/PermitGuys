/**
 * Content schemas for PermitGuys.
 *
 * Content lives in typed modules under src/content and is validated at load
 * time by src/lib/validation/content.ts, so a missing required field fails
 * the build instead of shipping a broken page. Fields typed `| null` are
 * facts the business has not supplied yet; templates render a visible
 * placeholder (or omit the block) when they are null.
 */

export type DrawingVariant =
  | "addition"
  | "commercial"
  | "landlord"
  | "interior"
  | "basement"
  | "deck"
  | "custom-home"
  | "plan";

/** A licensed photograph stored under /public/images with its provenance. */
export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  licence: string;
  sourceUrl: string;
}

/** Visual for a page or card: a supplied photo, or a drafted illustration. */
export interface Visual {
  drawing: DrawingVariant;
  photo?: Photo;
  /** Describes the illustration for screen readers when no photo is set. */
  alt: string;
}

export interface Faq {
  question: string;
  /** Paragraphs. Keep answers qualified and point to the authority. */
  answer: string[];
}

export interface SourceRef {
  title: string;
  publisher: string;
  url: string;
  /** ISO date the source was last checked by a person, or null if not yet. */
  checked: string | null;
}

export interface SeoFields {
  title: string;
  description: string;
}

export interface ProcessStep {
  title: string;
  body: string;
  /** Who carries this step, so pages never imply PermitGuys does it all. */
  owner: "PermitGuys" | "You" | "Municipality" | "Other consultants";
}

export type ServiceCategory = "residential" | "commercial";

export interface Service {
  slug: string;
  name: string;
  /** Short label for navigation and cards. */
  navLabel: string;
  category: ServiceCategory;
  /** Primary services get prominence on the homepage and in navigation. */
  featured: boolean;
  summary: string;
  /** One or two sentences that directly answer "what is this service?". */
  directAnswer: string;
  overview: string[];
  whoItsFor: string[];
  typicalRequirements: {
    intro: string;
    items: string[];
    qualifier: string;
  };
  process: ProcessStep[];
  costFactors: string[];
  timelineFactors: string[];
  faqs: Faq[];
  relatedGuides: string[];
  relatedServices: string[];
  visual: Visual;
  seo: SeoFields;
}

export interface DataTable {
  caption: string;
  columns: string[];
  rows: string[][];
  /** Where the figures come from, shown under the table. */
  source: string;
}

export interface GuideSection {
  /** Phrase as the question a reader would ask. */
  heading: string;
  paragraphs: string[];
  list?: string[];
  table?: DataTable;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Guide {
  slug: string;
  /** Question-led title, used as the H1. */
  title: string;
  /** Short label for navigation and footers. */
  navLabel: string;
  summary: string;
  directAnswer: string;
  sections: GuideSection[];
  /** Plain-language definitions of terms the guide relies on. */
  keyTerms?: KeyTerm[];
  sources: SourceRef[];
  /** ISO date of the last human review, or null until a review happens. */
  lastReviewed: string | null;
  /** Verified reviewer only; null renders a placeholder, never a fake name. */
  reviewer: { name: string; credentials: string } | null;
  faqs: Faq[];
  relatedGuides: string[];
  relatedServices: string[];
  seo: SeoFields;
}

export interface OfficialLink {
  label: string;
  url: string;
}

export interface Location {
  slug: string;
  name: string;
  region: string;
  /**
   * Only "confirmed" locations get a page. The business must confirm it
   * serves a municipality before it is set to confirmed.
   */
  coverage: "confirmed" | "unconfirmed";
  summary: string;
  localPermitInfo: GuideSection[];
  officialLinks: OfficialLink[];
  relatedServices: string[];
  relatedGuides: string[];
  seo: SeoFields;
}

export interface CaseStudy {
  slug: string;
  title: string;
  /** Must be true, set only after the client approves publication. */
  approved: boolean;
  services: string[];
  /** Location slug, only when that location is confirmed. */
  location: string | null;
  summary: string;
  brief: string[];
  scope: string[];
  /** What happened, as stated by the business. No invented results. */
  outcome: string[];
  visual: Visual;
  seo: SeoFields;
}
