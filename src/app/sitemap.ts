import type { MetadataRoute } from "next";
import { clientProjects } from "@/content/imagery";
import { site } from "@/content/site";
import { getGuides, getLocations, getProjects, getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

type Entry = { path: string; priority: number; lastModified?: string };

/**
 * Only canonical, indexable URLs: static pages plus generated pages for
 * services, guides, confirmed service areas and approved projects.
 * Last-modified dates are given only where a real date exists (a guide's
 * review date, the date a service area's official pages were read), never
 * the build time. Priorities rank the money pages (services and service
 * areas) just under the homepage.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const all: Entry[] = [
    { path: paths.home, priority: 1 },
    { path: paths.services, priority: 0.9 },
    ...getServices().map((s) => ({ path: paths.service(s.slug), priority: 0.9 })),
    { path: paths.serviceAreas, priority: 0.8 },
    ...getLocations().map((l) => ({ path: paths.serviceArea(l.slug), priority: 0.8, lastModified: l.checkedOn })),
    { path: paths.guides, priority: 0.7 },
    ...getGuides().map((g) => ({ path: paths.guide(g.slug), priority: 0.7, lastModified: g.lastReviewed ?? undefined })),
    // The projects index is listed only once it shows client renderings or approved case studies.
    ...(getProjects().length || clientProjects.length ? [{ path: paths.projects, priority: 0.6 }] : []),
    ...getProjects().map((p) => ({ path: paths.project(p.slug), priority: 0.6 })),
    { path: paths.about, priority: 0.6 },
    { path: paths.howItWorks, priority: 0.6 },
    { path: paths.contact, priority: 0.7 },
    { path: paths.privacy, priority: 0.2 },
  ];
  return all.map(({ path, priority, lastModified }) => ({
    url: absoluteUrl(path, site.url),
    changeFrequency: "monthly",
    priority,
    ...(lastModified ? { lastModified } : {}),
  }));
}
