import { PERMIT_GUYS_KNOWLEDGE as K, PROJECT_TYPES, PROJECT_TYPE_KEYS, type ProjectTypeKey } from "./knowledge-base";
import { STAGES, buildProjectScope, type ProjectScope } from "./tools";
import { describeSnapshot, sanitizeSnapshot, type VisitorSnapshot } from "./visitor-snapshot";

/*
 * What the team needs to follow up on a conversation: the project, the
 * municipality, the visitor's questions, any contact details they typed, the
 * transcript and the visit. Built on the server from the chat's text with
 * plain pattern matching (no second model call), for two cases:
 *
 * - a visitor types a phone number or email in a message (a closed lead,
 *   src/lib/ai/chat-handler.ts), and
 * - a visitor chats and leaves without sending the closing card (a possible
 *   lead, src/lib/ai/session-summary.ts).
 */

export type TranscriptLine = { role: "visitor" | "assistant"; text: string };

export interface ScopeInputLike {
  projectType: ProjectTypeKey;
  municipality: string;
  estimatedSqFt: number | null;
  structuralChanges: boolean;
  stage: (typeof STAGES)[number] | "";
  summary: string;
}

export interface ChatContact {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ChatDossier {
  sessionId: string;
  /** Messages in the conversation when this was built (visitor and assistant). */
  messageCount: number;
  capturedAt: string;
  projectType: string;
  municipality: string;
  questions: string[];
  contact: ChatContact;
  transcript: TranscriptLine[];
  visit: VisitorSnapshot | null;
  scope: ProjectScope | null;
}

/** Transcript caps: enough for a long conversation, small enough for an email. */
export const DOSSIER_LIMITS = { lines: 80, lineChars: 1500, totalChars: 40_000, questions: 8 } as const;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const NAME = /(?:\b[Mm]y name is|\b[Mm]y name's|\b[Nn]ame:|\b[Tt]his is|\b[Ii] am|\b[Ii]'m|\b[Ii]’m)\s+([A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+)?)/;
const ADDRESS =
  /\b\d{1,6}\s+(?:[A-Z][\w'.-]*\s+){1,4}(?:St|Street|Rd|Road|Ave|Avenue|Dr|Drive|Cres|Crescent|Blvd|Boulevard|Ct|Court|Way|Lane|Ln|Pl|Place|Trail|Trl|Line|Sideroad|Circle|Cir|Terrace|Gate|Pkwy|Parkway|Heights|Hts|Square|Sq)\b\.?(?:\s+(?:East|West|North|South|E|W|N|S)\b)?/;

const municipalityNames = K.municipalities.list.map((m) => m.name);
const knownPlace = (s: string) => municipalityNames.some((m) => m.toLowerCase() === s.toLowerCase());

/** Words after "I'm" that are clearly not a name ("I'm Planning..." at the start of a sentence). */
const NOT_A_NAME = new Set(["Planning", "Looking", "Thinking", "Not", "Just", "Hoping", "Trying", "In", "From", "Interested", "Ready", "Wondering", "Building", "Renovating", "Adding"]);

/** Contact details a visitor typed in the chat. Only the visitor's own messages are read. */
export function extractContact(visitorTexts: readonly string[]): ChatContact {
  const all = visitorTexts.join("\n");
  const email = all.match(EMAIL)?.[0] ?? "";
  const phone = all.match(PHONE)?.[0]?.trim() ?? "";
  const address = all.match(ADDRESS)?.[0]?.trim() ?? "";
  let name = "";
  for (const t of visitorTexts) {
    const m = t.match(NAME);
    const candidate = m?.[1]?.trim() ?? "";
    if (candidate && !knownPlace(candidate) && !NOT_A_NAME.has(candidate.split(/\s+/)[0])) {
      name = candidate;
      break;
    }
  }
  return { name, email, phone, address };
}

export const hasReachableContact = (c: ChatContact) => Boolean(c.email || c.phone);

const TYPE_PATTERNS: [RegExp, ProjectTypeKey][] = [
  [/\b(basement (?:apartment|unit|suite)|second(?:ary)? (?:unit|suite)|in-?law suite|legal basement|additional (?:residential )?unit)\b/i, "legal-basement-apartment"],
  [/\b(side|separate|walk-?up|below[- ]grade|basement) (?:door|entrance|entry)\b/i, "below-grade-entrance"],
  [/\b(load[- ]bearing|bearing wall|remove (?:a |the )?wall|open(?:ing)? concept)\b/i, "load-bearing-wall-removal"],
  [/\b(garden suite|laneway (?:suite|house)|coach house)\b/i, "garden-or-laneway-suite"],
  [/\b(second[- ]storey|second[- ]story|addition|extension|add a (?:room|floor|storey))\b/i, "residential-addition"],
  [/\b(custom home|new (?:home|house)|build (?:a|my) (?:home|house)|rebuild|knock ?down)\b/i, "custom-home"],
  [/\b(finish(?:ed|ing)? (?:the |my )?basement|basement (?:finish|renovation|reno))\b/i, "finished-basement"],
  [/\b(detached garage|garage)\b/i, "detached-garage"],
  [/\b(deck|porch|pergola)\b/i, "deck"],
  [/\b(commercial|restaurant|office|retail|store|tenant|warehouse|clinic|change of use)\b/i, "commercial"],
  [/\b(duplex|triplex|fourplex|multiplex|multi-?unit|apartment building)\b/i, "multi-unit-residential"],
  [/\b(minor variance|committee of adjustment|severance|rezoning)\b/i, "committee-of-adjustment"],
  [/\b(renovat|remodel|kitchen|bathroom|interior)\w*/i, "interior-renovation"],
];

function projectTypeFrom(scope: ScopeInputLike | null, visitorTexts: readonly string[]): string {
  if (scope && PROJECT_TYPE_KEYS.includes(scope.projectType) && scope.projectType !== "other") return PROJECT_TYPES[scope.projectType].label;
  const all = visitorTexts.join("\n");
  for (const [re, key] of TYPE_PATTERNS) if (re.test(all)) return PROJECT_TYPES[key].label;
  return "";
}

function municipalityFrom(scope: ScopeInputLike | null, snapshot: VisitorSnapshot | null, visitorTexts: readonly string[]): string {
  if (scope?.municipality) return scope.municipality;
  const all = visitorTexts.join("\n");
  for (const name of municipalityNames) if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(all)) return name;
  return snapshot?.interactionState.municipality ?? "";
}

function questionsFrom(visitorTexts: readonly string[]): string[] {
  const out: string[] = [];
  for (const t of visitorTexts) {
    const clean = t.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    if (/\?|^(how|what|when|where|why|who|which|can|could|do|does|is|are|will|would|should|may)\b/i.test(clean)) out.push(clean.slice(0, 300));
    if (out.length >= DOSSIER_LIMITS.questions) break;
  }
  return out;
}

/** Keeps the latest lines within the caps, so the team sees how the conversation ended. */
export function capDossierTranscript(list: readonly TranscriptLine[]): TranscriptLine[] {
  const out: TranscriptLine[] = [];
  let total = 0;
  for (const t of [...list].reverse()) {
    const clean = t.text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, " ").trim().slice(0, DOSSIER_LIMITS.lineChars);
    if (!clean) continue;
    if (out.length >= DOSSIER_LIMITS.lines || total + clean.length > DOSSIER_LIMITS.totalChars) break;
    total += clean.length;
    out.unshift({ role: t.role, text: clean });
  }
  return out;
}

export function buildDossier(input: {
  sessionId: string;
  messageCount: number;
  transcript: readonly TranscriptLine[];
  snapshot: unknown;
  scopeInput: ScopeInputLike | null;
  now?: number;
}): ChatDossier {
  const transcript = capDossierTranscript(input.transcript);
  const visitorTexts = input.transcript.filter((t) => t.role === "visitor").map((t) => t.text);
  const visit = sanitizeSnapshot(input.snapshot);
  return {
    sessionId: input.sessionId,
    messageCount: input.messageCount,
    capturedAt: new Date(input.now ?? Date.now()).toISOString(),
    projectType: projectTypeFrom(input.scopeInput, visitorTexts),
    municipality: municipalityFrom(input.scopeInput, visit, visitorTexts),
    questions: questionsFrom(visitorTexts),
    contact: extractContact(visitorTexts),
    transcript,
    visit,
    scope: input.scopeInput ? buildProjectScope(input.scopeInput) : null,
  };
}

/** The visit, written out for an email. */
export function visitLines(visit: VisitorSnapshot | null): string[] {
  if (!visit) return ["No visit details were sent."];
  return describeSnapshot(visit).split("\n");
}
