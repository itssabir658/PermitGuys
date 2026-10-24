import { limits, projectStages, projectTypes, type ProjectType } from "@/lib/validation/inquiry";

/**
 * The hand-off from the chat assistant to the inquiry form. The assistant
 * never collects names, emails or phone numbers: when a visitor is ready, it
 * fills in the project half of the form (type, location, stage and a short
 * description) and the visitor finishes and sends the form themselves.
 *
 * Shared by the server (to check what the model produced) and the browser
 * (to read it back on the contact page), so it stays free of server-only and
 * browser-only APIs.
 */

export const HANDOFF_STORAGE_KEY = "pg_chat_handoff";
export const HANDOFF_TOOL = "prepare_inquiry";
/** Window event that tells an inquiry form already on the page to fill itself in. */
export const HANDOFF_EVENT = "pg:chat-handoff";

export interface Handoff {
  projectType: ProjectType;
  municipality: string;
  /** Empty string when the visitor did not say. */
  stage: (typeof projectStages)[number] | "";
  details: string;
}

const line = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

const text = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, "")
        .trim()
        .slice(0, max)
    : "";

/** The description the assistant writes is a draft for the visitor to edit, so it is kept well under the form's limit. */
export const HANDOFF_DETAILS_MAX = 1500;

/**
 * Checks a hand-off from the model or from browser storage. Anything not in
 * the form's own lists becomes "Something else" or empty, so the form only
 * ever receives values it accepts. Returns null when there is nothing useful.
 */
export function sanitizeHandoff(raw: unknown): Handoff | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    if (raw.length > 8000) return null;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const type = line(r.projectType, 60);
  const stage = line(r.stage, 80);
  const handoff: Handoff = {
    projectType: projectTypes.find((t) => t.label === type)?.label ?? "Something else",
    municipality: line(r.municipality, limits.municipality),
    stage: projectStages.find((s) => s === stage) ?? "",
    details: text(r.details, HANDOFF_DETAILS_MAX),
  };
  return handoff.details || handoff.municipality || type ? handoff : null;
}

/** The tool the model calls to hand a visitor over to the form. */
export const handoffTool = {
  name: HANDOFF_TOOL,
  description:
    "Fill in the project part of the PermitGuys inquiry form for the visitor, so they can review it, add their contact details and send it. Call it once the visitor wants to talk to the team, ask for a quote or start their project, and you know at least what they want to build. Never include names, emails, phone numbers or street addresses.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["projectType", "municipality", "stage", "details"],
    properties: {
      projectType: {
        type: "string",
        enum: projectTypes.map((t) => t.label),
        description: "The closest project type. Use \"Something else\" when none fits.",
      },
      municipality: {
        type: "string",
        description: "The town or city of the project, such as \"Oakville\". Empty string if unknown. Never a street address.",
      },
      stage: {
        type: "string",
        enum: [...projectStages, ""],
        description: "Where the visitor is in the project, or empty string if they did not say.",
      },
      details: {
        type: "string",
        description:
          "A short first-person draft of the project description for the form, in the visitor's own terms (two to five sentences): what they want to build, the property, and anything they already have such as a survey or drawings. No personal contact details.",
      },
    },
  },
};
