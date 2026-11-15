import type { AdvisorMessage } from "@/lib/ai/types";
import type { ScopeInput } from "./AdvisorCards";

/*
 * The browser side of the possible-lead summary (src/lib/ai/session-summary.ts).
 * Each conversation has a random session id in this tab. When a visitor has
 * chatted (at least one exchange) and has not sent the closing card, the
 * conversation's text, the visit snapshot and the latest scope are sent to
 * /api/chat/session-summary/ when they go idle for two minutes, close the
 * chat, or hide or leave the page. Each message count is sent once.
 */

const SESSION_KEY = "pg_advisor_session";
const CLOSED_KEY = "pg_advisor_closed";
const SENT_KEY = "pg_advisor_summaries";
const ENDPOINT = "/api/chat/session-summary/";
/** Under the route's 64 KB limit, with room for the snapshot. */
const BODY_BUDGET = 56_000;

export type SummaryReason = "idle" | "page_exit" | "chat_closed";

const read = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Private browsing: lasts as long as the page.
  }
};

let memorySession: string | null = null;

/** This tab's conversation id, made on first use. */
export function advisorSessionId(): string {
  const stored = read(SESSION_KEY) ?? memorySession;
  if (stored) return stored;
  const id = crypto.randomUUID();
  memorySession = id;
  write(SESSION_KEY, id);
  return id;
}

/** A new chat starts a new session. */
export function resetAdvisorSession() {
  memorySession = null;
  write(SESSION_KEY, null);
  write(CLOSED_KEY, null);
  write(SENT_KEY, null);
}

/** The closing card was sent: no possible-lead summaries for this session. */
export function markAdvisorClosed() {
  write(CLOSED_KEY, advisorSessionId());
}

const isClosed = () => read(CLOSED_KEY) === advisorSessionId();

const sentCounts = (): number[] => {
  try {
    const v: unknown = JSON.parse(read(SENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
};

const textOf = (m: AdvisorMessage) =>
  m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n")
    .trim();

/** Whether this conversation has something new for the team. */
export function summaryDue(messages: readonly AdvisorMessage[]): boolean {
  return messages.length >= 2 && messages.some((m) => m.role === "user" && textOf(m)) && !isClosed() && !sentCounts().includes(messages.length);
}

/**
 * Sends the summary if one is due. Page exits use sendBeacon, which the
 * browser delivers after the page is gone; the others use a keepalive fetch.
 */
export function sendSessionSummary(input: { messages: readonly AdvisorMessage[]; reason: SummaryReason; scope: ScopeInput | null; snapshot: unknown }): boolean {
  const { messages, reason } = input;
  if (!summaryDue(messages)) return false;

  let lines = messages.map((m) => ({ role: m.role === "user" ? "visitor" : "assistant", text: textOf(m).slice(0, 4000) })).filter((l) => l.text);
  const payload = () =>
    JSON.stringify({ sessionId: advisorSessionId(), messageCount: messages.length, messages: lines, visitorSnapshot: input.snapshot, extractedScope: input.scope, reason });
  let body = payload();
  // Keep the end of a long conversation: drop the oldest lines until it fits.
  while (body.length > BODY_BUDGET && lines.length > 1) {
    lines = lines.slice(1);
    body = payload();
  }
  if (body.length > BODY_BUDGET) return false;

  write(SENT_KEY, JSON.stringify([...sentCounts(), messages.length]));
  const blob = new Blob([body], { type: "application/json" });
  if (reason === "page_exit" && typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob)) return true;
  void fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {
    // Best effort: the visitor is leaving or idle, and nothing is shown to them.
  });
  return true;
}
