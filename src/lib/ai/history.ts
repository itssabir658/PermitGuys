import type { ModelMessage } from "ai";
import { z } from "zod";
import type { AdvisorMessage } from "./types";

/*
 * The conversation the browser sends back on every turn, and the history
 * Claude is given.
 *
 * The browser holds the whole conversation, including the assistant's
 * earlier turns with their tool cards (a scope, a permit check, quick
 * replies, the closing card), step markers and provider metadata. Two things
 * went wrong when that was handed to the model as it was:
 *
 * - Checking every earlier tool call against today's tool schemas rejected
 *   the request (400) whenever one did not match: a tool call the model
 *   wrote badly, a conversation stored by an older version of the widget.
 * - Claude Opus 5.5 always thinks. A turn ends on a tool call (the quick
 *   replies or the closing card), and the browser never receives the
 *   thinking, so on the next turn Anthropic saw an assistant tool call
 *   without its thinking block, followed by its result, and refused the
 *   request: every follow-up failed.
 *
 * So the request is read leniently, and each earlier assistant turn reaches
 * Claude as plain text: what it wrote, plus a one-line record of each card
 * it showed. The history is then a clean alternation of user and assistant
 * text with nothing empty, which Anthropic always accepts, and Claude still
 * knows what the visitor has already seen.
 */

const partSchema = z.looseObject({ type: z.string() });
const messageSchema = z.looseObject({
  id: z.string().max(200).optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(partSchema).max(200).optional(),
  /** Older clients and other callers may send plain text instead of parts. */
  content: z.unknown().optional(),
});

/**
 * Reads the conversation from the request body. Any assistant message shape
 * is accepted; only the roles and the visitor's text matter for validity.
 * Returns null when the body is not a conversation.
 */
export function parseConversation(raw: unknown): AdvisorMessage[] | null {
  const parsed = z.array(messageSchema).min(1).safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.map((m, i) => {
    const parts = (m.parts ?? []) as AdvisorMessage["parts"];
    const fallback = typeof m.content === "string" && m.content.trim() && !parts.some((p) => p.type === "text") ? [{ type: "text" as const, text: m.content }] : [];
    return {
      id: m.id || `m${i}`,
      role: m.role,
      parts: [...fallback, ...parts],
    } as AdvisorMessage;
  });
}

type Part = Record<string, unknown> & { type: string };
const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const where = (municipality: unknown) => (str(municipality) ? ` in ${str(municipality)}` : "");
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** One line recording a card the visitor saw, or null for a tool call that never produced one. */
export function cardRecord(part: Part): string | null {
  if (!part.type.startsWith("tool-") || part.state !== "output-available") return null;
  const out = obj(part.output);
  const input = obj(part.input);
  switch (part.type) {
    case "tool-generateProjectScope": {
      const drawings = list(out.drawings)
        .map((g) => `${str(obj(g).discipline)}: ${list(obj(g).items).map(str).join(" ")}`)
        .join(" | ");
      const review = str(obj(out.cityReview).window);
      const watch = list(out.considerations).map(str).join(" ");
      return clip(
        `[Project scope card shown: ${str(out.projectLabel) || str(input.projectType)}${where(out.municipality ?? input.municipality)}.` +
          (str(out.summary) ? ` Project: ${str(out.summary)}` : "") +
          (drawings ? ` Drawing set: ${drawings}.` : "") +
          (review ? ` City review: ${review}.` : "") +
          (watch ? ` Points to watch: ${watch}` : "") +
          " Pricing and turnaround: confirmed in the quote.]",
        1500,
      );
    }
    case "tool-checkPermitComplianceRisk": {
      const triggers = list(out.codeTriggers).map(str).join(" ");
      const zoning = list(out.zoning).map(str).join(" ");
      return clip(
        `[Permit check card shown: ${str(out.scenarioLabel) || str(input.scenario)}${where(out.municipality ?? input.municipality)}.` +
          (triggers ? ` Code points: ${triggers}` : "") +
          (zoning ? ` Zoning: ${zoning}` : "") +
          "]",
        1200,
      );
    }
    case "tool-presentDealCloserCard":
      return `[Closing card shown: ${str(out.recommendedAction) || str(input.recommendedAction) || "Scope review and quote"} for ${str(out.projectLabel) || "the project"}${where(out.municipality ?? input.municipality)}. The visitor adds their contact details on the card.]`;
    case "tool-suggestReplies": {
      const replies = list(out.replies).map(str).filter(Boolean);
      return replies.length ? `[Quick replies offered: ${replies.map((r) => `"${r}"`).join(", ")}]` : null;
    }
    default:
      return null;
  }
}

/** The plain text of a message, with a record of each card in place for an assistant turn. */
export function messageText(m: AdvisorMessage, withCards: boolean): string {
  const lines: string[] = [];
  for (const p of m.parts as unknown as Part[]) {
    if (p.type === "text") {
      const t = String(p.text ?? "").trim();
      if (t) lines.push(t);
    } else if (withCards) {
      const record = cardRecord(p);
      if (record) lines.push(record);
    }
  }
  return lines.join("\n\n");
}

/** Said in place of an earlier assistant turn that left nothing behind (it failed or was stopped). */
export const EMPTY_TURN = "[No reply was shown for this turn.]";

/**
 * The history for Claude: user and assistant turns as text, alternating,
 * starting and ending with the visitor, nothing empty.
 */
export function toModelHistory(messages: readonly AdvisorMessage[]): ModelMessage[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = messageText(m, m.role === "assistant");
    const prev = out[out.length - 1];
    if (m.role === "user") {
      if (!text) continue;
      if (prev?.role === "user") prev.content += `\n\n${text}`;
      else out.push({ role: "user", content: text });
    } else {
      // A reply before any visitor message has nothing to answer; two replies in a row are one turn.
      if (!prev) continue;
      if (prev.role === "assistant") {
        if (text) prev.content = prev.content === EMPTY_TURN ? text : `${prev.content}\n\n${text}`;
      } else out.push({ role: "assistant", content: text || EMPTY_TURN });
    }
  }
  // Two visitor messages in a row (a reply that failed) read as one; the last message is always the visitor's.
  while (out.length && out[out.length - 1].role !== "user") out.pop();
  return out;
}
