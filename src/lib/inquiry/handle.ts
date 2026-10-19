import { formToRecord, validateInquiry, type InquiryValues } from "@/lib/validation/inquiry";
import { sanitizeAttribution } from "./attribution";
import { configuredDestinations, deliverLead, type LeadDestination } from "./delivery";
import {
  HONEYPOT_FIELD,
  isValidSubmissionId,
  memoryDuplicateGuard,
  memoryRateLimiter,
  submittedTooFast,
  verifyTurnstile,
  type RateLimiter,
} from "./protection";
import type { InquiryState } from "./state";

type Env = Record<string, string | undefined>;

export interface InquiryDeps {
  env: Env;
  ip: string;
  rateLimiter: RateLimiter;
  duplicates: { has(id: string): boolean; add(id: string): void };
  destinations?: LeadDestination[];
  now?: () => number;
  fetchImpl?: typeof fetch;
  log?: Pick<Console, "info" | "warn" | "error">;
}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : fallback;
};

/** Settings with safe defaults; each can be tuned by an environment variable. */
export function protectionSettings(env: Env) {
  return {
    rateLimitMax: num(env.INQUIRY_RATE_LIMIT_MAX, 5),
    rateLimitWindowMs: num(env.INQUIRY_RATE_LIMIT_WINDOW_MINUTES, 10) * 60_000,
    minFillMs: num(env.INQUIRY_MIN_FILL_SECONDS, 3) * 1000,
  };
}

let shared: Pick<InquiryDeps, "rateLimiter" | "duplicates"> | undefined;

/** Process-wide limiter and duplicate guard used by the server action. */
export function sharedProtection(env: Env) {
  if (!shared) {
    const s = protectionSettings(env);
    shared = {
      rateLimiter: memoryRateLimiter({ max: s.rateLimitMax, windowMs: s.rateLimitWindowMs }),
      duplicates: memoryDuplicateGuard({ ttlMs: 24 * 60 * 60_000 }),
    };
  }
  return shared;
}

/**
 * Validates, screens and delivers one inquiry. Pure apart from its
 * dependencies, so every branch is unit-tested (tests/inquiry-handler.test.ts).
 */
export async function handleInquiry(form: FormData, deps: InquiryDeps): Promise<InquiryState> {
  const log = deps.log ?? console;
  const now = deps.now ?? Date.now;
  const text = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : undefined;
  };
  const rawValues: InquiryValues = formToRecord(form);
  const settings = protectionSettings(deps.env);

  // Spam screens. These never pretend the inquiry was sent.
  if (text(HONEYPOT_FIELD)) {
    log.warn("[inquiry] rejected: honeypot");
    return { status: "blocked", values: rawValues };
  }
  if (submittedTooFast(text("startedAt"), settings.minFillMs, now())) {
    log.warn("[inquiry] rejected: submitted too fast");
    return { status: "blocked", values: rawValues };
  }

  const result = validateInquiry(formToRecord(form));
  if (!result.ok) return { status: "invalid", errors: result.errors, values: result.values };

  // Normalized values to put back in the form if delivery does not succeed.
  const values: InquiryValues = { ...result.value, consent: "on" };

  const submissionId = text("submissionId");
  const id = isValidSubmissionId(submissionId) ? submissionId : crypto.randomUUID();
  if (isValidSubmissionId(submissionId) && deps.duplicates.has(submissionId)) {
    log.info("[inquiry] duplicate submission ignored", { id });
    return { status: "sent", reference: id.slice(0, 8).toUpperCase() };
  }

  if (!deps.rateLimiter.hit(deps.ip)) {
    log.warn("[inquiry] rejected: rate limited");
    return { status: "rate_limited", values };
  }

  const turnstileSecret = deps.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret && !(await verifyTurnstile(text("cf-turnstile-response"), turnstileSecret, deps.ip, deps.fetchImpl))) {
    log.warn("[inquiry] rejected: Turnstile verification failed");
    return { status: "blocked", values };
  }

  let destinations = deps.destinations;
  if (!destinations) {
    const configured = configuredDestinations(deps.env, deps.fetchImpl);
    for (const p of configured.problems) log.error(`[inquiry] configuration: ${p}`);
    destinations = configured.destinations;
  }

  const outcome = await deliverLead(
    { id, submittedAt: new Date(now()).toISOString(), inquiry: result.value, attribution: sanitizeAttribution(text("attribution")) },
    destinations,
  );

  // Log outcome metadata only, never the visitor's details.
  const summary = outcome.results.map((r) => (r.ok ? `${r.destination}: ok` : `${r.destination}: ${r.reason}`));
  if (outcome.status === "delivered") {
    deps.duplicates.add(id);
    log.info("[inquiry] delivered", { id, results: summary });
    return { status: "sent", reference: id.slice(0, 8).toUpperCase() };
  }
  if (outcome.status === "not_configured") {
    log.error("[inquiry] no lead destination is configured; inquiry not sent", { id });
    return { status: "not_configured", values };
  }
  log.error("[inquiry] delivery failed", { id, results: summary });
  return { status: "failed", values };
}
