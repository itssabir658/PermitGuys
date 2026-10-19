import type { Route } from "next";

/**
 * Every internal URL in one place. Paths end in a slash to match
 * `trailingSlash: true`, so canonical URLs, links and the sitemap agree.
 */
const r = (path: string) => path as Route;

export const paths = {
  home: r("/"),
  about: r("/about/"),
  howItWorks: r("/how-it-works/"),
  services: r("/services/"),
  service: (slug: string) => r(`/services/${slug}/`),
  serviceAreas: r("/service-areas/"),
  serviceArea: (slug: string) => r(`/service-areas/${slug}/`),
  projects: r("/projects/"),
  project: (slug: string) => r(`/projects/${slug}/`),
  guides: r("/permit-guides/"),
  guide: (slug: string) => r(`/permit-guides/${slug}/`),
  contact: r("/contact/"),
  /** Contact page with the matching project type preselected. */
  contactFor: (serviceSlug: string) => r(`/contact/?service=${encodeURIComponent(serviceSlug)}`),
  privacy: r("/privacy-policy/"),
} as const;

export function absoluteUrl(path: string, origin: string): string {
  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}
