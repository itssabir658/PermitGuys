import type { Photo } from "./types";

/**
 * Business facts. Every `null` here is information the business has not
 * supplied yet. Templates show a clearly marked placeholder for null values
 * and leave them out of structured data, so nothing is invented.
 *
 * Search the codebase for "PLACEHOLDER" to find every visible placeholder.
 */
export const site = {
  name: "PermitGuys",
  legalName: null as string | null,
  tagline: "Permit drawings and permit guidance for GTA homeowners",
  description:
    "PermitGuys prepares permit drawings and helps homeowners and property owners in the Greater Toronto Area navigate the building permit process for additions, basement apartments, decks, custom homes and commercial interiors.",
  /** Region named in the brief. Individual municipalities are confirmed in locations.ts. */
  region: "Greater Toronto Area, Ontario",
  locale: "en_CA",
  contact: {
    phone: null as string | null,
    email: null as string | null,
    address: null as string | null,
    hours: null as string | null,
  },
  /** Absolute or root-relative URL of the supplied logo (square, at least 112px). */
  logo: null as string | null,
  /**
   * Licensed architectural photograph for the homepage hero (landscape, at
   * least 2000px wide, stored under /public/images). Until one is supplied the
   * hero shows a drafted elevation instead. See docs/IMAGES.md.
   */
  heroPhoto: null as Photo | null,
  /**
   * Google review summary, shown as a link to the Business Profile once the
   * business confirms it. Never marked up as review structured data:
   * Google does not allow self-serving review markup.
   */
  reviews: null as { rating: string; count: number; url: string } | null,
  /** Verified credentials only, such as designer registrations (BCIN). */
  credentials: [] as string[],
  /**
   * Official profiles the business controls, such as its Google Business
   * Profile, LinkedIn or Houzz page. Used for schema.org `sameAs`.
   */
  social: [] as { label: string; url: string }[],
  /**
   * Set NEXT_PUBLIC_SITE_URL to the production origin. Until it is set,
   * pages are served with noindex and robots.txt disallows crawling.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  indexable: Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.SITE_NOINDEX !== "true",
  /** Search engine ownership tokens (meta tag method). See docs/SEARCH_CONSOLE.md. */
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    bing: process.env.BING_SITE_VERIFICATION || undefined,
  },
} as const;
