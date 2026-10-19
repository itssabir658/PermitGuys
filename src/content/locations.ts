import type { Location } from "./types";

/*
 * Service-area pages.
 *
 * Add a municipality here only when PermitGuys has confirmed it serves that
 * municipality and there is enough verified local information to make the
 * page useful. Only entries with coverage "confirmed" get a page and a
 * sitemap entry. See docs/CONTENT.md for an example entry.
 */
export const locations: Location[] = [];

/**
 * GTA municipalities and their official websites, shown on the service-area
 * hub as references for homeowners. Listing a municipality here is not a
 * claim that PermitGuys serves it.
 */
export const gtaMunicipalities: { region: string; municipalities: { name: string; url: string }[] }[] = [
  {
    region: "City of Toronto",
    municipalities: [{ name: "Toronto", url: "https://www.toronto.ca/" }],
  },
  {
    region: "Peel Region",
    municipalities: [
      { name: "Mississauga", url: "https://www.mississauga.ca/" },
      { name: "Brampton", url: "https://www.brampton.ca/" },
      { name: "Caledon", url: "https://www.caledon.ca/" },
    ],
  },
  {
    region: "York Region",
    municipalities: [
      { name: "Vaughan", url: "https://www.vaughan.ca/" },
      { name: "Markham", url: "https://www.markham.ca/" },
      { name: "Richmond Hill", url: "https://www.richmondhill.ca/" },
    ],
  },
  {
    region: "Halton Region",
    municipalities: [
      { name: "Oakville", url: "https://www.oakville.ca/" },
      { name: "Burlington", url: "https://www.burlington.ca/" },
      { name: "Milton", url: "https://www.milton.ca/" },
    ],
  },
  {
    region: "Durham Region",
    municipalities: [
      { name: "Pickering", url: "https://www.pickering.ca/" },
      { name: "Ajax", url: "https://www.ajax.ca/" },
      { name: "Whitby", url: "https://www.whitby.ca/" },
      { name: "Oshawa", url: "https://www.oshawa.ca/" },
    ],
  },
];
