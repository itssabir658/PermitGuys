import { describe, expect, it } from "vitest";
import { guides } from "@/content/guides";
import { locations } from "@/content/locations";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import type { CaseStudy, Location } from "@/content/types";
import { ContentError, validateContent } from "@/lib/validation/content";

const base = { services, guides, locations, projects };

describe("content validation", () => {
  it("accepts the shipped content", () => {
    expect(() => validateContent(base)).not.toThrow();
  });

  it("rejects references to unknown slugs", () => {
    const broken = [{ ...services[0], relatedGuides: ["no-such-guide"] }, ...services.slice(1)];
    expect(() => validateContent({ ...base, services: broken })).toThrow(ContentError);
  });

  it("rejects duplicate slugs", () => {
    expect(() => validateContent({ ...base, guides: [...guides, guides[0]] })).toThrow(/duplicated/);
  });

  it("requires guide titles to be questions", () => {
    const g = [{ ...guides[0], title: "Building permits" }, ...guides.slice(1)];
    expect(() => validateContent({ ...base, guides: g })).toThrow(/question/);
  });

  it("rejects a reviewer without a review date", () => {
    const g = [{ ...guides[0], reviewer: { name: "A. Person", credentials: "BCIN" }, lastReviewed: null }, ...guides.slice(1)];
    expect(() => validateContent({ ...base, guides: g })).toThrow(/lastReviewed/);
  });

  it("requires local information and official links for confirmed locations", () => {
    const thin: Location = {
      slug: "example",
      name: "Example",
      region: "Example Region",
      coverage: "confirmed",
      summary: "Summary.",
      localPermitInfo: [],
      officialLinks: [],
      relatedServices: [],
      relatedGuides: [],
      seo: { title: "Example", description: "Example." },
    };
    expect(() => validateContent({ ...base, locations: [thin] })).toThrow(/local permit information/);
  });

  it("rejects a case study linked to an unconfirmed location", () => {
    const loc: Location = {
      slug: "example",
      name: "Example",
      region: "Region",
      coverage: "unconfirmed",
      summary: "Summary.",
      localPermitInfo: [],
      officialLinks: [],
      relatedServices: [],
      relatedGuides: [],
      seo: { title: "Example", description: "Example." },
    };
    const project: CaseStudy = {
      slug: "p",
      title: "Project",
      approved: true,
      services: ["deck-permits"],
      location: "example",
      summary: "Summary.",
      brief: ["Brief."],
      scope: ["Scope."],
      outcome: [],
      visual: { drawing: "deck", alt: "Deck" },
      seo: { title: "Project", description: "Project." },
    };
    expect(() => validateContent({ ...base, locations: [loc], projects: [project] })).toThrow(/unconfirmed location/);
  });
});

describe("copy guardrails", () => {
  const allCopy = JSON.stringify([services, guides]);

  it("contains no prices", () => {
    expect(allCopy).not.toMatch(/\$\s?\d/);
  });

  it("makes no approval guarantees or superlatives", () => {
    expect(allCopy).not.toMatch(/guaranteed approval|we guarantee|best in|#1|number one|fastest/i);
  });

  it("only uses https sources", () => {
    for (const g of guides) for (const s of g.sources) expect(s.url).toMatch(/^https:\/\//);
  });
});
