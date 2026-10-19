/**
 * Permanent redirects from the current permitguys.ca (WordPress) site to
 * the closest page on this site, so old links and search results keep
 * working after the switch.
 *
 * The old URLs come from search results for permitguys.ca (the site could
 * not be crawled from the build environment), recorded in the project notes
 * on 2026-10-19. Before launch, export the full URL list from Google Search
 * Console (Indexing > Pages) or a crawl of the old site and add any missing
 * pages, especially individual blog posts. Destinations must be live pages;
 * tests/seo.test.ts checks this.
 */
export const legacyRedirects: { source: string; destination: string }[] = [
  { source: "/contact-us/", destination: "/contact/" },
  { source: "/get-a-quote/", destination: "/contact/" },
  // Laneway and garden suites have no page yet; send visitors to all services.
  { source: "/laneway-suite/", destination: "/services/" },
  // Point at /service-areas/burlington/ once Burlington is a confirmed service area.
  { source: "/burlington-building-permits/", destination: "/service-areas/" },
  { source: "/blogs/", destination: "/permit-guides/" },
  // Old blog posts until each one is mapped to a matching guide.
  { source: "/blogs/:slug*/", destination: "/permit-guides/" },
];
