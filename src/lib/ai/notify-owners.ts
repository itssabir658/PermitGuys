import { createHmac } from "node:crypto";
import { isAllowedEndpoint, leadEmailText, leadPayload, oneLine, type DeliveryOutcome, type DeliveryResult, type Lead } from "@/lib/inquiry/delivery";
import { site } from "@/content/site";
import { dossierEmailText, type ChatDossier } from "./chat-dossier";

/*
 * Tells the PermitGuys team about every assistant conversation that matters:
 *
 * - CLOSED LEAD (`leadStatus: "closed_handoff"`): the visitor sent the closing
 *   card, or typed a phone number or email in the chat. The visitor who sent
 *   the card also gets a short confirmation email.
 * - POSSIBLE LEAD (`leadStatus: "possible_lead_abandoned"`): the visitor
 *   chatted and left without sending anything. A summary of the conversation.
 *
 * Each goes to the team's inbox through Resend and to the lead webhook as
 * JSON. Settings, with the inquiry form's names as fallbacks:
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL      (or INQUIRY_EMAIL_FROM), on a domain verified in Resend
 *   LEAD_NOTIFICATION_EMAIL (or INQUIRY_EMAIL_TO), comma-separated
 *   LEAD_WEBHOOK_URL       (or INQUIRY_WEBHOOK_URL), https only
 *   LEAD_WEBHOOK_SECRET    (or INQUIRY_WEBHOOK_SECRET), optional HMAC signature
 * With none set, nothing is sent and the caller reports "not configured".
 * Nothing here logs the visitor's details.
 */

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
const TIMEOUT_MS = 10_000;

export type LeadStatus = "closed_handoff" | "possible_lead_abandoned";

