import type { Route } from "next";
import { paths } from "@/lib/routes";

/**
 * Other work listed on the existing permitguys.ca site. Items link to the
 * closest service page; the rest go to the inquiry form. They are not given
 * pages of their own until there is enough to say to make one useful.
 */
export const otherWork: { label: string; href: Route }[] = [
  { label: "Second-storey additions", href: paths.service("residential-additions") },
  { label: "Below-grade entrances", href: paths.service("legal-basement-permits") },
  { label: "Load-bearing wall removal", href: paths.service("interior-renovation-permits") },
  { label: "New door and window openings", href: paths.service("interior-renovation-permits") },
  { label: "Laneway and garden suites", href: paths.contact },
  { label: "Multi-unit residential", href: paths.contact },
  { label: "Committee of Adjustment and minor variance applications", href: paths.contact },
];
