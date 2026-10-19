import type { Route } from "next";
import { guides } from "./guides";
import { services } from "./services";
import { paths } from "@/lib/routes";

export interface NavLink {
  label: string;
  href: Route;
  description?: string;
}

export interface NavGroup {
  label: string;
  /** Overview page for the group, always the first link in its menu. */
  href: Route;
  links: NavLink[];
}

export const primaryNav: NavGroup[] = [
  {
    label: "Services",
    href: paths.services,
    links: services.map((s) => ({ label: s.navLabel, href: paths.service(s.slug), description: s.summary })),
  },
  {
    label: "Service Areas",
    href: paths.serviceAreas,
    links: [{ label: "GTA service areas", href: paths.serviceAreas, description: "Where we work across the Greater Toronto Area." }],
  },
  {
    label: "Resources",
    href: paths.guides,
    links: [
      { label: "All permit guides", href: paths.guides, description: "Plain-language answers to common permit questions." },
      ...guides.map((g) => ({ label: g.title, href: paths.guide(g.slug) })),
      { label: "Projects", href: paths.projects, description: "Case studies from completed work." },
    ],
  },
  {
    label: "About",
    href: paths.about,
    links: [
      { label: "About PermitGuys", href: paths.about },
      { label: "How it works", href: paths.howItWorks },
      { label: "Contact", href: paths.contact },
    ],
  },
];

export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Services",
    links: [
      { label: "All services", href: paths.services },
      ...services.map((s) => ({ label: s.navLabel, href: paths.service(s.slug) })),
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Permit guides", href: paths.guides },
      ...guides.map((g) => ({ label: g.navLabel, href: paths.guide(g.slug) })),
      { label: "Projects", href: paths.projects },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: paths.about },
      { label: "How it works", href: paths.howItWorks },
      { label: "Service areas", href: paths.serviceAreas },
      { label: "Contact", href: paths.contact },
      { label: "Privacy policy", href: paths.privacy },
    ],
  },
];
