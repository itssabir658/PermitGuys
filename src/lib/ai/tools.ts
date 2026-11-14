import { tool, type InferUITools } from "ai";
import { z } from "zod";
import { projectStages } from "@/lib/validation/inquiry";
import {
  OFFICIAL_SOURCE_HOSTS,
  PERMIT_GUYS_KNOWLEDGE as K,
  PROJECT_TYPES,
  PROJECT_TYPE_KEYS,
  SCENARIOS,
  SCENARIO_KEYS,
  TO_BE_CONFIRMED,
  isConfirmedServiceArea,
  municipalFactsAbout,
  municipalityFor,
  serviceFor,
  type ProjectTypeKey,
  type ScenarioKey,
} from "./knowledge-base";

/*
 * The permit strategist's tools. Every result is assembled from the
 * knowledge base (the site's own content), never written by the model, so a
 * card can show only what PermitGuys publishes. Where the business has not
 * supplied a fact (turnaround, packages, prices) the card says it is
 * confirmed in the quote.
 *
 * Contact details never pass through the model: the closing card collects
 * them in the browser and posts them straight to /api/lead/
 * (src/lib/ai/submit-lead.ts, `submitClosedLead`).
 */

/** Where the visitor is. The first four are the inquiry form's own stages. */
export const STAGES = [
  ...projectStages,
  "Contractor already hired",
  "Work started without a permit, or a stop-work order",
] as const;
export type Stage = (typeof STAGES)[number];

const LARGE_PROJECT_SQFT = 6458; // 600 m², the Architects Act threshold the knowledge base cites.

export type Discipline = "Site" | "Architectural" | "Structural" | "Mechanical and plumbing" | "Code and life safety" | "Approvals and zoning";

/** Sorts a drawing-set line into the discipline it belongs to, for the card's badges. */
export function disciplineOf(item: string): Discipline {
  const s = item.toLowerCase();
  if (/zoning|registration|licensing|approvals|electrical inspection|occupancy|change of use/.test(s)) return "Approvals and zoning";
  if (/site plan|survey|grading/.test(s)) return "Site";
  if (/structural|beam|post|framing|footing|foundation|load|temporary support|joist|retaining/.test(s)) return "Structural";
  if (/heating|ventilation|plumbing|mechanical|drainage|fixtures/.test(s)) return "Mechanical and plumbing";
  if (/energy|fire|smoke|exit|egress|accessib|guard|handrail|insulation|moisture|alarm|code/.test(s)) return "Code and life safety";
  return "Architectural";
}

const DISCIPLINE_ORDER: Discipline[] = ["Site", "Architectural", "Structural", "Mechanical and plumbing", "Code and life safety", "Approvals and zoning"];

const line = (max: number) => z.string().max(max).transform((s) => s.replace(/\s+/g, " ").trim());

function municipalityBlock(name: string, keywords: readonly string[]) {
  const m = municipalityFor(name);
  if (!m) return null;
  return {
    name: m.name,
    facts: municipalFactsAbout(m, keywords),
    sources: m.sources.slice(0, 2),
    checkedOn: K.municipalities.checkedOn,
  };
}

function cityReview(type: ProjectTypeKey, municipality: string) {
  const building = PROJECT_TYPES[type].building;
  const t = K.reviewTimeframes;
  const isToronto = municipalityFor(municipality)?.name === "Toronto";
  const row = isToronto && t.toronto && building ? t.toronto.rows.find((r) => r.building.toLowerCase() === building) : undefined;
  return {
    window: row ? `${row.days} for a complete application (City of Toronto, ${building === "house" ? "houses" : "small buildings"})` : null,
    note: row
      ? "The clock starts once the application is complete and can restart if revisions are needed."
      : "Ontario's Building Code sets time frames for a municipality to decide on a complete application; each municipality publishes its own. We confirm yours.",
    source: t.toronto?.source ?? "",
    page: t.page,
  };
}

