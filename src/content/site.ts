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
  /** Verified credentials only, such as designer registrations (BCIN). */
  credentials: [] as string[],
  social: [] as { label: string; url: string }[],
  /**
   * Set NEXT_PUBLIC_SITE_URL to the production origin. Until it is set,
   * pages are served with noindex and robots.txt disallows crawling.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  indexable: Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.SITE_NOINDEX !== "true",
} as const;
