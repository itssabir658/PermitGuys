import { servedMunicipalities } from "@/content/locations";
import type { Faq, Guide, Location, Service } from "@/content/types";
import { site } from "@/content/site";
import { getLocations, getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

/*
 * Schema.org builders. Every value comes from content that is visible on the
 * page or from verified business facts in content/site.ts. Nothing is added
 * for rich-result eligibility alone: never ratings or reviews (Google does
 * not allow self-serving review markup).
 *
 * FAQPage markup mirrors the questions shown on the page, word for word.
 * Google shows FAQ rich results only for government and health sites, but
 * the markup still gives search and answer engines (Bing, ChatGPT search,
 * Perplexity) the exact question-and-answer pairs to quote.
 *
 * Entities reference each other by @id so the organization, website and each
 * page form one connected graph.
 */

const url = (path: string) => absoluteUrl(path, site.url);
export const ids = {
  organization: () => `${url("/")}#organization`,
  website: () => `${url("/")}#website`,
  page: (path: string) => `${url(path)}#webpage`,
  breadcrumb: (path: string) => `${url(path)}#breadcrumb`,
};

/**
 * The business entity. It is a plain Organization until a business address
 * is confirmed; LocalBusiness types (ProfessionalService) are meant for
 * businesses with a physical location customers can visit or that is listed.
 */
export function organizationSchema() {
  const { contact } = site;
  const contactPoint =
    contact.phone || contact.email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(contact.phone ? { telephone: contact.phone } : {}),
            ...(contact.email ? { email: contact.email } : {}),
            areaServed: "CA-ON",
            availableLanguage: "en",
          },
        }
      : {};
  return {
    "@context": "https://schema.org",
    "@type": contact.address ? "ProfessionalService" : "Organization",
    "@id": ids.organization(),
    name: site.name,
    ...(site.legalName ? { legalName: site.legalName } : {}),
    url: url("/"),
    description: site.description,
    ...(site.logo ? { logo: absoluteUrl(site.logo, site.url) } : {}),
    areaServed: areaServed(),
    knowsAbout: getServices().map((s) => s.name),
    slogan: "Architects, Engineers, Designers & Project Managers",
    hasCredential: site.credentials.filter((c) => !/owner.s agent/i.test(c)).map((c) => ({ "@type": "EducationalOccupationalCredential", name: c })),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(site.postalAddress ? { address: { "@type": "PostalAddress", ...site.postalAddress } } : contact.address ? { address: contact.address } : {}),
    ...(contact.address && site.openingHours.length
      ? {
          openingHoursSpecification: site.openingHours.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...contactPoint,
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
  };
}

/** The municipalities the business has confirmed it serves, each linked to its page when it has one. */
export function areaServed() {
  const pages = new Map(getLocations().map((l) => [l.name, l]));
  return servedMunicipalities.map(({ place }) => {
    const page = pages.get(place);
    return {
      "@type": "City",
      name: place,
      containedInPlace: { "@type": "State", name: "Ontario" },
      ...(page ? { url: url(paths.serviceArea(page.slug)) } : {}),
    };
  });
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ids.website(),
    name: site.name,
    url: url("/"),
    description: site.description,
    publisher: { "@id": ids.organization() },
    inLanguage: "en-CA",
  };
}

export type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export function webPageSchema({
  path,
  name,
  type = "WebPage",
  breadcrumb = true,
  extra,
}: {
  path: string;
  name: string;
  type?: WebPageType;
  breadcrumb?: boolean;
  /** Additional verified page facts, e.g. `lastReviewed` and `reviewedBy`. */
  extra?: Record<string, unknown>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": ids.page(path),
    url: url(path),
    name,
    isPartOf: { "@id": ids.website() },
    ...(path === paths.home || type === "AboutPage" ? { about: { "@id": ids.organization() } } : {}),
    ...(breadcrumb ? { breadcrumb: { "@id": ids.breadcrumb(path) } } : {}),
    inLanguage: "en-CA",
    ...extra,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const current = items[items.length - 1]?.path ?? paths.home;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": ids.breadcrumb(current),
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  };
}

export function serviceSchema(service: Service, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url(path)}#service`,
    name: service.name,
    description: service.directAnswer,
    url: url(path),
    serviceType: service.name,
    category: service.category === "residential" ? "Residential building permits" : "Commercial building permits",
    provider: { "@id": ids.organization() },
    areaServed: areaServed(),
    mainEntityOfPage: { "@id": ids.page(path) },
  };
}

/** Permit drawings and applications in one municipality, for its service-area page. */
export function locationServiceSchema(location: Location, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url(path)}#service`,
    name: `Building permit drawings and applications in ${location.name}, Ontario`,
    description: location.summary,
    url: url(path),
    serviceType: "Building permit drawings and permit applications",
    provider: { "@id": ids.organization() },
    areaServed: {
      "@type": "City",
      name: location.name,
      containedInPlace: { "@type": "State", name: "Ontario" },
    },
    mainEntityOfPage: { "@id": ids.page(path) },
  };
}

/** FAQPage for the questions shown on a page, in the same words. */
export function faqPageSchema(faqs: Faq[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url(path)}#faq`,
    url: url(path),
    isPartOf: { "@id": ids.page(path) },
    inLanguage: "en-CA",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer.join("\n\n") },
    })),
  };
}

/**
 * Editorial guides. The author is the organization, which publishes them. A
 * Person appears only on the guide's WebPage as `reviewedBy` (see
 * guidePageFacts), and only once a real reviewer is recorded in the guide.
 */
export function guideSchema(guide: Guide, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url(path)}#article`,
    headline: guide.title,
    description: guide.directAnswer,
    url: url(path),
    mainEntityOfPage: { "@id": ids.page(path) },
    inLanguage: "en-CA",
    author: { "@id": ids.organization() },
    publisher: { "@id": ids.organization() },
    ...(guide.lastReviewed ? { dateModified: guide.lastReviewed } : {}),
    citation: guide.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url, publisher: s.publisher })),
  };
}

/** Review facts for a guide's WebPage entity, only when they are recorded. */
export function guidePageFacts(guide: Guide): Record<string, unknown> {
  return {
    ...(guide.lastReviewed ? { lastReviewed: guide.lastReviewed } : {}),
    ...(guide.reviewer ? { reviewedBy: { "@type": "Person", name: guide.reviewer.name, description: guide.reviewer.credentials } } : {}),
  };
}
