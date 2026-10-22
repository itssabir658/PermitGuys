import type { Route } from "next";
import { guides } from "./guides";
import { services } from "./services";
import { paths } from "@/lib/routes";

export interface NavLink {
  label: string;
  href: Route;
  description?: string;
}

/** Inline links in the header bar on large screens. */
export const primaryNav: NavLink[] = [
  { label: "Services", href: paths.services },
  { label: "Process", href: paths.howItWorks },
  { label: "Guides", href: paths.guides },
  { label: "About", href: paths.about },
];

/** The full-screen menu, in reading order. */
export const menuLinks: NavLink[] = [
  { label: "Home", href: paths.home },
  { label: "Services", href: paths.services },
  { label: "How it works", href: paths.howItWorks },
  { label: "Permit guides", href: paths.guides },
  { label: "Service areas", href: paths.serviceAreas },
  { label: "About", href: paths.about },
  { label: "Contact", href: paths.contact },
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
