import { expect, test } from "@playwright/test";

/*
 * Search and answer-engine output on the production build: JSON-LD parses
 * on the homepage, a service page and every municipality page, FAQPage
 * mirrors the questions shown, and robots.txt and llms.txt are served.
 * (Run with NEXT_PUBLIC_SITE_URL set at build time for the indexable rules.)
 */

async function jsonLd(request: import("@playwright/test").APIRequestContext, path: string) {
  const res = await request.get(path);
  expect(res.status(), path).toBe(200);
  const html = await res.text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  expect(blocks.length, path).toBeGreaterThan(0);
  return { html, data: blocks.flatMap((b) => [JSON.parse(b)].flat()) as Record<string, unknown>[] };
}

test.describe("structured data and crawler files", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "HTTP-only checks run once");
  });

  test("JSON-LD parses on the homepage", async ({ request }) => {
    const { data } = await jsonLd(request, "/");
    const types = data.map((d) => d["@type"]);
    expect(types).toEqual(expect.arrayContaining(["ProfessionalService", "WebSite", "WebPage"]));
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating/);
  });

  test("JSON-LD parses on every municipality page, with Service, FAQPage and breadcrumbs", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const cityPaths = [...sitemap.matchAll(/<loc>[^<]*?(\/service-areas\/[^<]+\/)<\/loc>/g)].map((m) => m[1]);
    expect(cityPaths.length).toBeGreaterThan(0);
    for (const path of cityPaths) {
      const { html, data } = await jsonLd(request, path);
      const types = data.map((d) => d["@type"]);
      expect(types, path).toEqual(expect.arrayContaining(["Service", "FAQPage", "BreadcrumbList"]));
      expect(types.filter((t) => t === "FAQPage").length, path).toBe(1);
      const faq = data.find((d) => d["@type"] === "FAQPage") as { mainEntity: { name: string }[] };
      for (const q of faq.mainEntity) expect(html, `${path}: ${q.name}`).toContain(q.name.replace(/'/g, "&#x27;"));
    }
  });

  test("JSON-LD parses on a service page", async ({ request }) => {
    const { data } = await jsonLd(request, "/services/deck-permits/");
    expect(data.map((d) => d["@type"])).toEqual(expect.arrayContaining(["Service", "FAQPage", "BreadcrumbList"]));
  });

  test("robots.txt and llms.txt are served", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/User-Agent: \*/);
    expect((await request.get("/llms.txt")).status()).toBe(200);
    expect((await request.get("/llms-full.txt")).status()).toBe(200);
  });
});
