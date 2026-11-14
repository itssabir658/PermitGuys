/*
 * Project types and renovation scenarios the permit strategist's tools
 * understand. Kept apart from the knowledge base so the widget can use the
 * labels without loading the site's content into the page.
 */

export const TO_BE_CONFIRMED = "Custom fixed-fee quote & exact timeline prepared directly by PermitGuys upon handoff.";

/**
 * Project types the tools understand. Each maps to a service page where the
 * site has one; the rest are work the firm takes on without a page of its own
 * (src/content/other-work.ts), so the tools describe them only in general.
 */
export const PROJECT_TYPES = {
  "residential-addition": { label: "Residential addition", service: "residential-additions", formType: "Residential addition", building: "house" },
  "custom-home": { label: "Custom home", service: "custom-home-permits", formType: "Custom home", building: "house" },
  "legal-basement-apartment": { label: "Legal basement apartment", service: "legal-basement-permits", formType: "Legal basement apartment", building: "house" },
  "finished-basement": { label: "Finished basement", service: "finished-basement-permits", formType: "Interior renovation", building: "house" },
  "below-grade-entrance": { label: "Below-grade entrance", service: "below-grade-entrance-permits", formType: "Something else", building: "house" },
  "load-bearing-wall-removal": { label: "Load-bearing wall removal", service: "load-bearing-wall-removal", formType: "Interior renovation", building: "house" },
  "detached-garage": { label: "Detached garage", service: "detached-garage-permits", formType: "Something else", building: "house" },
  deck: { label: "Deck", service: "deck-permits", formType: "Deck", building: "house" },
  "interior-renovation": { label: "Interior renovation", service: "interior-renovation-permits", formType: "Interior renovation", building: "house" },
  commercial: { label: "Commercial project", service: "commercial-permits", formType: "Commercial permit", building: "small building" },
  "garden-or-laneway-suite": { label: "Garden or laneway suite", service: null, formType: "Something else", building: "house" },
  "multi-unit-residential": { label: "Multi-unit residential", service: null, formType: "Something else", building: "small building" },
  "committee-of-adjustment": { label: "Committee of Adjustment or minor variance", service: null, formType: "Something else", building: null },
  other: { label: "Something else", service: null, formType: "Something else", building: null },
} as const;

export type ProjectTypeKey = keyof typeof PROJECT_TYPES;
export const PROJECT_TYPE_KEYS = Object.keys(PROJECT_TYPES) as [ProjectTypeKey, ...ProjectTypeKey[]];

/** Renovation scenarios the compliance check knows. */
export const SCENARIOS = {
  "remove-load-bearing-wall": { label: "Removing a load-bearing wall", projectType: "load-bearing-wall-removal", keywords: ["wall"] },
  "new-door-or-window-opening": { label: "A new or wider door or window opening", projectType: "interior-renovation", keywords: ["window", "door"] },
  "basement-entrance": { label: "A new below-grade (basement) entrance", projectType: "below-grade-entrance", keywords: ["entrance", "basement", "excavation"] },
  "basement-apartment": { label: "A basement apartment or second unit", projectType: "legal-basement-apartment", keywords: ["unit", "suite", "basement", "second"] },
  "finish-basement": { label: "Finishing a basement", projectType: "finished-basement", keywords: ["basement", "finish"] },
  "garden-or-laneway-suite": { label: "A garden or laneway suite", projectType: "garden-or-laneway-suite", keywords: ["garden", "laneway", "ancillary", "accessory", "unit"] },
  "rear-or-side-addition": { label: "A rear or side addition", projectType: "residential-addition", keywords: ["addition"] },
  "second-storey-addition": { label: "A second-storey addition", projectType: "residential-addition", keywords: ["addition", "storey"] },
  deck: { label: "A deck", projectType: "deck", keywords: ["deck"] },
  "detached-garage": { label: "A detached garage", projectType: "detached-garage", keywords: ["garage", "accessory"] },
  "multi-unit-conversion": { label: "Converting a house to more units", projectType: "multi-unit-residential", keywords: ["unit", "multiplex", "suite"] },
  "commercial-interior-or-change-of-use": { label: "A commercial interior or change of use", projectType: "commercial", keywords: ["commercial", "change of use", "occupancy"] },
  "new-custom-home": { label: "A new custom home", projectType: "custom-home", keywords: ["new house", "new home", "demolition"] },
  other: { label: "Another renovation", projectType: "other", keywords: [] },
} as const satisfies Record<string, { label: string; projectType: ProjectTypeKey; keywords: string[] }>;

export type ScenarioKey = keyof typeof SCENARIOS;
export const SCENARIO_KEYS = Object.keys(SCENARIOS) as [ScenarioKey, ...ScenarioKey[]];

