import type { Faq, Guide, Service } from "@/content/types";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/routes";

/*
 * Schema.org builders. Only supplied facts are included: no address, phone,
 * ratings or reviews until the business provides them.
 */

const url = (path: string) => absoluteUrl(path, site.url);
const orgId = () => `${url("/")}#organization`;

export function organizationSchema() {
  const contact = site.contact;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": orgId(),
    name: site.name,
    url: url("/"),
    description: site.description,
    areaServed: { "@type": "Place", name: site.region },
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.address ? { address: contact.address } : {}),
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: url("/"),
    publisher: { "@id": orgId() },
    inLanguage: "en-CA",
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  };
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer.join(" ") },
    })),
  };
}

export function serviceSchema(service: Service, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.directAnswer,
    url: url(path),
    serviceType: service.name,
    provider: { "@id": orgId() },
    areaServed: { "@type": "Place", name: site.region },
  };
}

export function guideSchema(guide: Guide, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.directAnswer,
    url: url(path),
    inLanguage: "en-CA",
    publisher: { "@id": orgId() },
    ...(guide.lastReviewed ? { dateModified: guide.lastReviewed } : {}),
    ...(guide.reviewer ? { reviewedBy: { "@type": "Person", name: guide.reviewer.name } } : {}),
    citation: guide.sources.map((s) => s.url),
  };
}
