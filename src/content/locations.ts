import { GTA_PERMITS_CHECKED_ON, gtaPermits, ontarioPermitFacts, type MunicipalPermitInfo } from "./gta-permits";
import { designersFact, permitGuysFact } from "./quick-facts";
import { municipalities } from "./recognition";
import { sources } from "./sources";
import type { Faq, Location, QuickFact } from "./types";

/*
 * Service-area pages.
 *
 * A municipality gets a page only when both are true:
 *
 * - the business has confirmed it serves it: the cities on the projects map
 *   and in the municipalities list (recognition.ts `municipalities`,
 *   confirmed by Sebra on 19 November 2026); and
 * - the site has verified local information for it: the official pages
 *   summarised in gta-permits.ts, read on GTA_PERMITS_CHECKED_ON.
 *
 * Every local fact on these pages is the municipality's own published
 * wording from gta-permits.ts, with its source linked. Nothing about fees,
 * review times or approvals is added, except Toronto's published review
 * time frames (the City's own page, also cited in the costs guide).
 *
 * A served municipality without verified local information (Hamilton today)
 * is listed on the service-area hub without a page of its own, so no thin
 * near-duplicate pages are published.
 */

/** Municipalities the business has confirmed it serves, by place name. */
export const servedMunicipalities = municipalities.map((m) => ({ place: m.place, authority: m.name }));

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const provincial = (start: string) => {
  const fact = ontarioPermitFacts.facts.find((f) => f.startsWith(start));
  if (!fact) throw new Error(`gta-permits.ts: no provincial fact starting "${start}"`);
  return fact;
};
const bcinFact = provincial("Designers who are not architects or engineers");
const architectFact = provincial("Under the Architects Act");
const issuerFact = provincial("Municipalities issue building permits");

const authorityLabel = (place: string, authority: string) => (place === "Toronto" ? "City of Toronto (Toronto Building)" : authority);

function buildLocation(info: MunicipalPermitInfo, authorityName: string): Location {
  const { name } = info;
  const authority = authorityLabel(name, authorityName);
  const official = info.sources.map((s) => ({ label: s.label, url: s.url }));
  const quickFacts: QuickFact[] = [
    { term: "Permits issued by", detail: `The ${authority}. It reviews applications, decides whether a permit is issued and inspects the work.`, source: official[0] },
    ...(info.apply ? [{ term: "How to apply", detail: info.apply }] : []),
    ...(info.contact ? [{ term: "Building department contact", detail: info.contact }] : []),
    designersFact,
    ...(name === "Toronto"
      ? [
          {
            term: "Published review time",
            detail:
              "For a complete application, the City lists 10 business days for houses, 15 for small buildings, 20 for large buildings and 30 for complex buildings. Incomplete applications or revisions can extend this.",
            source: { label: `${sources.torontoReviewStreams.publisher}: ${sources.torontoReviewStreams.title}`, url: sources.torontoReviewStreams.url },
          },
        ]
      : []),
    permitGuysFact,
  ];

  const faqs: Faq[] = [
    {
      question: `Who issues building permits in ${name}?`,
      answer: [
        `The ${authority} issues building permits for properties in ${name}.`,
        `${issuerFact} The details of what needs a permit and what to submit can differ from one municipality to the next.`,
      ],
    },
    {
      question: `Can PermitGuys prepare permit drawings and apply for a permit in ${name}?`,
      answer: [
        `Yes. ${name} is one of the municipalities we work in. We design the project, prepare the architectural and engineering drawings and submit the building permit application as the owner's agent.`,
        `The ${authority} reviews the application and decides whether a permit is issued, so we never promise approvals or timelines.`,
      ],
    },
    ...(info.apply
      ? [{ question: `How do I apply for a building permit in ${name}?`, answer: [`${info.apply}`, ...(info.contact ? [`Building department contact: ${info.contact}.`] : [])] }]
      : []),
    {
      question: `Do I need a BCIN designer, an architect or an engineer for a permit in ${name}?`,
      answer: [bcinFact, architectFact],
    },
  ];

  return {
    slug: slugify(name),
    name,
    region: info.region,
    coverage: "confirmed",
    authority,
    summary: `The ${authority} issues building permits in ${name}. PermitGuys designs projects in ${name}, from additions, basement apartments and decks to custom homes and commercial interiors, prepares the architectural and engineering drawings, and submits the permit application as the owner's agent. The municipality decides whether a permit is issued.`,
    quickFacts,
    localPermitInfo: [{ heading: `What does ${name} say about when a permit is needed?`, paragraphs: info.facts }],
    officialLinks: official,
    faqs,
    checkedOn: GTA_PERMITS_CHECKED_ON,
    relatedServices: ["residential-additions", "legal-basement-permits", "deck-permits", "custom-home-permits", "commercial-permits"],
    relatedGuides: ["do-i-need-a-building-permit", "basement-apartment-permits", "permit-costs-and-timelines"],
    seo: {
      title: `Building Permits & Drawings in ${name}, ON`,
      description: `Building permits in ${name}, Ontario: what the ${authorityName} publishes, how to apply, and how PermitGuys prepares drawings and applies as your agent.`,
    },
  };
}

/** Served municipalities with verified local information, in the order of the municipalities list. */
export const locations: Location[] = servedMunicipalities.flatMap(({ place, authority }) => {
  const info = gtaPermits.find((m) => m.name === place);
  return info ? [buildLocation(info, authority)] : [];
});

/** Served municipalities without a page yet (no verified local information in gta-permits.ts). */
export const servedWithoutPage = servedMunicipalities.filter(({ place }) => !gtaPermits.some((m) => m.name === place)).map((m) => m.place);

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
