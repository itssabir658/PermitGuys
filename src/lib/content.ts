import { guides } from "@/content/guides";
import { locations } from "@/content/locations";
import { projects } from "@/content/projects";
import { services } from "@/content/services";
import type { Service, ServiceCategory } from "@/content/types";
import { validateContent } from "@/lib/validation/content";

/*
 * The single read path for content. Pages and components import from here,
 * never from src/content directly, so validation always runs first and
 * draft or unconfirmed entries are filtered out in one place.
 */
validateContent({ services, guides, locations, projects });

export const getServices = () => services;
export const getFeaturedServices = () => services.filter((s) => s.featured);
export const getServicesByCategory = (category: ServiceCategory) =>
  services.filter((s) => s.category === category);
export const getService = (slug: string) => services.find((s) => s.slug === slug);

export const getGuides = () => guides;
export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);

/** Only municipalities the business has confirmed it serves. */
export const getLocations = () => locations.filter((l) => l.coverage === "confirmed");
export const getLocation = (slug: string) => getLocations().find((l) => l.slug === slug);

/** Only case studies approved for publication. */
export const getProjects = () => projects.filter((p) => p.approved);
export const getProject = (slug: string) => getProjects().find((p) => p.slug === slug);
export const getProjectsForService = (slug: string) =>
  getProjects().filter((p) => p.services.includes(slug));
export const getProjectsForLocation = (slug: string) =>
  getProjects().filter((p) => p.location === slug);

export function pickServices(slugs: string[]): Service[] {
  return slugs.map(getService).filter((s): s is Service => Boolean(s));
}

export function pickGuides(slugs: string[]) {
  return slugs.map(getGuide).filter((g): g is NonNullable<typeof g> => Boolean(g));
}