/** Words that pick the relevant lines of a municipality's reference for a project type. */
function keywordsFor(type: ProjectTypeKey): string[] {
  const words = Object.values(SCENARIOS)
    .filter((s) => s.projectType === type)
    .flatMap((s) => [...s.keywords]);
  return words.length ? [...new Set(words)] : [PROJECT_TYPES[type].label.toLowerCase()];
}

export function buildProjectScope(input: {
  projectType: ProjectTypeKey;
  municipality: string;
  estimatedSqFt: number | null;
  structuralChanges: boolean;
  stage: Stage | "";
  summary: string;
}) {
  const type = PROJECT_TYPES[input.projectType];
  const service = serviceFor(input.projectType);
  const items = service?.drawingSet.items ?? [];
  const drawings = DISCIPLINE_ORDER.map((d) => ({ discipline: d, items: items.filter((i) => disciplineOf(i) === d) })).filter((g) => g.items.length);
  if (input.structuralChanges && !drawings.some((g) => g.discipline === "Structural")) {
    drawings.push({ discipline: "Structural", items: ["Structural information for the beams, posts or walls that change."] });
  }

  const considerations: string[] = [];
  if (input.structuralChanges) considerations.push("Structural changes need structural design: we work out the engineering the project needs as part of the drawings.");
  if (input.estimatedSqFt && input.estimatedSqFt > LARGE_PROJECT_SQFT)
    considerations.push("Above about 600 m² (6,450 sq ft) of gross area, Ontario's Architects Act generally requires an architect. PermitGuys has architects in house.");
  if (input.stage === "Already applied and have review comments") considerations.push("You already have review comments: we can review them and respond on revised drawings.");
  if (input.stage === "Work started without a permit, or a stop-work order")
    considerations.push("Work already started: the usual way forward is drawings of what exists and what is proposed. What the municipality requires next is its decision.");
  if (input.stage === "Contractor already hired") considerations.push("Your contractor builds from the permit set, so drawings early keep the schedule clear.");
  if (!service) considerations.push("This kind of project has no fixed drawing list on our site: we confirm the set after a first review.");

  return {
    projectType: input.projectType,
    projectLabel: type.label,
    municipality: input.municipality,
    summary: input.summary,
    stage: input.stage,
    estimatedSqFt: input.estimatedSqFt,
    structuralChanges: input.structuralChanges,
    servicePage: service?.page ?? K.firm.pages.contact,
    drawingIntro: service?.drawingSet.intro ?? "Drawings and documents are confirmed after a first review of the project.",
    drawings,
    qualifier: service?.drawingSet.qualifier ?? "Requirements depend on your municipality, your property and the scope. Your building department makes the final determination.",
    draftingTurnaround: K.pending.draftingTurnaround ?? TO_BE_CONFIRMED,
    cityReview: cityReview(input.projectType, input.municipality),
    recommendedPackage: K.pending.packages?.[0]?.name ?? "Scope review and custom quote",
    timelineFactors: service?.timelineFactors ?? [],
    considerations,
    serviceArea: isConfirmedServiceArea(input.municipality) ? ("confirmed" as const) : ("to-confirm" as const),
    municipalityReference: municipalityBlock(input.municipality, keywordsFor(input.projectType)),
  };
}

