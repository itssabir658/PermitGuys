import { APICallError, wrapLanguageModel, type LanguageModel } from "ai";
import type { LanguageModelV4, LanguageModelV4CallOptions } from "@ai-sdk/provider";
import { strategistModelOptions } from "./model-options";

/*
 * A safety net around the strategist's model: if Anthropic refuses the first
 * request of a step (an unknown or retired model, a rejected parameter, an
 * overloaded or failing model), the same step is sent once more to the
 * fallback model, with that model's own options and without any
 * cache_control, so a visitor still gets a reply. Every refusal is logged
 * with Anthropic's status code and error body for the Vercel function logs.
 *
 * Not retried: 401 and 403 (the API key), which no other model can fix.
 */

type Log = Pick<Console, "error" | "warn">;

/** Anthropic's status code and error body, in one line for the server logs. */
export function describeApiError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    const body = (error.responseBody ?? "").replace(/\s+/g, " ").slice(0, 1000);
    return `status ${error.statusCode ?? "none"}: ${error.message}${body ? ` | body: ${body}` : ""}`;
  }
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export function shouldFallBack(error: unknown): boolean {
  if (!APICallError.isInstance(error)) return false;
  const status = error.statusCode;
  return status !== undefined && status !== 401 && status !== 403;
}

const dropCacheControl = <T extends { providerOptions?: Record<string, Record<string, unknown>> }>(item: T): T => {
  if (!item.providerOptions?.anthropic) return item;
  const anthropic = { ...item.providerOptions.anthropic };
  delete anthropic.cacheControl;
  delete anthropic.cache_control;
  return { ...item, providerOptions: { ...item.providerOptions, anthropic } };
};

/** The same call without any cache breakpoint (system, messages, parts and tools). */
export function withoutCacheControl(params: LanguageModelV4CallOptions): LanguageModelV4CallOptions {
  return {
    ...params,
    prompt: params.prompt.map((m) => {
      const msg = dropCacheControl(m);
      return Array.isArray(msg.content) ? ({ ...msg, content: msg.content.map((p) => dropCacheControl(p)) } as typeof msg) : msg;
    }),
    tools: params.tools?.map((t) => (t.type === "function" ? dropCacheControl(t) : t)),
  };
}

export function withModelFallback({
  primary,
  fallback,
  log = console,
}: {
  primary: LanguageModelV4;
  fallback: LanguageModelV4;
  log?: Log;
}): LanguageModel {
  return wrapLanguageModel({
    model: primary,
    middleware: {
      wrapStream: async ({ doStream, params }) => {
        try {
          return await doStream();
        } catch (error) {
          log.error(`[advisor] Anthropic refused ${primary.modelId}: ${describeApiError(error)}`);
          if (!shouldFallBack(error)) throw error;
          log.warn(`[advisor] retrying this reply on ${fallback.modelId} without cache_control`);
          const retry = withoutCacheControl(params);
          try {
            return await fallback.doStream({
              ...retry,
              providerOptions: { ...retry.providerOptions, anthropic: strategistModelOptions(fallback.modelId) },
            });
          } catch (second) {
            log.error(`[advisor] fallback ${fallback.modelId} also failed: ${describeApiError(second)}`);
            throw second;
          }
        }
      },
    },
  });
}
