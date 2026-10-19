/*
 * Abuse protection for the inquiry form.
 *
 * - Honeypot: a hidden field people never fill in.
 * - Time trap: forms completed faster than a person could are rejected.
 * - Rate limit: a few submissions per visitor IP per window.
 * - Duplicate guard: a resubmitted form id is answered without re-sending.
 * - Optional Cloudflare Turnstile check when its keys are configured.
 *
 * The rate limit and duplicate guard keep their state in memory, which is
 * per server instance. That stops casual abuse and double clicks; for
 * stronger guarantees across instances, back `RateLimiter` with a shared
 * store such as Redis (see docs/INQUIRY.md).
 */

export const HONEYPOT_FIELD = "pg_website";

export interface RateLimiter {
  /** Records one attempt and returns false when the key is over its limit. */
  hit(key: string): boolean;
}

export function memoryRateLimiter({ max, windowMs, now = Date.now }: { max: number; windowMs: number; now?: () => number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      // Keep memory bounded: drop the oldest keys once the map grows large.
      if (hits.size > 5000) for (const k of [...hits.keys()].slice(0, 1000)) hits.delete(k);
      return true;
    },
  };
}

/** Remembers recently delivered submission ids so a resubmission is not sent twice. */
export function memoryDuplicateGuard({ ttlMs, now = Date.now }: { ttlMs: number; now?: () => number }) {
  const seen = new Map<string, number>();
  const prune = (t: number) => {
    for (const [id, at] of seen) if (t - at > ttlMs) seen.delete(id);
  };
  return {
    has(id: string) {
      prune(now());
      return seen.has(id);
    },
    add(id: string) {
      seen.set(id, now());
    },
  };
}

/** True when the form was submitted implausibly fast after it was opened. */
export function submittedTooFast(startedAt: string | undefined, minMs: number, now = Date.now()): boolean {
  if (!startedAt || minMs <= 0) return false; // No timestamp without JavaScript: other checks still apply.
  const started = Number(startedAt);
  if (!Number.isFinite(started)) return true;
  const elapsed = now - started;
  return elapsed < minMs || elapsed < 0;
}

const SUBMISSION_ID = /^[a-zA-Z0-9-]{8,64}$/;
export const isValidSubmissionId = (id: string | undefined): id is string => Boolean(id && SUBMISSION_ID.test(id));

/** Best-effort client IP from proxy headers (Vercel and most hosts set these). */
export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Verifies a Cloudflare Turnstile token. Only called when
 * TURNSTILE_SECRET_KEY is set; returns false on any error.
 */
export async function verifyTurnstile(token: string | undefined, secret: string, ip: string, fetchImpl: typeof fetch = fetch) {
  if (!token) return false;
  try {
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
