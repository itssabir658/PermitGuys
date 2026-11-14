import type { Route } from "next";
import { guides } from "./guides";
import { paths } from "@/lib/routes";

export interface NavLink {
  label: string;
  href: Route;
  description?: string;
  /** Opens the list of service pages: a dropdown in the header bar, a fold-out in the phone menu. */
  services?: boolean;
}

/*
 * What goes where. The header holds what a visitor comes for: the services,
 * the projects, the process, the firm and Contact. The homepage covers the
 * same ground and carries the phone, email, address and hours. The footer
 * keeps only what neither of them reaches (the permit guides, the service
 * areas and the privacy policy), so nothing is listed twice.
 */

/** Inline links in the header bar from 768px. */
export const primaryNav: NavLink[] = [
  { label: "Services", href: paths.services, services: true },
  { label: "Projects", href: paths.projects },
  { label: "Process", href: paths.howItWorks },
  { label: "About", href: paths.about },
];

/** The full-screen menu, in reading order. */
export const menuLinks: NavLink[] = [
  { label: "Home", href: paths.home },
  { label: "Services", href: paths.services, services: true },
  { label: "Projects", href: paths.projects },
  { label: "How it works", href: paths.howItWorks },
  { label: "About", href: paths.about },
  { label: "Contact", href: paths.contact },
];

/** The footer's one list: the guides and the service areas. The privacy policy sits in its last line. */
export const footerNav: NavLink[] = [
  { label: "Permit guides", href: paths.guides },
  ...guides.map((g) => ({ label: g.navLabel, href: paths.guide(g.slug) })),
  { label: "Service areas", href: paths.serviceAreas },
];
