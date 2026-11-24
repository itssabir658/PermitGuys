/*
 * Settings for the website assistant. Kept apart from the API client so the
 * layout can check whether the assistant is on without loading the SDK.
 */

type Env = Record<string, string | undefined>;

/**
 * Claude Opus 5.5 unless ANTHROPIC_MODEL (or the older name CHAT_MODEL)
 * names another model. Claude Sonnet 4.5 (PR #46) answered 404 on this
 * account (it is deprecated and retires 2026-11-30), so the default is back
 * to the model that ran in production before it.
 */
export const DEFAULT_CHAT_MODEL = "claude-opus-5-5";

/** Used once for a reply when Anthropic refuses the main model (src/lib/ai/model-fallback.ts). */
export const DEFAULT_FALLBACK_MODEL = "claude-opus-5-5";
/** The fallback when the main model already is DEFAULT_FALLBACK_MODEL. */
const SECOND_FALLBACK_MODEL = "claude-sonnet-5-5";

/**
 * The backup route when Anthropic cannot answer (a rejected key, an outage):
 * Vercel AI Gateway, which signs in with the deployment's own OIDC token on
 * Vercel, or AI_GATEWAY_API_KEY elsewhere. CHAT_GATEWAY_BACKUP=off turns it off.
 */
export const DEFAULT_BACKUP_MODEL = "anthropic/claude-sonnet-5.5";
/** The Anthropic model whose request options the backup takes. */
const BACKUP_OPTIONS_FOR = "claude-sonnet-5-5";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n > 0 ? n : fallback;
};

/** The assistant is on only when an Anthropic API key is set. */
export const chatConfigured = (env: Env) => Boolean(env.ANTHROPIC_API_KEY);

export function chatSettings(env: Env) {
  const model = env.ANTHROPIC_MODEL || env.CHAT_MODEL || DEFAULT_CHAT_MODEL;
  const fallback = env.ANTHROPIC_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  return {
    model,
    fallbackModel: fallback === model && !env.ANTHROPIC_FALLBACK_MODEL ? SECOND_FALLBACK_MODEL : fallback,
    backup:
      env.CHAT_GATEWAY_BACKUP !== "off" && (env.AI_GATEWAY_API_KEY || env.VERCEL)
        ? { model: env.CHAT_BACKUP_MODEL || DEFAULT_BACKUP_MODEL, optionsFor: env.CHAT_BACKUP_MODEL ? (env.CHAT_BACKUP_MODEL.split("/").pop() ?? "").replace(/\./g, "-") : BACKUP_OPTIONS_FOR }
        : null,
    /** Seconds one model may stay silent before the next is tried. */
    firstResponseMs: num(env.CHAT_FIRST_RESPONSE_SECONDS, 20) * 1000,
    rateLimitMax: num(env.CHAT_RATE_LIMIT_MAX, 30),
    rateLimitWindowMs: num(env.CHAT_RATE_LIMIT_WINDOW_MINUTES, 10) * 60_000,
  };
}
