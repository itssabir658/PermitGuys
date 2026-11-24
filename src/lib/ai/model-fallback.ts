import { APICallError, wrapLanguageModel, type LanguageModel } from "ai";
import type { LanguageModelV4, LanguageModelV4CallOptions, LanguageModelV4StreamPart, LanguageModelV4StreamResult } from "@ai-sdk/provider";
import { strategistModelOptions } from "./model-options";

/*
 * A safety net around the strategist's model (see withModelFallback below):
 * the main model, a fallback model, a backup route and, last, an offline
 * reply, so a visitor always gets an answer. Every refusal is logged with
 * Anthropic's status code and error body for the Vercel function logs.
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

/** A rejected or missing API key: no other model on the same key can answer. */
export const isKeyError = (error: unknown) => APICallError.isInstance(error) && (error.statusCode === 401 || error.statusCode === 403);

export class FirstResponseTimeout extends Error {
  constructor(modelId: string, ms: number) {
    super(`${modelId} sent nothing for ${Math.round(ms / 1000)} s`);
    this.name = "FirstResponseTimeout";
  }
}

/** Stream parts that show the model has started answering (anything but set-up and keep-alive parts). */
const isContent = (p: LanguageModelV4StreamPart) => !["stream-start", "response-metadata", "ping", "raw"].includes(p.type);

/**
 * Opens a model's stream and waits for its first real part. A refusal, an
 * error part before any content, or silence past `timeoutMs` all throw, so
 * the caller can move on to the next model before the visitor sees anything.
 * Once content has started, the stream is handed back unchanged.
 */
export async function openStream(model: LanguageModelV4, params: LanguageModelV4CallOptions, timeoutMs: number): Promise<LanguageModelV4StreamResult> {
  const controller = new AbortController();
  const outer = params.abortSignal;
  const onAbort = () => controller.abort(outer?.reason);
  if (outer?.aborted) controller.abort(outer.reason);
  else outer?.addEventListener("abort", onAbort, { once: true });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new FirstResponseTimeout(model.modelId, timeoutMs);
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  let reader: ReadableStreamDefaultReader<LanguageModelV4StreamPart> | undefined;
  try {
    const result = await Promise.race([model.doStream({ ...params, abortSignal: controller.signal }), timedOut]);
    const r = result.stream.getReader();
    reader = r;
    const buffered: LanguageModelV4StreamPart[] = [];
    for (;;) {
      const { done, value } = await Promise.race([r.read(), timedOut]);
      if (done) throw new Error(`${model.modelId} ended its reply before sending anything`);
      if (value.type === "error") throw value.error;
      buffered.push(value);
      if (isContent(value)) break;
    }
    clearTimeout(timer);
    return {
      ...result,
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(c) {
          for (const p of buffered) c.enqueue(p);
        },
        async pull(c) {
          try {
            const { done, value } = await r.read();
            if (done) {
              outer?.removeEventListener("abort", onAbort);
              c.close();
            } else c.enqueue(value);
          } catch (error) {
            outer?.removeEventListener("abort", onAbort);
            c.error(error);
          }
        },
        cancel: (reason) => r.cancel(reason),
      }),
    };
  } catch (error) {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onAbort);
    if (!controller.signal.aborted) controller.abort(error);
    reader?.cancel(error).catch(() => {});
    throw error;
  }
}

export interface ModelTier {
  model: LanguageModelV4;
  /** The Anthropic model whose request options this tier takes (the gateway names models differently). */
  optionsFor: string;
  /** Whether it uses ANTHROPIC_API_KEY, so a rejected key skips it. */
  usesAnthropicKey: boolean;
}

/**
 * The strategist's model with a safety net. Each step is tried on the main
 * model, then the fallback model (with its own options and no cache_control),
 * then a backup route that does not use the Anthropic key (Vercel AI
 * Gateway), each with a time limit for the first response. A rejected key
 * skips straight to the backup. When nothing answers, the step is answered by
 * `offline` (src/lib/ai/offline-reply.ts) so the visitor never sees an error.
 * Every refusal is logged with Anthropic's status code and error body.
 */
export function withModelFallback({
  primary,
  fallback,
  backup,
  offline,
  log = console,
  firstResponseMs = 20_000,
  budgetMs = 40_000,
}: {
  primary: LanguageModelV4;
  fallback?: LanguageModelV4;
  backup?: ModelTier;
  offline?: (params: LanguageModelV4CallOptions) => LanguageModelV4StreamResult;
  log?: Log;
  /** How long one model may stay silent before the next one is tried. */
  firstResponseMs?: number;
  /** How long a step may spend on attempts before the offline reply answers it. */
  budgetMs?: number;
}): LanguageModel {
  const tiers: ModelTier[] = [
    ...(fallback && fallback.modelId !== primary.modelId ? [{ model: fallback, optionsFor: fallback.modelId, usesAnthropicKey: true }] : []),
    ...(backup ? [backup] : []),
  ];
  return wrapLanguageModel({
    model: primary,
    middleware: {
      wrapStream: async ({ params }) => {
        const deadline = Date.now() + budgetMs;
        const remaining = () => Math.min(firstResponseMs, deadline - Date.now());
        let lastError: unknown;
        let keyRejected = false;
        try {
          return await openStream(primary, params, remaining());
        } catch (error) {
          lastError = error;
          if (params.abortSignal?.aborted) throw error;
          log.error(`[advisor] Anthropic refused ${primary.modelId}: ${describeApiError(error)}`);
          if (isKeyError(error)) {
            keyRejected = true;
            log.error("[advisor] ACTION NEEDED: ANTHROPIC_API_KEY was rejected (401/403). Replace it in Vercel and redeploy.");
          }
        }
        const retry = withoutCacheControl(params);
        for (const tier of tiers) {
          if (keyRejected && tier.usesAnthropicKey) continue;
          if (deadline - Date.now() < 1_000) break;
          log.warn(`[advisor] retrying this reply on ${tier.model.modelId} without cache_control`);
          try {
            return await openStream(tier.model, { ...retry, providerOptions: { ...retry.providerOptions, anthropic: strategistModelOptions(tier.optionsFor) } }, remaining());
          } catch (error) {
            lastError = error;
            if (params.abortSignal?.aborted) throw error;
            log.error(`[advisor] fallback ${tier.model.modelId} also failed: ${describeApiError(error)}`);
            if (tier.usesAnthropicKey && isKeyError(error)) keyRejected = true;
          }
        }
        if (offline) {
          log.error("[advisor] no model answered; the visitor got the offline reply and the closing card");
          return offline(params);
        }
        throw lastError;
      },
    },
  });
}
