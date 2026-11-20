import { afterEach, describe, expect, it, vi } from "vitest";
import { locations, servedMunicipalities, servedWithoutPage } from "@/content/locations";
import { services } from "@/content/services";
import { nextAttribution } from "@/lib/inquiry/attribution";
import { faqPageSchema, locationServiceSchema, organizationSchema, serviceSchema } from "@/lib/jsonld";
import { paths } from "@/lib/routes";

/** Imports a module fresh with the given environment, since site.ts reads it at load time. */
async function withEnv<T>(env: Record<string, string | undefined>, load: () => Promise<T>): Promise<T> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  return load();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production origin", () => {
  it("uses www.permitguys.ca on a Vercel production build without NEXT_PUBLIC_SITE_URL", async () => {
    const { site } = await withEnv({ NEXT_PUBLIC_SITE_URL: "", VERCEL_ENV: "production" }, () => import("@/content/site"));
    expect(site.url).toBe("https://www.permitguys.ca");
    expect(site.indexable).toBe(true);
  });

  it("keeps previews and local builds out of search indexes", async () => {
    const { site } = await withEnv({ NEXT_PUBLIC_SITE_URL: "", VERCEL_ENV: "preview", NEXT_PUBLIC_VERCEL_ENV: "preview" }, () => import("@/content/site"));
    expect(site.indexable).toBe(false);
  });
});

describe("robots.txt", () => {
  it("lets search and AI answer engines crawl everything but /api/", async () => {
    const robots = (await withEnv({ NEXT_PUBLIC_SITE_URL: "https://www.permitguys.ca" }, () => import("@/app/robots"))).default();
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Googlebot", "Bingbot", "ClaudeBot", "Google-Extended"]) {
      const rule = rules.find((r) => [r.userAgent].flat().includes(bot));
      expect(rule, bot).toBeDefined();
      expect(rule?.allow).toBe("/");
      expect(rule?.disallow).toBe("/api/");
      expect([rule?.disallow].flat()).not.toContain("/");
    }
    expect(robots.sitemap).toBe("https://www.permitguys.ca/sitemap.xml");
  });
});

describe("sitemap", () => {
  it("lists every service, guide and municipality page on the canonical origin", async () => {
    const entries = (await withEnv({ NEXT_PUBLIC_SITE_URL: "https://www.permitguys.ca" }, () => import("@/app/sitemap"))).default();
    const urls = entries.map((e) => e.url);
    for (const s of services) expect(urls).toContain(`https://www.permitguys.ca${paths.service(s.slug)}`);
    for (const l of locations) expect(urls).toContain(`https://www.permitguys.ca${paths.serviceArea(l.slug)}`);
    expect(new Set(urls).size).toBe(urls.length);
    for (const e of entries) expect(e.priority).toBeGreaterThan(0);
  });
});

describe("service-area pages", () => {
  it("exist only for municipalities the business serves and has verified local information for", () => {
    const served = servedMunicipalities.map((m) => m.place);
    expect(locations.length).toBeGreaterThan(0);
    for (const l of locations) {
      expect(served).toContain(l.name);
      expect(l.coverage).toBe("confirmed");
      expect(l.officialLinks.length).toBeGreaterThan(0);
      expect(l.localPermitInfo[0].paragraphs.length).toBeGreaterThan(0);
    }
    // Not served, so no page (the site lists their official links only).
    for (const name of ["Vaughan", "Richmond Hill", "Caledon", "Milton", "Pickering", "Ajax", "Whitby", "Halton Hills"]) {
      expect(locations.map((l) => l.name)).not.toContain(name);
    }
    expect(servedWithoutPage).toEqual(served.filter((p) => !locations.some((l) => l.name === p)));
  });

  it("opens with an answer-first summary of 40 to 60 words", () => {
    for (const l of locations) {
      const words = l.summary.split(/\s+/).length;
      expect(words, l.name).toBeGreaterThanOrEqual(40);
      expect(words, l.name).toBeLessThanOrEqual(60);
    }
  });

  it("never quotes fees or review times other than Toronto's published ones", () => {
    for (const l of locations) {
      const text = JSON.stringify(l);
      expect(text, l.name).not.toMatch(/\$\s?\d/);
      if (l.name !== "Toronto") expect(text, l.name).not.toMatch(/business days/);
    }
  });
});

describe("structured data", () => {
  it("names every served municipality in areaServed and never marks up reviews", () => {
    const org = organizationSchema();
    expect(org.areaServed.map((a) => a.name)).toEqual(servedMunicipalities.map((m) => m.place));
    expect(JSON.stringify(org)).not.toMatch(/aggregateRating|"review"/);
  });

  it("builds Service and FAQPage data that round-trips through JSON", () => {
    const l = locations[0];
    const path = paths.serviceArea(l.slug);
    const graph = [locationServiceSchema(l, path), faqPageSchema(l.faqs ?? [], path), serviceSchema(services[0], paths.service(services[0].slug))];
    const parsed = JSON.parse(JSON.stringify(graph));
    expect(parsed[0]).toMatchObject({ "@type": "Service", areaServed: { "@type": "City", name: l.name } });
    expect(parsed[1]["@type"]).toBe("FAQPage");
    expect(parsed[1].mainEntity.length).toBe(l.faqs?.length);
    for (const q of parsed[1].mainEntity) {
      expect(q["@type"]).toBe("Question");
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });
});

describe("llms.txt", () => {
  it("indexes services, municipalities and contact details", async () => {
    const { llmsIndex, llmsFull } = await withEnv({ NEXT_PUBLIC_SITE_URL: "https://www.permitguys.ca" }, () => import("@/lib/llms"));
    const index = llmsIndex();
    expect(index.startsWith("# PermitGuys")).toBe(true);
    for (const needle of ["416-479-9556", "info@permitguys.ca", "https://www.permitguys.ca/contact/", "BCIN"]) expect(index).toContain(needle);
    // The owner's direct email and WhatsApp are for lead routing only, never published here.
    for (const text of [index, llmsFull()]) expect(text).not.toMatch(/mzaman@|647\D*968\D*6284|whatsapp/i);
    for (const l of locations) expect(index).toContain(`https://www.permitguys.ca${paths.serviceArea(l.slug)}`);
    for (const s of services) expect(index).toContain(`https://www.permitguys.ca${paths.service(s.slug)}`);
    expect(llmsFull().length).toBeGreaterThan(index.length);
  });
});

describe("AI referrals", () => {
  it("keeps utm_source=chatgpt.com with the inquiry", () => {
    const a = nextAttribution(new URL("https://www.permitguys.ca/services/deck-permits/?utm_source=chatgpt.com"), "https://chatgpt.com/", null);
    expect(a).toMatchObject({ utm_source: "chatgpt.com", referrer_host: "chatgpt.com", landing_page: "/services/deck-permits/" });
  });
});
