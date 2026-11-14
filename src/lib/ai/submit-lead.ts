import { z } from "zod";
import { sanitizeAttribution } from "@/lib/inquiry/attribution";
import { protectionSettings } from "@/lib/inquiry/handle";
import { isValidSubmissionId, submittedTooFast, type RateLimiter } from "@/lib/inquiry/protection";
import { projectStages, validateInquiry, type InquiryErrors } from "@/lib/validation/inquiry";
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from "./knowledge-base";
import { RECOMMENDED_ACTIONS, STAGES, buildProjectScope } from "./tools";
import { isSessionId, sharedLeadLedger, type LeadLedger } from "./lead-sessions";
import { closedLeadNotice, notifyOwners, ownerNotifyConfig } from "./notify-owners";
import { sanitizeSnapshot } from "./visitor-snapshot";

/*
 * submitClosedLead: the closing card's "lock it in". The visitor's contact
 * details go from the card straight to this handler (POST /api/lead/), never
 * through the model. It checks everything again, rebuilds the scope from its
 * inputs (a scope posted from the browser is never trusted), and sends a
 * CLOSED LEAD to the team (src/lib/ai/notify-owners.ts: Resend email plus the
 * lead webhook with leadStatus "closed_handoff") and a confirmation email to
 * the visitor. If a possible-lead summary was sent for the same chat session,
 * the closed lead says it was upgraded. The reference it returns is the one
 * the team sees.
 */

export const LEAD_TRANSCRIPT_MAX = 6000;

const text = (max: number) => z.string().max(max * 4).transform((s) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max));

const scopeInputSchema = z.object({
  projectType: z.enum(PROJECT_TYPE_KEYS),
  municipality: text(80),
  estimatedSqFt: z.number().int().min(0).max(200000).nullable(),
  structuralChanges: z.boolean(),
  stage: z.enum([...STAGES, ""]),
  summary: text(400),
});

export const leadRequestSchema = z.object({
  submissionId: z.string().max(80).optional(),
  /** The chat session (src/components/ai/session-summary.ts), to link a possible lead to this request. */
  sessionId: z.string().max(80).optional(),
  startedAt: z.string().max(20).optional(),
  /** Honeypot: people never see it. */
  website: z.string().max(200).optional(),
  contact: z.object({
    name: text(120),
    email: text(254),
    phone: text(30),
    propertyAddress: text(200).optional().default(""),
    bestTimeToCall: text(60).optional().default(""),
  }),
  consent: z.boolean(),
  project: z.object({
    projectType: z.enum(PROJECT_TYPE_KEYS),
    municipality: text(120),
    stage: z.enum([...STAGES, ""]),
    scopeSummary: text(700),
    recommendedAction: z.enum(RECOMMENDED_ACTIONS),
  }),
  scopeInput: scopeInputSchema.nullable().optional(),
  transcript: z
    .array(z.object({ role: z.enum(["visitor", "assistant"]), text: z.string().max(4000) }))
    .max(60)
    .optional()
    .default([]),
  snapshot: z.unknown().optional(),
  attribution: z.unknown().optional(),
});

export type LeadRequest = z.input<typeof leadRequestSchema>;

export type LeadResult =
  | { status: "sent"; reference: string }
  | { status: "invalid"; errors: InquiryErrors }
  | { status: "not_configured" | "failed" | "rate_limited" | "blocked" };

export interface LeadDeps {
  env: Record<string, string | undefined>;
  ip: string;
  rateLimiter: RateLimiter;
  duplicates: { has(id: string): boolean; add(id: string): void };
  ledger?: LeadLedger;
  /** Injected in tests; the global fetch otherwise. */
  fetch?: typeof fetch;
  now?: () => number;
  log?: Pick<Console, "info" | "warn" | "error">;
}

/** Keeps the latest turns within the cap, so the team sees how the conversation ended. */
function capTranscript(list: { role: "visitor" | "assistant"; text: string }[]) {
  const out: typeof list = [];
  let total = 0;
  for (const t of [...list].reverse()) {
    const clean = t.text.replace(/\s+/g, " ").trim().slice(0, 1200);
    if (!clean) continue;
    if (total + clean.length > LEAD_TRANSCRIPT_MAX) break;
    total += clean.length;
    out.unshift({ role: t.role, text: clean });
  }
  return out;
}

