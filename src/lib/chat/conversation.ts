import type { Handoff } from "./handoff";

/**
 * The conversation the browser posts to /api/chat. The server is stateless:
 * the browser keeps the visible transcript and sends it back each turn, so
 * everything in it is checked here as untrusted input.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export const chatLimits = {
  /** Characters in one visitor message (the input field enforces the same). */
  message: 1200,
  /** Characters kept from one earlier assistant reply. */
  reply: 4000,
  /** Visitor messages in one conversation, after which the visitor is pointed to the form. */
  turns: 16,
} as const;

export type ConversationResult = { ok: true; turns: ChatTurn[] } | { ok: false; reason: "invalid" | "too_long" };

const clean = (v: string) =>
  v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, "")
    .trim();

/**
 * Accepts `{ messages: [{ role, content }] }` that starts and ends with the
 * visitor and alternates. Over-long messages are rejected rather than cut, so
 * nobody's question is silently changed.
 */
export function parseConversation(body: unknown): ConversationResult {
  if (!body || typeof body !== "object") return { ok: false, reason: "invalid" };
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, reason: "invalid" };
  if (raw.length > chatLimits.turns * 2) return { ok: false, reason: "too_long" };
  const turns: ChatTurn[] = [];
  for (const [i, m] of raw.entries()) {
    if (!m || typeof m !== "object") return { ok: false, reason: "invalid" };
    const { role, content } = m as Record<string, unknown>;
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (role !== expected || typeof content !== "string") return { ok: false, reason: "invalid" };
    const text = clean(content);
    if (!text) return { ok: false, reason: "invalid" };
    if (text.length > (role === "user" ? chatLimits.message : chatLimits.reply)) return { ok: false, reason: "too_long" };
    turns.push({ role: expected, content: text });
  }
  if (turns[turns.length - 1].role !== "user") return { ok: false, reason: "invalid" };
  return { ok: true, turns };
}

/** Lines of the streamed reply (newline-delimited JSON). */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "handoff"; handoff: Handoff }
  | { type: "done" }
  | { type: "error"; reason: "not_configured" | "rate_limited" | "invalid" | "too_long" | "declined" | "unavailable" };
