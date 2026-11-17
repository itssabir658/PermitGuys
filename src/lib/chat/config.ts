/*
 * Settings for the website assistant. Kept apart from the API client so the
 * layout can check whether the assistant is on without loading the SDK.
 */

type Env = Record<string, string | undefined>;

/**
 * Claude Sonnet 4.5 unless ANTHROPIC_MODEL (or the older name CHAT_MODEL)
 * names another model. The alias follows Anthropic's latest Sonnet 4.5
 * snapshot; set ANTHROPIC_MODEL=claude-sonnet-4-5-20250929 to pin it.
 */
export const DEFAULT_CHAT_MODEL = "claude-sonnet-4-5";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n > 0 ? n : fallback;
};

/** The assistant is on only when an Anthropic API key is set. */
export const chatConfigured = (env: Env) => Boolean(env.ANTHROPIC_API_KEY);

export function chatSettings(env: Env) {
  return {
    model: env.ANTHROPIC_MODEL || env.CHAT_MODEL || DEFAULT_CHAT_MODEL,
    rateLimitMax: num(env.CHAT_RATE_LIMIT_MAX, 30),
    rateLimitWindowMs: num(env.CHAT_RATE_LIMIT_WINDOW_MINUTES, 10) * 60_000,
  };
}
