import { describe, expect, it } from "vitest";
import { guides } from "@/content/guides";
import { legacyRedirects } from "@/content/redirects";
import { services } from "@/content/services";
import { breadcrumbSchema, guidePageFacts, guideSchema, organizationSchema, serviceSchema, webPageSchema } from "@/lib/jsonld";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

describe("structured data", () => {
  it("describes the business without unverified facts", () => {
    const org = organizationSchema();
    // No confirmed address yet, so not a LocalBusiness type.
    expect(org["@type"]).toBe("Organization");
    for (const key of ["telephone", "email", "address", "aggregateRating", "review", "openingHours"]) expect(org).not.toHaveProperty(key);
    expect(org.knowsAbout).toEqual(services.map((s) => s.name));
  });

  it("links pages, breadcrumbs and services by @id", () => {
    const path = paths.service(services[0].slug);
    const page = webPageSchema({ path, name: services[0].name });
    const crumbs = breadcrumbSchema([{ name: "Home", path: "/" }, { name: services[0].name, path }]);
    const service = serviceSchema(services[0], path);
    expect(page.breadcrumb).toEqual({ "@id": crumbs["@id"] });
    expect(service.mainEntityOfPage).toEqual({ "@id": page["@id"] });
    expect(service.provider).toEqual({ "@id": organizationSchema()["@id"] });
  });

  it("credits guides to the organization and names a reviewer only when one is recorded", () => {
    const g = guides[0];
    const article = guideSchema(g, paths.guide(g.slug));
    expect(article.author).toEqual({ "@id": organizationSchema()["@id"] });
    expect(JSON.stringify(article)).not.toContain('"Person"');
    expect(guidePageFacts({ ...g, reviewer: null, lastReviewed: null })).toEqual({});
    expect(guidePageFacts({ ...g, reviewer: { name: "A. Reviewer", credentials: "BCIN 12345" }, lastReviewed: "2026-10-01" })).toMatchObject({
      lastReviewed: "2026-10-01",
      reviewedBy: { "@type": "Person", name: "A. Reviewer" },
    });
  });
});

describe("page metadata", () => {
  it("sets canonical, Open Graph and Twitter data from one source", () => {
    const m = pageMetadata({ title: "Deck Permits", description: "About decks.", path: "/services/deck-permits/" });
    expect(m.alternates?.canonical).toBe("/services/deck-permits/");
    expect(m.openGraph).toMatchObject({ url: "/services/deck-permits/", title: "Deck Permits | PermitGuys" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.robots).toBeUndefined();
    expect(pageMetadata({ title: "x", description: "y", path: "/", noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});

describe("redirects", () => {
  it("point old URLs at real pages", () => {
    const live = new Set<string>([...Object.values(paths).filter((p) => typeof p === "string"), ...services.map((s) => paths.service(s.slug)), ...guides.map((g) => paths.guide(g.slug))]);
    expect(legacyRedirects.length).toBeGreaterThan(0);
    for (const r of legacyRedirects) {
      expect(r.source.startsWith("/") && r.source.endsWith("/")).toBe(true);
      expect(live.has(r.source)).toBe(false);
      expect(live.has(r.destination)).toBe(true);
    }
  });
});
