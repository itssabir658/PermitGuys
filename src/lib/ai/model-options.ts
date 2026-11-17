import type { AnthropicLanguageModelOptions } from "@ai-sdk/anthropic";

/*
 * Anthropic request options for the strategist, by model. The default model
 * (Claude Sonnet 4.5) takes neither `effort` nor server-side `fallbacks`, so
 * they are sent only to models that accept them; otherwise an override of
 * ANTHROPIC_MODEL would fail every turn, or Sonnet 4.5 would.
 */

/** Effort (output_config.effort): Opus 4.5 and later, Sonnet 4.6 and later, and every Claude 5 model. */
export const supportsEffort = (model: string) => /claude-(?:opus-4-[5-9]|sonnet-4-[6-9]|(?:opus|sonnet|haiku|fable|mythos)-5)/.test(model);

/** Server-side refusal fallbacks ("default" routing): the Claude 5 Opus, Sonnet, Fable and Mythos models. */
export const supportsServerFallbacks = (model: string) => /claude-(?:opus|sonnet|fable|mythos)-5/.test(model);

/** Models whose thinking cannot be switched off (they think adaptively; low effort keeps it short). */
export const thinkingAlwaysOn = (model: string) => /claude-(?:opus-5-5|sonnet-5-5|fable|mythos)/.test(model);

export function strategistModelOptions(model: string) {
  return {
    // No extended thinking on routine chat turns: text starts streaming at once and no hidden
    // thinking tokens are billed. On the few models that cannot turn it off, low effort keeps it short.
    ...(!thinkingAlwaysOn(model) && { thinking: { type: "disabled" as const } }),
    // A front-desk conversation: quick answers matter more than long reasoning.
    ...(supportsEffort(model) && { effort: "low" as const }),
    // If the model declines for policy reasons, the API retries on its default fallback model.
    ...(supportsServerFallbacks(model) && { fallbacks: "default" as const }),
  } satisfies AnthropicLanguageModelOptions;
}
