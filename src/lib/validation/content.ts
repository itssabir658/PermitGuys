import type { CaseStudy, Guide, Location, Service, SourceRef } from "@/content/types";

/**
 * Runtime checks for content files. TypeScript guarantees shape; these checks
 * cover what types cannot: empty strings, broken cross-references, duplicate
 * slugs and malformed URLs or dates. Any problem throws, which fails the build.
 */

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid content:\n- ${problems.join("\n- ")}`);
    this.name = "ContentError";
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Problems = string[];

function text(p: Problems, where: string, value: string | undefined | null) {
  if (typeof value !== "string" || value.trim() === "") p.push(`${where} is required`);
}

function list(p: Problems, where: string, values: string[] | undefined, min = 1) {
  if (!Array.isArray(values) || values.length < min) {
    p.push(`${where} needs at least ${min} item(s)`);
    return;
  }
  values.forEach((v, i) => text(p, `${where}[${i}]`, v));
}

function url(p: Problems, where: string, value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") p.push(`${where} must use https`);
  } catch {
    p.push(`${where} is not a valid URL`);
  }
}

function seo(p: Problems, where: string, s: { title: string; description: string }) {
  text(p, `${where}.seo.title`, s.title);
  text(p, `${where}.seo.description`, s.description);
  if (s.title.length > 65) p.push(`${where}.seo.title is longer than 65 characters`);
  if (s.description.length > 170) p.push(`${where}.seo.description is longer than 170 characters`);
}

function uniqueSlugs(p: Problems, kind: string, items: { slug: string }[]) {
  const seen = new Set<string>();
  for (const { slug } of items) {
    if (!SLUG.test(slug)) p.push(`${kind} slug "${slug}" must be lowercase words joined by hyphens`);
    if (seen.has(slug)) p.push(`${kind} slug "${slug}" is duplicated`);
    seen.add(slug);
  }
}

function refs(p: Problems, where: string, slugs: string[], known: Set<string>) {
  for (const s of slugs) if (!known.has(s)) p.push(`${where} references unknown slug "${s}"`);
}

function source(p: Problems, where: string, s: SourceRef) {
  text(p, `${where}.title`, s.title);
  text(p, `${where}.publisher`, s.publisher);
  url(p, `${where}.url`, s.url);
  if (s.checked !== null && !ISO_DATE.test(s.checked)) p.push(`${where}.checked must be YYYY-MM-DD`);
}

export interface ContentSet {
  services: Service[];
  guides: Guide[];
  locations: Location[];
  projects: CaseStudy[];
}

export function validateContent({ services, guides, locations, projects }: ContentSet): void {
  const p: Problems = [];
  const serviceSlugs = new Set(services.map((s) => s.slug));
  const guideSlugs = new Set(guides.map((g) => g.slug));
  const locationSlugs = new Set(locations.map((l) => l.slug));

  uniqueSlugs(p, "service", services);
  uniqueSlugs(p, "guide", guides);
  uniqueSlugs(p, "location", locations);
  uniqueSlugs(p, "project", projects);

  for (const s of services) {
    const w = `service "${s.slug}"`;
    for (const k of ["name", "navLabel", "summary", "directAnswer"] as const) text(p, `${w}.${k}`, s[k]);
    list(p, `${w}.overview`, s.overview);
    list(p, `${w}.whoItsFor`, s.whoItsFor);
    text(p, `${w}.typicalRequirements.qualifier`, s.typicalRequirements.qualifier);
    list(p, `${w}.typicalRequirements.items`, s.typicalRequirements.items);
    if (s.process.length < 3) p.push(`${w}.process needs at least 3 steps`);
    list(p, `${w}.costFactors`, s.costFactors);
    list(p, `${w}.timelineFactors`, s.timelineFactors);
    if (s.faqs.length < 1) p.push(`${w}.faqs needs at least 1 question`);
    refs(p, `${w}.relatedGuides`, s.relatedGuides, guideSlugs);
    refs(p, `${w}.relatedServices`, s.relatedServices, serviceSlugs);
    if (s.relatedServices.includes(s.slug)) p.push(`${w} lists itself as related`);
    text(p, `${w}.visual.alt`, s.visual.alt);
    seo(p, w, s.seo);
  }

  for (const g of guides) {
    const w = `guide "${g.slug}"`;
    text(p, `${w}.title`, g.title);
    text(p, `${w}.navLabel`, g.navLabel);
    if (!g.title.trim().endsWith("?")) p.push(`${w}.title should be phrased as a question`);
    text(p, `${w}.directAnswer`, g.directAnswer);
    if (g.sections.length < 1) p.push(`${w}.sections needs at least 1 section`);
    g.sections.forEach((sec, i) => {
      text(p, `${w}.sections[${i}].heading`, sec.heading);
      list(p, `${w}.sections[${i}].paragraphs`, sec.paragraphs);
    });
    if (g.sources.length < 1) p.push(`${w}.sources needs at least 1 source`);
    g.sources.forEach((s, i) => source(p, `${w}.sources[${i}]`, s));
    if (g.lastReviewed !== null && !ISO_DATE.test(g.lastReviewed)) p.push(`${w}.lastReviewed must be YYYY-MM-DD`);
    if (g.reviewer) {
      text(p, `${w}.reviewer.name`, g.reviewer.name);
      text(p, `${w}.reviewer.credentials`, g.reviewer.credentials);
      if (g.lastReviewed === null) p.push(`${w} has a reviewer but no lastReviewed date`);
    }
    refs(p, `${w}.relatedGuides`, g.relatedGuides, guideSlugs);
    refs(p, `${w}.relatedServices`, g.relatedServices, serviceSlugs);
    seo(p, w, g.seo);
  }

  for (const l of locations) {
    const w = `location "${l.slug}"`;
    text(p, `${w}.name`, l.name);
    text(p, `${w}.summary`, l.summary);
    if (l.coverage === "confirmed") {
      if (l.localPermitInfo.length < 1) p.push(`${w} is confirmed but has no local permit information`);
      if (l.officialLinks.length < 1) p.push(`${w} is confirmed but has no official municipal links`);
    }
    l.officialLinks.forEach((o, i) => url(p, `${w}.officialLinks[${i}]`, o.url));
    refs(p, `${w}.relatedServices`, l.relatedServices, serviceSlugs);
    refs(p, `${w}.relatedGuides`, l.relatedGuides, guideSlugs);
    seo(p, w, l.seo);
  }

  for (const c of projects) {
    const w = `project "${c.slug}"`;
    text(p, `${w}.title`, c.title);
    text(p, `${w}.summary`, c.summary);
    list(p, `${w}.brief`, c.brief);
    list(p, `${w}.scope`, c.scope);
    if (c.services.length < 1) p.push(`${w}.services needs at least 1 service`);
    refs(p, `${w}.services`, c.services, serviceSlugs);
    if (c.location !== null) {
      refs(p, `${w}.location`, [c.location], locationSlugs);
      const loc = locations.find((l) => l.slug === c.location);
      if (loc && loc.coverage !== "confirmed") p.push(`${w} links to unconfirmed location "${c.location}"`);
    }
    if (c.visual.photo) {
      text(p, `${w}.visual.photo.credit`, c.visual.photo.credit);
      text(p, `${w}.visual.photo.licence`, c.visual.photo.licence);
    }
    seo(p, w, c.seo);
  }

  if (p.length > 0) throw new ContentError(p);
}
