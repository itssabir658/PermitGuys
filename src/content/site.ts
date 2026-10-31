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
  tagline: "Architecture, engineering and permit drawings in the Greater Toronto Area",
  description:
    "PermitGuys is an architecture and engineering firm in Oakville. We take additions, custom homes, basement apartments, decks and commercial interiors across the Greater Toronto Area from the first idea to drawings ready for the building permit.",
  /** Region named in the brief. Individual municipalities are confirmed in locations.ts. */
  region: "Greater Toronto Area, Ontario",
  locale: "en_CA",
  /** Confirmed by the business on 2026-10-22 (office address, phone, email and hours from its card). */
  contact: {
    phone: "416-479-9556" as string | null,
    email: "info@permitguys.ca" as string | null,
    address: "2115 South Service Rd West, Oakville, ON L6L 5W2" as string | null,
    hours: "Weekdays 9:00 AM to 5:00 PM. Weekends by appointment only." as string | null,
  },
  /** The office address in parts, for structured data. */
  postalAddress: {
    streetAddress: "2115 South Service Rd West",
    addressLocality: "Oakville",
    addressRegion: "ON",
    postalCode: "L6L 5W2",
    addressCountry: "CA",
  } as { streetAddress: string; addressLocality: string; addressRegion: string; postalCode: string; addressCountry: string } | null,
  /** Weekday opening hours for structured data; weekends are by appointment and left out. */
  openingHours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "17:00" }] as { days: string[]; opens: string; closes: string }[],
  /** Absolute or root-relative URL of the supplied logo (square, at least 112px). */
  logo: null as string | null,
  /**
   * Google review summary from the Business Profile, read from the
   * profile on the date in `asOf`. Shown as a link to the reviews; live
   * figures and review text replace it when the Places API is configured
   * (see src/lib/reviews.ts). Never marked up as review structured data:
   * Google does not allow self-serving review markup.
   */
  reviews: {
    rating: 4.8,
    count: 59,
    url: "https://www.google.com/maps/search/?api=1&query=Permitguys%2C%202115%20S%20Service%20Rd%20W%2C%20Oakville%2C%20ON",
    asOf: "2026-10-19",
  } as { rating: number; count: number; url: string; asOf: string } | null,
  /**
   * What the map shows. `query` is any Google Maps search: the business
   * listing, or the service area if the address is not to be published.
   * `note` is shown under the label.
   */
  map: {
    query: "Permitguys, 2115 S Service Rd W, Oakville, ON L6L 5W2",
    label: "2115 South Service Rd West, Oakville, ON L6L 5W2",
    note: "Our office. Weekend visits by appointment only.",
  } as { query: string; label: string; note?: string },
  /**
   * The firm's own Google My Maps map of its projects ("Our Projects",
   * supplied by the business on 31 October 2026): one pin per client
   * project. `mid` is the map's id from its embed link.
   */
  projectsMap: {
    mid: "1TuO8AYFVvh5b1pRdq_TYlNBSngzpcEc",
    title: "Where our projects are",
  } as { mid: string; title: string } | null,
  /** Verified credentials only, in the business's own words (confirmed 2026-10-22). */
  credentials: ["Small Buildings BCIN certified", "Full architectural stamps in house"] as string[],
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
