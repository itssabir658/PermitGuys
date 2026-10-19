import type { SourceRef } from "./types";

/**
 * Authoritative references used across guides and FAQs.
 *
 * `checked` stays null until a person has opened the page and confirmed it
 * still says what our copy relies on. Pages show "not yet verified" for null.
 */
export const sources = {
  ontarioBuildingPermits: {
    title: "Citizen's guide to land use planning: Building permits",
    publisher: "Government of Ontario",
    url: "https://www.ontario.ca/document/citizens-guide-land-use-planning/building-permits",
    checked: null,
  },
  ontarioSecondUnit: {
    title: "Add a second unit to your house",
    publisher: "Government of Ontario",
    url: "https://www.ontario.ca/page/add-second-unit-your-house",
    checked: null,
  },
  buildingCodeAct: {
    title: "Building Code Act, 1992, S.O. 1992, c. 23",
    publisher: "Government of Ontario (e-Laws)",
    url: "https://www.ontario.ca/laws/statute/92b23",
    checked: null,
  },
  torontoReviewStreams: {
    title: "Building permit review streams",
    publisher: "City of Toronto",
    url: "https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/building-permit-review-streams/",
    checked: null,
  },
  mississaugaBeforeYouApply: {
    title: "Building permits: before you apply",
    publisher: "City of Mississauga",
    url: "https://web.mississauga.ca/services-and-programs/planning-and-building/building-permits/before-you-apply/",
    checked: null,
  },
  esa: {
    title: "Electrical Safety Authority",
    publisher: "Electrical Safety Authority (Ontario)",
    url: "https://esasafe.com/",
    checked: null,
  },
} satisfies Record<string, SourceRef>;