export async function submitClosedLead(raw: unknown, deps: LeadDeps): Promise<LeadResult> {
  const log = deps.log ?? console;
  const now = deps.now ?? Date.now;
  const parsed = leadRequestSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", errors: {} };
  const req = parsed.data;

  if (req.website) {
    log.warn("[lead] rejected: honeypot");
    return { status: "blocked" };
  }
  if (submittedTooFast(req.startedAt, protectionSettings(deps.env).minFillMs, now())) {
    log.warn("[lead] rejected: submitted too fast");
    return { status: "blocked" };
  }

  const stage = (projectStages as readonly string[]).includes(req.project.stage) ? req.project.stage : "";
  const details = [
    req.project.scopeSummary,
    req.project.stage && !stage ? `Stage: ${req.project.stage}.` : "",
    req.contact.propertyAddress ? `Property: ${req.contact.propertyAddress}.` : "",
    `Asked for: ${req.project.recommendedAction}${req.contact.bestTimeToCall ? `, best time to call: ${req.contact.bestTimeToCall}` : ""}.`,
    `Project type in the assistant: ${PROJECT_TYPES[req.project.projectType].label}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const validated = validateInquiry({
    name: req.contact.name,
    email: req.contact.email,
    phone: req.contact.phone,
    preferredContact: req.contact.phone ? "phone" : "email",
    projectType: PROJECT_TYPES[req.project.projectType].formType,
    municipality: req.project.municipality,
    stage,
    details,
    consent: req.consent ? "on" : undefined,
  });
  if (!validated.ok) return { status: "invalid", errors: validated.errors };

  const id = isValidSubmissionId(req.submissionId) ? req.submissionId : crypto.randomUUID();
  const reference = id.slice(0, 8).toUpperCase();
  if (deps.duplicates.has(id)) return { status: "sent", reference };
  if (!deps.rateLimiter.hit(deps.ip)) {
    log.warn("[lead] rejected: rate limited");
    return { status: "rate_limited" };
  }

  const config = ownerNotifyConfig(deps.env);
  for (const p of config.problems) log.error(`[lead] configuration: ${p}`);

  const lead = {
    id,
    submittedAt: new Date(now()).toISOString(),
    inquiry: validated.value,
    attribution: sanitizeAttribution(req.attribution),
    assistant: {
      propertyAddress: req.contact.propertyAddress,
      bestTimeToCall: req.contact.bestTimeToCall,
      recommendedAction: req.project.recommendedAction,
      scope: req.scopeInput ? buildProjectScope(req.scopeInput) : null,
      transcript: capTranscript(req.transcript),
      visit: sanitizeSnapshot(req.snapshot),
    },
  };
  const ledger = deps.ledger ?? sharedLeadLedger();
  const sessionId = isSessionId(req.sessionId) ? req.sessionId : null;
  // Closed before sending, so a page-exit summary racing this request is not sent as a possible lead;
  // reopened below if the request could not be delivered.
  const { upgradedFromPossibleLead, alreadyClosed } = sessionId ? ledger.markClosed(sessionId, reference) : { upgradedFromPossibleLead: false, alreadyClosed: true };
  const notice = closedLeadNotice(lead, { reference, projectLabel: PROJECT_TYPES[req.project.projectType].label, sessionId, upgradedFromPossibleLead });
  const outcome = await notifyOwners(notice, { env: deps.env, fetch: deps.fetch }, config);

  // Outcome metadata only, never the visitor's details.
  const summary = outcome.results.map((r) => (r.ok ? `${r.destination}: ok` : `${r.destination}: ${r.reason}`));
  if (outcome.status === "delivered") {
    deps.duplicates.add(id);
    log.info("[lead] delivered", { id, results: summary });
    return { status: "sent", reference };
  }
  if (outcome.status === "not_configured") {
    if (sessionId && !alreadyClosed) ledger.reopen(sessionId);
    log.error("[lead] no lead destination is configured; request not sent", { id });
    return { status: "not_configured" };
  }
  if (sessionId && !alreadyClosed) ledger.reopen(sessionId);
  log.error("[lead] delivery failed", { id, results: summary });
  return { status: "failed" };
}