export interface OwnerNotifyConfig {
  resend: { apiKey: string; from: string; to: string[] } | null;
  webhook: { url: string; secret?: string } | null;
  problems: string[];
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function ownerNotifyConfig(env: Env): OwnerNotifyConfig {
  const problems: string[] = [];
  let resend: OwnerNotifyConfig["resend"] = null;
  let webhook: OwnerNotifyConfig["webhook"] = null;

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = (env.RESEND_FROM_EMAIL || env.INQUIRY_EMAIL_FROM)?.trim();
  const to = list(env.LEAD_NOTIFICATION_EMAIL || env.INQUIRY_EMAIL_TO);
  if (apiKey || from || to.length) {
    if (apiKey && from && to.length) resend = { apiKey, from, to };
    else problems.push("Lead emails need RESEND_API_KEY, RESEND_FROM_EMAIL (or INQUIRY_EMAIL_FROM) and LEAD_NOTIFICATION_EMAIL (or INQUIRY_EMAIL_TO)");
  }

  const url = (env.LEAD_WEBHOOK_URL || env.INQUIRY_WEBHOOK_URL)?.trim();
  if (url) {
    if (isAllowedEndpoint(url)) webhook = { url, secret: (env.LEAD_WEBHOOK_SECRET || env.INQUIRY_WEBHOOK_SECRET)?.trim() || undefined };
    else problems.push("LEAD_WEBHOOK_URL (or INQUIRY_WEBHOOK_URL) must be an https URL");
  }
  return { resend, webhook, problems };
}

/** One message to the team, ready for every channel. */
export interface OwnerNotice {
  leadStatus: LeadStatus;
  /** Stable per notice: the idempotency key for Resend and the webhook. */
  key: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** Webhook JSON; `leadStatus` is added. */
  payload: Record<string, unknown>;
  /** Sent best-effort to the visitor after the team's copy is delivered. */
  visitorConfirmation?: { to: string; subject: string; text: string };
}

export interface NotifyDeps {
  env: Env;
  fetch?: Fetch;
}

async function sendEmail(
  config: NonNullable<OwnerNotifyConfig["resend"]>,
  mail: { to: string[]; subject: string; text: string; replyTo?: string; key: string },
  fetchImpl: Fetch,
): Promise<DeliveryResult> {
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json", "idempotency-key": mail.key },
      body: JSON.stringify({
        from: config.from,
        to: mail.to,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: oneLine(mail.subject).slice(0, 200),
        text: mail.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, destination: "resend", reason: `HTTP ${res.status}` };
    const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
    return typeof data?.id === "string" ? { ok: true, destination: "resend", reference: data.id } : { ok: false, destination: "resend", reason: "no message id in response" };
  } catch (err) {
    return { ok: false, destination: "resend", reason: err instanceof Error ? err.name : "network error" };
  }
}

async function postWebhook(config: NonNullable<OwnerNotifyConfig["webhook"]>, notice: OwnerNotice, fetchImpl: Fetch): Promise<DeliveryResult> {
  const body = JSON.stringify({ leadStatus: notice.leadStatus, ...notice.payload });
  const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": notice.key };
  if (config.secret) headers["x-permitguys-signature"] = `sha256=${createHmac("sha256", config.secret).update(body).digest("hex")}`;
  try {
    const res = await fetchImpl(config.url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? { ok: true, destination: "webhook" } : { ok: false, destination: "webhook", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, destination: "webhook", reason: err instanceof Error ? err.name : "network error" };
  }
}

/** Sends the notice on every configured channel. Delivered if at least one confirms. */
export async function notifyOwners(notice: OwnerNotice, deps: NotifyDeps, config = ownerNotifyConfig(deps.env)): Promise<DeliveryOutcome> {
  const fetchImpl = deps.fetch ?? fetch;
  const jobs: Promise<DeliveryResult>[] = [];
  if (config.resend) jobs.push(sendEmail(config.resend, { to: config.resend.to, subject: notice.subject, text: notice.text, replyTo: notice.replyTo, key: notice.key }, fetchImpl));
  if (config.webhook) jobs.push(postWebhook(config.webhook, notice, fetchImpl));
  if (jobs.length === 0) return { status: "not_configured", results: [] };
  const results = await Promise.all(jobs);
  const delivered = results.some((r) => r.ok);
  if (delivered && config.resend && notice.visitorConfirmation) {
    const v = notice.visitorConfirmation;
    const confirmation = await sendEmail(config.resend, { to: [v.to], subject: v.subject, text: v.text, key: `${notice.key}-visitor` }, fetchImpl);
    results.push({ ...confirmation, destination: "visitor-confirmation" });
  }
  return { status: delivered ? "delivered" : "failed", results };
}

const inPlace = (municipality: string) => (municipality ? ` in ${municipality}` : "");

/** The closing card was sent: the team's CLOSED LEAD email and webhook, plus the visitor's confirmation. */
export function closedLeadNotice(
  lead: Lead,
  extra: { reference: string; projectLabel: string; sessionId: string | null; upgradedFromPossibleLead: boolean },
): OwnerNotice {
  const { inquiry } = lead;
  const firstName = inquiry.name.split(/\s+/)[0];
  return {
    leadStatus: "closed_handoff",
    key: `closed-${lead.id}`,
    subject: `[CLOSED LEAD] ${extra.projectLabel}${inPlace(inquiry.municipality)} — ${inquiry.name} (${extra.reference})`,
    replyTo: inquiry.email,
    text: [
      "CLOSED LEAD: the visitor sent the assistant's closing card.",
      ...(extra.upgradedFromPossibleLead ? ["Upgraded from POSSIBLE LEAD: a chat summary for this conversation was sent earlier."] : []),
      "",
      leadEmailText(lead),
      ...(extra.sessionId ? [`Session: ${extra.sessionId}`] : []),
    ].join("\n"),
    payload: {
      ...leadPayload(lead),
      reference: extra.reference,
      sessionId: extra.sessionId,
      origin: "closing_card",
      upgradedFromPossibleLead: extra.upgradedFromPossibleLead,
    },
    visitorConfirmation: {
      to: inquiry.email,
      subject: `We have your project request (${extra.reference})`,
      text: [
        `Hi ${firstName},`,
        "",
        `Thank you for sending your ${extra.projectLabel.toLowerCase()} project to ${site.name}. Our team will review it and get in touch with next steps, and your custom quote and timeline are prepared directly by our team.`,
        "",
        `Your reference: ${extra.reference}`,
        "",
        `If you have anything to add, reply to this email${site.contact.phone ? ` or call us at ${site.contact.phone}` : ""}.`,
        "",
        site.name,
      ].join("\n"),
    },
  };
}

/** A phone number or email typed in the chat: a CLOSED LEAD built from the conversation. */
export function chatContactNotice(d: ChatDossier, reference: string): OwnerNotice {
  const who = d.contact.name || d.contact.email || d.contact.phone;
  return {
    leadStatus: "closed_handoff",
    key: `chat-contact-${d.sessionId}-${d.messageCount}`,
    subject: `[CLOSED LEAD] ${d.projectType || "Project"}${inPlace(d.municipality)} — ${who} (${reference})`,
    replyTo: d.contact.email || undefined,
    text: dossierEmailText(
      d,
      "CLOSED LEAD (contact details typed in the chat)",
      `The visitor typed their contact details in a chat message. They did not fill in the closing card, so nothing beyond what is below was confirmed. Reference: ${reference}.`,
    ),
    payload: { origin: "chat_message", reference, dossier: d },
  };
}

/** The visitor chatted and left without sending anything: a POSSIBLE LEAD summary. */
export function possibleLeadNotice(d: ChatDossier, reason: "idle" | "page_exit" | "chat_closed"): OwnerNotice {
  const topic = d.projectType || d.questions[0]?.slice(0, 60) || "Chat";
  const why = { idle: "stopped replying for two minutes", page_exit: "left the page", chat_closed: "closed the chat" }[reason];
  return {
    leadStatus: "possible_lead_abandoned",
    key: `possible-${d.sessionId}-${d.messageCount}`,
    subject: `[POSSIBLE LEAD — CHAT SUMMARY] ${topic}${inPlace(d.municipality)} (${d.sessionId.slice(0, 8).toUpperCase()})`,
    replyTo: d.contact.email || undefined,
    text: dossierEmailText(
      d,
      "POSSIBLE LEAD (Visitor Chatted & Left Without Submitting Form)",
      `The visitor chatted with the assistant and ${why} without sending the closing card. If they send it later, you will get a CLOSED LEAD email for the same session.`,
    ),
    payload: { origin: "chat_summary", reason, dossier: d },
  };
}
