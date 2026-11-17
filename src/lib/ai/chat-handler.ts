import { createAnthropic } from "@ai-sdk/anthropic";
import {
  APICallError,
  createUIMessageStreamResponse,
  hasToolCall,
  isStepCount,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { MESSAGE_MAX } from "@/lib/chat/ask";
import { chatConfigured, chatSettings } from "@/lib/chat/config";
import { memoryRateLimiter, type RateLimiter } from "@/lib/inquiry/protection";
import { buildDossier, hasReachableContact, extractContact, type ScopeInputLike } from "./chat-dossier";
import { parseConversation, toModelHistory } from "./history";
import { isSessionId, sharedLeadLedger, type LeadLedger } from "./lead-sessions";
import { chatContactNotice, notifyOwners } from "./notify-owners";
import { strategistModelOptions } from "./model-options";
import { STATIC_SYSTEM_PROMPT, buildDynamicVisitorContext } from "./system-prompt";
import { advisorTools } from "./tools";
import type { AdvisorFailure, AdvisorMessage } from "./types";
import { sanitizeSnapshot } from "./visitor-snapshot";

/*
 * One turn of the permit strategist: checks, then a streamed reply from
 * Claude through the Vercel AI SDK, with the four tools. Kept apart from the
 * route file so every branch can be tested with a stand-in model.
 */

type Env = Record<string, string | undefined>;


export const advisorLimits = {
  /** Characters in one visitor message (the input field enforces the same). */
  message: MESSAGE_MAX,
  /** Messages in one conversation (visitor and assistant together). */
  messages: 40,
  /** Characters in the whole request body. */
  body: 250_000,
} as const;


let limiter: RateLimiter | null = null;
export function sharedAdvisorLimiter(env: Env): RateLimiter {
  const s = chatSettings(env);
  limiter ??= memoryRateLimiter({ max: s.rateLimitMax, windowMs: s.rateLimitWindowMs });
  return limiter;
}

export interface ChatDeps {
  env: Env;
  ip: string;
  rateLimiter: RateLimiter;
  /** Injected in tests; built from the API key otherwise. */
  model?: LanguageModel;
  signal?: AbortSignal;
  log?: Pick<Console, "info" | "warn" | "error">;
  /** Runs work after the response (Next's `after`); awaited in tests. */
  background?: (task: () => Promise<unknown>) => void;
  ledger?: LeadLedger;
  fetch?: typeof fetch;
}

const fail = (status: number, reason: AdvisorFailure) =>
  new Response(reason, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

const textLength = (m: UIMessage) => m.parts.reduce((n, p) => n + (p.type === "text" ? p.text.length : 0), 0);

export async function handleChat(rawBody: string, deps: ChatDeps): Promise<Response> {
  const log = deps.log ?? console;
  if (!chatConfigured(deps.env) && !deps.model) return fail(503, "not_configured");
  if (rawBody.length > advisorLimits.body) return fail(413, "too_long");
  if (!deps.rateLimiter.hit(deps.ip)) return fail(429, "rate_limited");

  let body: { messages?: unknown; snapshot?: unknown; sessionId?: unknown };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return fail(400, "invalid");
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return fail(400, "invalid");
  if (body.messages.length > advisorLimits.messages) return fail(413, "too_long");

  // Earlier assistant turns are accepted in any shape (src/lib/ai/history.ts): only the visitor's text is checked.
  const messages = parseConversation(body.messages);
  if (!messages) {
    log.warn("[advisor] request rejected: messages are not a conversation");
    return fail(400, "invalid");
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user" || messages.some((m) => m.role === "system")) {
    log.warn(`[advisor] request rejected: last message is ${last.role}, or a system message was sent`);
    return fail(400, "invalid");
  }
  if (textLength(last) === 0) return fail(400, "invalid");
  if (messages.some((m) => m.role === "user" && textLength(m) > advisorLimits.message)) return fail(413, "too_long");
  const history = toModelHistory(messages);
  if (!history.length) return fail(400, "invalid");

  // A phone number or email typed in the chat goes to the team as a closed lead, in the background.
  if (isSessionId(body.sessionId)) captureTypedContact(body.sessionId, messages, body.snapshot, deps);

  const settings = chatSettings(deps.env);
  const model = deps.model ?? createAnthropic({ apiKey: deps.env.ANTHROPIC_API_KEY })(settings.model);
  const modelId = typeof model === "string" ? model : model.modelId;
  const snapshot = sanitizeSnapshot(body.snapshot);

  const result = streamText({
    model,
    instructions: [
      // Prompt caching. Anthropic caches the prefix tools -> system: the four tool definitions
      // (breakpoint on the last tool, src/lib/ai/tools.ts) and then these rules and the knowledge
      // base (breakpoint here). Both are byte-identical for every visitor, so after the first
      // turn they are read from the cache (about a tenth of the input price, and a faster start).
      { role: "system", content: STATIC_SYSTEM_PROMPT, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
      // This visit's context comes after the breakpoint, so it never invalidates the cached part.
      { role: "system", content: buildDynamicVisitorContext(snapshot) },
    ],
    // Plain alternating text, with a record of each card already shown: valid for Anthropic on every turn.
    messages: history,
    tools: advisorTools,
    // Every tool runs on the server, so a turn never waits on the browser. It ends with its quick
    // replies or the closing card; at most a scope, a check and a written reply before that.
    stopWhen: [isStepCount(5), hasToolCall("suggestReplies", "presentDealCloserCard")],
    maxOutputTokens: 6000,
    maxRetries: 1,
    abortSignal: deps.signal,
    providerOptions: { anthropic: strategistModelOptions(modelId) },
  });

  return createUIMessageStreamResponse({
    headers: { "cache-control": "no-store" },
    stream: toUIMessageStream<typeof advisorTools, AdvisorMessage>({
      stream: result.stream,
      tools: advisorTools,
      originalMessages: messages,
      sendReasoning: false,
      onError: (error) => {
        if (APICallError.isInstance(error)) {
          if (error.statusCode === 401) log.error("[advisor] ANTHROPIC_API_KEY was rejected");
          else if (error.statusCode === 429) log.warn("[advisor] Anthropic rate limit reached");
          else log.error(`[advisor] Anthropic API error ${error.statusCode ?? ""}: ${error.message}`);
        } else log.error("[advisor] reply failed", error instanceof Error ? error.message : error);
        return "unavailable" satisfies AdvisorFailure;
      },
    }),
  });
}

const textOf = (m: AdvisorMessage) =>
  m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n")
    .trim();

/** The inputs of the latest scope card in the conversation, if any. */
export function latestScopeInput(messages: readonly AdvisorMessage[]): ScopeInputLike | null {
  for (const m of [...messages].reverse())
    for (const p of [...m.parts].reverse()) if (p.type === "tool-generateProjectScope" && p.state === "output-available") return p.input as ScopeInputLike;
  return null;
}

function captureTypedContact(sessionId: string, messages: AdvisorMessage[], snapshot: unknown, deps: ChatDeps) {
  const log = deps.log ?? console;
  const visitorTexts = messages.filter((m) => m.role === "user").map(textOf);
  const contact = extractContact(visitorTexts);
  if (!hasReachableContact(contact)) return;
  const ledger = deps.ledger ?? sharedLeadLedger();
  const key = `${contact.email.toLowerCase()}|${contact.phone.replace(/\D/g, "")}`;
  if (!ledger.claimContact(sessionId, key)) return;

  const task = async () => {
    const dossier = buildDossier({
      sessionId,
      messageCount: messages.length,
      transcript: messages.map((m) => ({ role: m.role === "user" ? ("visitor" as const) : ("assistant" as const), text: textOf(m) })),
      snapshot,
      scopeInput: latestScopeInput(messages),
    });
    const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
    const outcome = await notifyOwners(chatContactNotice(dossier, reference), { env: deps.env, fetch: deps.fetch });
    if (outcome.status === "delivered") {
      ledger.markClosed(sessionId, reference);
      log.info("[advisor] contact typed in the chat sent to the team", { session: sessionId.slice(0, 8) });
    } else {
      ledger.releaseContact(sessionId, key);
      log.error(`[advisor] contact typed in the chat not sent: ${outcome.status}`);
    }
  };
  const run = () => task().catch((err: unknown) => log.error("[advisor] contact capture failed", err instanceof Error ? err.message : err));
  if (deps.background) deps.background(run);
  else void run();
}