/** Zoning and other approvals worth checking, by scenario. Written from the Ontario facts in the knowledge base. */
const zoningNotes: Record<ScenarioKey, string[]> = {
  "remove-load-bearing-wall": ["Interior structural work is reviewed mainly against the Building Code; zoning rarely comes into it unless the use changes."],
  "new-door-or-window-opening": ["A new or wider opening usually needs a new beam or lintel over it; the drawings show its size and how the load is carried. Exterior openings are also reviewed against the Building Code."],
  "basement-entrance": ["Zoning rules can control where a below-grade entrance may go and how close it can be to the property line; the site plan shows the setbacks."],
  "basement-apartment": [
    "Ontario generally allows up to three units on a residential lot without a rezoning, but setbacks, height, parking and registration rules are set locally, and a minor variance may still be needed.",
  ],
  "finish-basement": ["Finishing alone rarely raises zoning questions; adding a separate unit does."],
  "garden-or-laneway-suite": [
    "Ontario allows up to two units in the house plus one in an ancillary building as of right, but each municipality sets its own rules on setbacks, height, size, fire access and servicing.",
    "If the design does not meet a zoning requirement, a minor variance from the Committee of Adjustment may be needed before the permit.",
  ],
  "rear-or-side-addition": ["The zoning by-law controls setbacks, lot coverage and height. A design that does not meet them needs a minor variance from the Committee of Adjustment first."],
  "second-storey-addition": ["Height, storeys and floor area limits in the zoning by-law apply. A design that does not meet them needs a minor variance from the Committee of Adjustment first."],
  deck: ["Decks are subject to the zoning by-law's setbacks and coverage even when no building permit is needed."],
  "detached-garage": ["Accessory buildings have their own zoning limits for size, height and distance to property lines."],
  "multi-unit-conversion": ["The zoning by-law sets how many units a lot may have and rules such as parking; anything beyond what it allows needs a minor variance or a rezoning."],
  "commercial-interior-or-change-of-use": ["A change of use must be permitted by the zoning by-law, and needs a building permit even with no construction in some municipalities, such as Toronto."],
  "new-custom-home": ["The whole house is reviewed against the zoning by-law: setbacks, height, coverage and floor area. Variances, if any, come before the permit."],
  other: ["Whether zoning applies depends on what changes outside and how the building is used; we check it in the first review."],
};

const otherApprovals: Partial<Record<ScenarioKey, string[]>> = {
  "basement-apartment": ["Electrical work is inspected by the Electrical Safety Authority, separately from the building permit.", "Some municipalities require the second unit to be registered."],
  "basement-entrance": ["Before digging, call Ontario One Call for utility locates."],
  "garden-or-laneway-suite": ["Before digging, call Ontario One Call for utility locates.", "Properties near valleys, streams or shorelines may need a conservation authority permit first."],
  "rear-or-side-addition": ["Properties near valleys, streams or shorelines may need a conservation authority permit first."],
  "detached-garage": ["Before digging, call Ontario One Call for utility locates."],
  "new-custom-home": ["Properties near valleys, streams or shorelines may need a conservation authority permit first.", "Before digging, call Ontario One Call for utility locates."],
};

export function buildComplianceCheck(input: { scenario: ScenarioKey; municipality: string; details: string }) {
  const scenario = SCENARIOS[input.scenario];
  const service = serviceFor(scenario.projectType);
  const items = service?.drawingSet.items ?? [];
  return {
    scenario: input.scenario,
    scenarioLabel: scenario.label,
    municipality: input.municipality,
    details: input.details,
    whatTheSiteSays: service?.directAnswer ?? "Whether this work needs a permit depends on the scope and the municipality; we confirm it in the first review.",
    codeTriggers: items.filter((i) => ["Structural", "Code and life safety", "Mechanical and plumbing"].includes(disciplineOf(i))),
    zoning: zoningNotes[input.scenario],
    otherApprovals: otherApprovals[input.scenario] ?? [],
    municipalityReference: municipalityBlock(input.municipality, scenario.keywords),
    howPermitGuysHelps: [
      "We review the scope against the zoning and Building Code considerations we can identify, and flag anything that needs another consultant or approval early.",
      "We design the work, do the engineering it needs and prepare the permit drawings.",
      "We help you through the application and respond to review comments on our drawings.",
    ],
    servicePage: service?.page ?? K.firm.pages.contact,
    note: "General considerations from our guides and what the municipality publishes, not a ruling on your property. Your building department decides.",
  };
}

export const RECOMMENDED_ACTIONS = ["Scope review and quote", "Priority call back"] as const;

export function buildDealCloser(input: {
  projectType: ProjectTypeKey;
  municipality: string;
  stage: Stage | "";
  scopeSummary: string;
  recommendedAction: (typeof RECOMMENDED_ACTIONS)[number];
}) {
  return {
    ...input,
    projectLabel: PROJECT_TYPES[input.projectType].label,
    responseTime: K.pending.responseTime,
    hours: K.firm.hours,
    phone: K.firm.phone,
  };
}

