import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getGuides, getLocations, getProjects, getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

/**
 * Only canonical, indexable URLs: static pages plus generated pages for
 * services, guides, confirmed locations and approved projects. Last-modified
 * dates are included only where a real review date exists.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    paths.home,
    paths.services,
    paths.serviceAreas,
    paths.guides,
    // The projects index is listed only once it has approved case studies.
    ...(getProjects().length ? [paths.projects] : []),
    paths.howItWorks,
    paths.about,
    paths.contact,
    paths.privacy,
  ];
  const all: { path: string; lastModified?: string }[] = [
    ...staticPaths.map((path) => ({ path })),
    ...getServices().map((s) => ({ path: paths.service(s.slug) })),
    ...getGuides().map((g) => ({ path: paths.guide(g.slug), lastModified: g.lastReviewed ?? undefined })),
    ...getLocations().map((l) => ({ path: paths.serviceArea(l.slug) })),
    ...getProjects().map((p) => ({ path: paths.project(p.slug) })),
  ];
  return all.map(({ path, lastModified }) => ({
    url: absoluteUrl(path, site.url),
    ...(lastModified ? { lastModified } : {}),
  }));
}
