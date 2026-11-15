import { z } from "zod";
import { chatConfigured } from "@/lib/chat/config";
import { memoryRateLimiter, type RateLimiter } from "@/lib/inquiry/protection";
import { buildDossier, type ScopeInputLike } from "./chat-dossier";
import { PROJECT_TYPE_KEYS } from "./knowledge-base";
import { isSessionId, sharedLeadLedger, type LeadLedger } from "./lead-sessions";
import { notifyOwners, ownerNotifyConfig, possibleLeadNotice } from "./notify-owners";
import { STAGES } from "./tools";

/*
 * POST /api/chat/session-summary: a visitor chatted with the assistant and
 * left (went idle for two minutes, left or hid the page, or closed the chat)
 * without sending the closing card. The browser sends the conversation's
 * text, the visit snapshot and the latest scope (src/components/ai/session-summary.ts),
 * and the team gets a POSSIBLE LEAD summary (src/lib/ai/notify-owners.ts).
 *
 * Sent once per session and message count; never for a session that is
 * already a closed lead.
 */

export const SUMMARY_BODY_MAX = 64_000;

const scopeSchema = z.object({
  projectType: z.enum(PROJECT_TYPE_KEYS),
  municipality: z.string().max(80),
  estimatedSqFt: z.number().int().min(0).max(200000).nullable(),
  structuralChanges: z.boolean(),
  stage: z.enum([...STAGES, ""]),
  summary: z.string().max(400),
});

export const summaryRequestSchema = z.object({
  sessionId: z.string().max(80),
  /** Messages in the conversation (visitor and assistant), the dedupe key with the session. */
  messageCount: z.number().int().min(0).max(1000).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "visitor", "assistant"]), text: z.string().max(4000) }))
    .min(1)
    .max(80),
  visitorSnapshot: z.unknown().optional(),
  extractedScope: z.unknown().optional(),
  reason: z.enum(["idle", "page_exit", "chat_closed"]),
});

export type SummaryRequest = z.input<typeof summaryRequestSchema>;

export type SummaryResult = { status: "sent" | "duplicate" | "closed" | "too_short" | "invalid" | "not_configured" | "failed" | "rate_limited" };

export interface SummaryDeps {
  env: Record<string, string | undefined>;
  ip: string;
  rateLimiter: RateLimiter;
  ledger?: LeadLedger;
  fetch?: typeof fetch;
  now?: () => number;
  log?: Pick<Console, "info" | "warn" | "error">;
}

let limiter: RateLimiter | null = null;
/** At most 20 summaries per visitor IP per 10 minutes (one conversation sends a handful at most). */
export const sharedSummaryLimiter = () => (limiter ??= memoryRateLimiter({ max: 20, windowMs: 10 * 60_000 }));

export async function summarizeSession(raw: unknown, deps: SummaryDeps): Promise<SummaryResult> {
  const log = deps.log ?? console;
  if (!chatConfigured(deps.env)) return { status: "not_configured" };
  const parsed = summaryRequestSchema.safeParse(raw);
  if (!parsed.success || !isSessionId(parsed.data.sessionId)) return { status: "invalid" };
  const req = parsed.data;

  const transcript = req.messages
    .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("visitor" as const), text: m.text.trim() }))
    .filter((m) => m.text);
  const messageCount = req.messageCount ?? req.messages.length;
  // A conversation, not a stray click: at least one exchange with something the visitor wrote.
  if (messageCount < 2 || !transcript.some((t) => t.role === "visitor")) return { status: "too_short" };

  const ledger = deps.ledger ?? sharedLeadLedger();
  const claim = ledger.claimSummary(req.sessionId, messageCount);
  if (claim !== "ok") return { status: claim };
  if (!deps.rateLimiter.hit(deps.ip)) {
    ledger.releaseSummary(req.sessionId, messageCount);
    log.warn("[chat-summary] rejected: rate limited");
    return { status: "rate_limited" };
  }

  const scope = scopeSchema.safeParse(req.extractedScope);
  const dossier = buildDossier({
    sessionId: req.sessionId,
    messageCount,
    transcript,
    snapshot: req.visitorSnapshot,
    scopeInput: scope.success ? (scope.data as ScopeInputLike) : null,
    now: deps.now?.(),
  });

  const config = ownerNotifyConfig(deps.env);
  for (const p of config.problems) log.error(`[chat-summary] configuration: ${p}`);
  const outcome = await notifyOwners(possibleLeadNotice(dossier, req.reason), { env: deps.env, fetch: deps.fetch }, config);
  const results = outcome.results.map((r) => (r.ok ? `${r.destination}: ok` : `${r.destination}: ${r.reason}`));
  if (outcome.status === "delivered") {
    log.info("[chat-summary] delivered", { session: req.sessionId.slice(0, 8), messages: messageCount, reason: req.reason, results });
    return { status: "sent" };
  }
  ledger.releaseSummary(req.sessionId, messageCount);
  if (outcome.status === "not_configured") {
    log.error("[chat-summary] no lead destination is configured; summary not sent");
    return { status: "not_configured" };
  }
  log.error("[chat-summary] delivery failed", { results });
  return { status: "failed" };
}