export const advisorTools = {
  generateProjectScope: tool({
    description:
      "Build the visitor's project scope card: the drawing set the site lists for this kind of project, sorted by discipline, the city review window where the site publishes one, turnaround and package (confirmed in the quote until PermitGuys publishes them), and points to watch. Call it once you know the project type and the municipality (or the visitor wants a scope anyway). The card shows the details, so afterwards write one or two sentences, not a repeat of the card.",
    inputSchema: z.object({
      projectType: z.enum(PROJECT_TYPE_KEYS).describe("The closest project type."),
      municipality: line(80).describe('Town or city of the property, such as "Oakville". Empty string if unknown. Never a street address.'),
      estimatedSqFt: z.number().int().min(0).max(200000).nullable().describe("Approximate floor area of the new or changed space in square feet, or null if unknown. Never guess."),
      structuralChanges: z.boolean().describe("True if the work moves, removes or adds structure (walls, beams, foundations, a new storey)."),
      stage: z.enum([...STAGES, ""]).describe("Where the visitor is, or empty string if unknown."),
      summary: line(400).describe("One or two sentences describing the project in the visitor's terms. No names, phone numbers, emails or street addresses."),
    }),
    execute: async (input) => buildProjectScope(input),
  }),

  checkPermitComplianceRisk: tool({
    description:
      "Check a renovation scenario: the Building Code points the drawings must address, zoning and Committee of Adjustment considerations, other approvals, what the visitor's municipality publishes about it, and how PermitGuys handles it. Use it when a visitor asks whether something is allowed, risky or needs a permit. The card shows the details, so afterwards write one or two sentences.",
    inputSchema: z.object({
      scenario: z.enum(SCENARIO_KEYS).describe("The closest scenario."),
      municipality: line(80).describe("Town or city, or empty string if unknown. Never a street address."),
      details: line(300).describe("The visitor's scenario in one sentence. No personal details."),
    }),
    execute: async (input) => buildComplianceCheck(input),
  }),

  presentDealCloserCard: tool({
    description:
      "Show the closing card: the visitor's project already filled in, so they only add their name, phone and email to request a scope review and quote, or a priority call back. Call it when the visitor has seen their scope, asks about price, timing or next steps, or says they want to go ahead. Before calling it, write one short sentence inviting them to lock it in. Never ask for contact details in the chat: the card collects them.",
    inputSchema: z.object({
      projectType: z.enum(PROJECT_TYPE_KEYS),
      municipality: line(80).describe("Town or city, or empty string."),
      stage: z.enum([...STAGES, ""]),
      scopeSummary: line(700).describe(
        "Two to four first-person sentences for the team, in the visitor's terms: what they want to build, the property, what they have (survey, drawings, review comments) and what they asked. No names, phone numbers, emails or street addresses.",
      ),
      recommendedAction: z.enum(RECOMMENDED_ACTIONS).describe("Priority call back when the visitor is in a hurry, has review comments or a stop-work order; otherwise scope review and quote."),
    }),
    execute: async (input) => buildDealCloser(input),
  }),

  suggestReplies: tool({
    description:
      "Offer the visitor two or three one-tap replies that move the conversation forward (an answer to your question, the next step, or a closing action). Call it as the very last thing in every reply, after your text. Each reply is written as the visitor would say it, under 45 characters.",
    inputSchema: z.object({
      replies: z.array(line(60)).min(1).max(3),
    }),
    execute: async ({ replies }) => ({ replies: replies.filter(Boolean).slice(0, 3) }),
  }),
};

export type AdvisorTools = typeof advisorTools;
export type AdvisorUITools = InferUITools<AdvisorTools>;
export type ProjectScope = ReturnType<typeof buildProjectScope>;
export type ComplianceCheck = ReturnType<typeof buildComplianceCheck>;
export type DealCloser = ReturnType<typeof buildDealCloser>;

export { OFFICIAL_SOURCE_HOSTS };
