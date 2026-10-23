import type { Guide, Service } from "@/content/types";
import { site } from "@/content/site";
import { getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

/*
 * Schema.org builders. Every value comes from content that is visible on the
 * page or from verified business facts in content/site.ts. Nothing is added
 * for rich-result eligibility alone: no ratings, reviews, opening hours,
 * address or phone until the business supplies them, and no FAQPage markup
 * (Google limits FAQ rich results to government and health sites, and the
 * questions are already plain HTML on the page).
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
    areaServed: { "@type": "AdministrativeArea", name: site.region },
    knowsAbout: getServices().map((s) => s.name),
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
    areaServed: { "@type": "AdministrativeArea", name: site.region },
    mainEntityOfPage: { "@id": ids.page(path) },
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
