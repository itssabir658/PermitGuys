import Anthropic from "@anthropic-ai/sdk";
import { memoryRateLimiter, type RateLimiter } from "@/lib/inquiry/protection";
import { chatConfigured, chatSettings } from "./config";
import { parseConversation, type ChatEvent } from "./conversation";
import { HANDOFF_TOOL, handoffTool, sanitizeHandoff } from "./handoff";
import { systemPrompt } from "./knowledge";

type Env = Record<string, string | undefined>;

/** One limiter per server instance, as for the inquiry form (docs/CHAT.md). */
let limiter: RateLimiter | null = null;
export function sharedChatLimiter(env: Env): RateLimiter {
  const s = chatSettings(env);
  limiter ??= memoryRateLimiter({ max: s.rateLimitMax, windowMs: s.rateLimitWindowMs });
  return limiter;
}

export interface ChatDeps {
  env: Env;
  ip: string;
  rateLimiter: RateLimiter;
  /** Injected in tests; built from the API key otherwise. */
  client?: Pick<Anthropic, "beta">;
  signal?: AbortSignal;
  log?: Pick<Console, "warn" | "error">;
}

/**
 * Answers one visitor message. Yields the reply as it is written, then a
 * hand-off when the assistant fills in the inquiry form, then `done`. Every
 * failure ends in an `error` event the widget can explain; nothing throws.
 */
export async function* respond(body: unknown, deps: ChatDeps): AsyncGenerator<ChatEvent> {
  const log = deps.log ?? console;
  if (!chatConfigured(deps.env)) {
    yield { type: "error", reason: "not_configured" };
    return;
  }
  if (!deps.rateLimiter.hit(deps.ip)) {
    yield { type: "error", reason: "rate_limited" };
    return;
  }
  const conversation = parseConversation(body);
  if (!conversation.ok) {
    yield { type: "error", reason: conversation.reason };
    return;
  }

  const client = deps.client ?? new Anthropic({ apiKey: deps.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 });
  const { model } = chatSettings(deps.env);

  try {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 4096,
        // A front-desk conversation: short answers matter more than long reasoning.
        output_config: { effort: "low" },
        // If the model declines for policy reasons, the API retries on its default fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        cache_control: { type: "ephemeral" },
        system: systemPrompt(),
        tools: [{ ...handoffTool, eager_input_streaming: true }],
        tool_choice: { type: "auto" },
        // Only the visible text of earlier turns is sent back, never reasoning or tool calls.
        messages: conversation.turns,
      },
      { signal: deps.signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
        yield { type: "text", text: event.delta.text };
      }
    }
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      yield { type: "error", reason: "declined" };
      return;
    }
    if (message.stop_reason === "tool_use") {
      const call = message.content.find((b) => b.type === "tool_use" && b.name === HANDOFF_TOOL);
      const handoff = call && "input" in call ? sanitizeHandoff(call.input) : null;
      if (handoff) yield { type: "handoff", handoff };
    }
    yield { type: "done" };
  } catch (error) {
    if (deps.signal?.aborted) return;
    if (error instanceof Anthropic.RateLimitError) log.warn("[chat] Anthropic rate limit reached");
    else if (error instanceof Anthropic.AuthenticationError) log.error("[chat] ANTHROPIC_API_KEY was rejected");
    else if (error instanceof Anthropic.APIError) log.error(`[chat] Anthropic API error ${error.status}: ${error.message}`);
    else log.error("[chat] Could not reach the Anthropic API", error);
    yield { type: "error", reason: "unavailable" };
  }
}
