import { municipalities } from "./recognition";
import { sources } from "./sources";
import type { QuickFact, Service } from "./types";

/*
 * The answer-first "Quick permit overview" on service pages: short, factual
 * rows that search and answer engines can quote. Each row is either the
 * service's own content, a confirmed business fact, or an official source
 * linked beside it. No fees, timelines or approval promises are added.
 */

const clean = (item: string) => item.replace(/\.$/, "");

export const designersFact: QuickFact = {
  term: "Who can design the drawings",
  detail:
    "A designer registered with a BCIN (Building Code Identification Number), an architect or a professional engineer. Larger buildings, over three storeys or over 600 m² in gross area, generally need an architect.",
  source: { label: "Ontario: become a registered building practitioner (BCIN, QuARTS)", url: "https://www.ontario.ca/page/become-registered-building-practitioner" },
};

export const reviewTimeFact: QuickFact = {
  term: "Municipal review time",
  detail:
    "Ontario's Building Code sets time frames for a decision on a complete application. The City of Toronto, for example, lists 10 business days for houses, 15 for small buildings, 20 for large buildings and 30 for complex buildings. Incomplete applications or revisions can extend this.",
  source: { label: `${sources.torontoReviewStreams.publisher}: ${sources.torontoReviewStreams.title}`, url: sources.torontoReviewStreams.url },
};

export const permitGuysFact: QuickFact = {
  term: "What PermitGuys does",
  detail:
    "Designs the project and prepares the architectural and engineering drawings (Small Buildings BCIN, licensed P.Eng. engineers, architectural stamps in house), then submits the permit application as the owner's agent. The municipality decides whether a permit is issued.",
};

export function serviceQuickFacts(service: Service): QuickFact[] {
  return [
    { term: "Usually in the application", detail: `${service.typicalRequirements.items.map(clean).join("; ")}.` },
    {
      term: "Permits issued by",
      detail: "The municipality where the property is. Its building department reviews the application, decides whether a permit is issued and inspects the work.",
      source: { label: "Ontario: regulatory roles for construction and renovations", url: "https://www.ontario.ca/page/regulatory-roles-construction-and-renovations" },
    },
    designersFact,
    reviewTimeFact,
    permitGuysFact,
    { term: "Where we work", detail: `${municipalities.map((m) => m.place).join(", ")}.` },
  ];
}
