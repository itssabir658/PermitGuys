/*
 * Which conversations have already reached the team, so each one arrives once
 * per stage:
 *
 * - a possible-lead summary is sent once per (session, message count): a
 *   visitor who comes back and chats more produces a newer summary, a page
 *   exit right after an idle summary does not produce a second copy;
 * - contact details typed in the chat are sent once per (session, details);
 * - once a session is a closed lead (closing card sent, or contact typed in
 *   the chat) no more possible-lead summaries are sent for it, and the
 *   closed lead says it was upgraded from a possible lead.
 *
 * Kept in memory per server instance, like the rate limits. A webhook
 * receiver can merge records across instances by `sessionId`.
 */

interface SessionRecord {
  summaries: Set<number>;
  contacts: Set<string>;
  closedReference: string | null;
}

export interface LeadLedger {
  /** True if this summary should be sent (and records it); false if already sent or the session is closed. */
  claimSummary(sessionId: string, messageCount: number): "ok" | "duplicate" | "closed";
  /** Forgets a claimed summary whose delivery failed, so a later trigger can retry. */
  releaseSummary(sessionId: string, messageCount: number): void;
  claimContact(sessionId: string, key: string): boolean;
  releaseContact(sessionId: string, key: string): void;
  /** Marks the session closed; returns whether a possible-lead summary had been sent for it. */
  markClosed(sessionId: string, reference: string): { upgradedFromPossibleLead: boolean; alreadyClosed: boolean };
  /** Undoes markClosed when the closed lead could not be delivered. */
  reopen(sessionId: string): void;
  closedReference(sessionId: string): string | null;
}

export function memoryLeadLedger(maxSessions = 5000): LeadLedger {
  const sessions = new Map<string, SessionRecord>();
  const get = (id: string) => {
    let r = sessions.get(id);
    if (r) {
      // Most recently used last, so the oldest is dropped first.
      sessions.delete(id);
    } else r = { summaries: new Set(), contacts: new Set(), closedReference: null };
    sessions.set(id, r);
    if (sessions.size > maxSessions) sessions.delete(sessions.keys().next().value as string);
    return r;
  };
  return {
    claimSummary(id, count) {
      const r = get(id);
      if (r.closedReference) return "closed";
      if (r.summaries.has(count)) return "duplicate";
      r.summaries.add(count);
      return "ok";
    },
    releaseSummary(id, count) {
      sessions.get(id)?.summaries.delete(count);
    },
    claimContact(id, key) {
      const r = get(id);
      if (r.contacts.has(key)) return false;
      r.contacts.add(key);
      return true;
    },
    releaseContact(id, key) {
      sessions.get(id)?.contacts.delete(key);
    },
    markClosed(id, reference) {
      const r = get(id);
      const upgradedFromPossibleLead = r.summaries.size > 0;
      const alreadyClosed = r.closedReference !== null;
      r.closedReference ??= reference;
      return { upgradedFromPossibleLead, alreadyClosed };
    },
    reopen(id) {
      const r = sessions.get(id);
      if (r) r.closedReference = null;
    },
    closedReference(id) {
      return sessions.get(id)?.closedReference ?? null;
    },
  };
}

let shared: LeadLedger | null = null;
export const sharedLeadLedger = () => (shared ??= memoryLeadLedger());

/** Session ids are random UUIDs made in the visitor's tab. */
export const isSessionId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
