import { createHmac } from "node:crypto";
import { isAllowedEndpoint, leadPayload, oneLine, type DeliveryOutcome, type DeliveryResult, type Lead } from "@/lib/inquiry/delivery";
import { site } from "@/content/site";
import { visitLines, type ChatDossier, type TranscriptLine } from "./chat-dossier";
import { leadHtml, leadText, type LeadEmailModel } from "./lead-email";
import { OWNER_DEFAULTS, ownerWhatsapp, waLink, whatsappDigits } from "./owner-contact";
import type { ProjectScope } from "./tools";

/*
 * Tells the PermitGuys owners about every assistant conversation that matters:
 *
 * - CLOSED LEAD (`leadStatus: "closed_handoff"`): the visitor sent the closing
 *   card, or typed a phone number or email in the chat. A visitor who sent
 *   the card also gets a short confirmation email.
 * - POSSIBLE LEAD (`leadStatus: "possible_lead_abandoned"`): the visitor
 *   chatted and left without sending anything.
 *
 * Every configured channel runs in parallel (Promise.allSettled); the lead
 * counts as delivered when at least one confirms:
 *
 * 1. Resend email (RESEND_API_KEY): an HTML lead dossier to
 *    LEAD_NOTIFICATION_EMAIL (default Mzaman@permitguys.ca), from
 *    RESEND_FROM_EMAIL (default advisor@permitguys.ca). If Resend refuses
 *    the sender (domain not verified yet), the team's copy is retried from
 *    onboarding@resend.dev.
 * 2. WhatsApp push to OWNER_WHATSAPP_NUMBER (default +1 647 968 6284):
 *    Meta WhatsApp Cloud API (WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID)
 *    and/or CallMeBot (WHATSAPP_CALLMEBOT_API_KEY).
 * 3. Webhook (LEAD_WEBHOOK_URL, or INQUIRY_WEBHOOK_URL): the full JSON, for
 *    Make, Zapier, Twilio or a CRM, signed with LEAD_WEBHOOK_SECRET if set.
 *
 * With none of these set, nothing is sent and the caller reports "not
 * configured". Nothing here logs the visitor's details.
 */

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
const TIMEOUT_MS = 10_000;
/** WhatsApp text messages allow 4096 characters; a push stays well under. */
const WHATSAPP_MAX = 1500;

export type LeadStatus = "closed_handoff" | "possible_lead_abandoned";

export interface OwnerNotifyConfig {
  resend: { apiKey: string; from: string; fallbackFrom: string; to: string[] } | null;
  whatsapp: { to: string; meta: { token: string; phoneNumberId: string } | null; callmebotKey: string | null } | null;
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

  const apiKey = env.RESEND_API_KEY?.trim();
  const to = list(env.LEAD_NOTIFICATION_EMAIL);
  const resend = apiKey
    ? { apiKey, from: env.RESEND_FROM_EMAIL?.trim() || OWNER_DEFAULTS.from, fallbackFrom: OWNER_DEFAULTS.fallbackFrom, to: to.length ? to : [OWNER_DEFAULTS.email] }
    : null;

  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (Boolean(token) !== Boolean(phoneNumberId)) problems.push("WhatsApp Cloud API needs both WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID");
  const meta = token && phoneNumberId ? { token, phoneNumberId } : null;
  const callmebotKey = env.WHATSAPP_CALLMEBOT_API_KEY?.trim() || null;
  const whatsapp = meta || callmebotKey ? { to: ownerWhatsapp(env), meta, callmebotKey } : null;

  let webhook: OwnerNotifyConfig["webhook"] = null;
  const url = (env.LEAD_WEBHOOK_URL || env.INQUIRY_WEBHOOK_URL)?.trim();
  if (url) {
    if (isAllowedEndpoint(url)) webhook = { url, secret: (env.LEAD_WEBHOOK_SECRET || env.INQUIRY_WEBHOOK_SECRET)?.trim() || undefined };
    else problems.push("LEAD_WEBHOOK_URL (or INQUIRY_WEBHOOK_URL) must be an https URL");
  }
  return { resend, whatsapp, webhook, problems };
}

/** One message to the owners, ready for every channel. */
export interface OwnerNotice {
  leadStatus: LeadStatus;
  /** Stable per notice: the idempotency key for Resend and the webhook. */
  key: string;
  subject: string;
  text: string;
  html: string;
  /** The short summary pushed to the owner's WhatsApp. */
  whatsapp: string;
  replyTo?: string;
  /** Webhook JSON; `leadStatus` is added. */
  payload: Record<string, unknown>;
  /** Sent best-effort to the visitor after the owners' copy is delivered. */
  visitorConfirmation?: { to: string; subject: string; text: string };
}

export interface NotifyDeps {
  env: Env;
  fetch?: Fetch;
}

type Mail = { to: string[]; subject: string; text: string; html?: string; replyTo?: string; key: string };

async function resendSend(apiKey: string, from: string, mail: Mail, fetchImpl: Fetch): Promise<{ result: DeliveryResult; status: number }> {
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": mail.key },
      body: JSON.stringify({
        from,
        to: mail.to,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: oneLine(mail.subject).slice(0, 200),
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { result: { ok: false, destination: "resend", reason: `HTTP ${res.status}` }, status: res.status };
    const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
    return typeof data?.id === "string"
      ? { result: { ok: true, destination: "resend", reference: data.id }, status: res.status }
      : { result: { ok: false, destination: "resend", reason: "no message id in response" }, status: res.status };
  } catch (err) {
    return { result: { ok: false, destination: "resend", reason: err instanceof Error ? err.name : "network error" }, status: 0 };
  }
}

/**
 * The owners' email. Resend answers 403 (or 422) when the sender's domain is
 * not verified; the email is then sent again from Resend's onboarding
 * address, which Resend delivers to the account's own verified addresses.
 */
async function emailOwners(config: NonNullable<OwnerNotifyConfig["resend"]>, notice: OwnerNotice, fetchImpl: Fetch): Promise<DeliveryResult> {
  const mail: Mail = { to: config.to, subject: notice.subject, text: notice.text, html: notice.html, replyTo: notice.replyTo, key: notice.key };
  const first = await resendSend(config.apiKey, config.from, mail, fetchImpl);
  if (first.result.ok || ![403, 422].includes(first.status) || config.from === config.fallbackFrom) return first.result;
  const retry = await resendSend(config.apiKey, config.fallbackFrom, { ...mail, key: `${notice.key}-fallback` }, fetchImpl);
  return retry.result.ok ? { ...retry.result, destination: "resend-fallback-sender" } : first.result;
}

async function whatsappMeta(cfg: NonNullable<OwnerNotifyConfig["whatsapp"]>, text: string, fetchImpl: Fetch): Promise<DeliveryResult> {
  const meta = cfg.meta!;
  try {
    const res = await fetchImpl(`https://graph.facebook.com/v21.0/${encodeURIComponent(meta.phoneNumberId)}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${meta.token}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: cfg.to, type: "text", text: { preview_url: false, body: text } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? { ok: true, destination: "whatsapp-cloud" } : { ok: false, destination: "whatsapp-cloud", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, destination: "whatsapp-cloud", reason: err instanceof Error ? err.name : "network error" };
  }
}

async function whatsappCallmebot(cfg: NonNullable<OwnerNotifyConfig["whatsapp"]>, text: string, fetchImpl: Fetch): Promise<DeliveryResult> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cfg.to}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(cfg.callmebotKey!)}`;
  try {
    const res = await fetchImpl(url, { method: "GET", signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? { ok: true, destination: "whatsapp-callmebot" } : { ok: false, destination: "whatsapp-callmebot", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, destination: "whatsapp-callmebot", reason: err instanceof Error ? err.name : "network error" };
  }
}

async function postWebhook(config: NonNullable<OwnerNotifyConfig["webhook"]>, notice: OwnerNotice, fetchImpl: Fetch): Promise<DeliveryResult> {
  const body = JSON.stringify({ leadStatus: notice.leadStatus, ...notice.payload, whatsappSummary: notice.whatsapp });
  const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": notice.key };
  if (config.secret) headers["x-permitguys-signature"] = `sha256=${createHmac("sha256", config.secret).update(body).digest("hex")}`;
  try {
    const res = await fetchImpl(config.url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? { ok: true, destination: "webhook" } : { ok: false, destination: "webhook", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, destination: "webhook", reason: err instanceof Error ? err.name : "network error" };
  }
}

/** Sends the notice on every configured channel at once. Delivered if at least one confirms. */
export async function notifyOwners(notice: OwnerNotice, deps: NotifyDeps, config = ownerNotifyConfig(deps.env)): Promise<DeliveryOutcome> {
  const fetchImpl = deps.fetch ?? fetch;
  const jobs: { name: string; run: () => Promise<DeliveryResult> }[] = [];
  if (config.resend) jobs.push({ name: "resend", run: () => emailOwners(config.resend!, notice, fetchImpl) });
  if (config.whatsapp?.meta) jobs.push({ name: "whatsapp-cloud", run: () => whatsappMeta(config.whatsapp!, notice.whatsapp, fetchImpl) });
  if (config.whatsapp?.callmebotKey) jobs.push({ name: "whatsapp-callmebot", run: () => whatsappCallmebot(config.whatsapp!, notice.whatsapp, fetchImpl) });
  if (config.webhook) jobs.push({ name: "webhook", run: () => postWebhook(config.webhook!, notice, fetchImpl) });
  if (jobs.length === 0) return { status: "not_configured", results: [] };

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  const results: DeliveryResult[] = settled.map((s, i) => (s.status === "fulfilled" ? s.value : { ok: false, destination: jobs[i].name, reason: "adapter error" }));
  const delivered = results.some((r) => r.ok);
  if (delivered && config.resend && notice.visitorConfirmation) {
    // Only from the configured sender: Resend's onboarding address can't reach visitors.
    const v = notice.visitorConfirmation;
    const confirmation = await resendSend(config.resend.apiKey, config.resend.from, { to: [v.to], subject: v.subject, text: v.text, key: `${notice.key}-visitor` }, fetchImpl);
    results.push({ ...confirmation.result, destination: "visitor-confirmation" });
  }
  return { status: delivered ? "delivered" : "failed", results };
}

// ---- The notices ----

const inPlace = (municipality: string) => (municipality ? ` in ${municipality}` : "");

/** A wa.me link to the visitor, so the owner can reply in one tap. */
function replyLink(phone: string, name: string, project: string): string | null {
  const number = whatsappDigits(phone);
  if (!number) return null;
  const hello = name ? `Hi ${name.split(/\s+/)[0]}` : "Hi";
  return waLink(number, `${hello}, this is ${site.name} following up on your ${project ? `${project.toLowerCase()} ` : ""}inquiry from our website.`);
}

function whatsappSummary(input: {
  status: string;
  reference?: string;
  contact: { name?: string; phone?: string; email?: string; address?: string };
  municipality: string;
  project: string;
  scope?: string;
  drawings: { items: string[] }[];
  chat: string[];
}): string {
  const c = input.contact;
  const lines = [
    input.status + (input.reference ? ` · Ref ${input.reference}` : ""),
    c.name ? `Name: ${c.name}` : "",
    c.phone ? `Phone: ${c.phone}` : "",
    c.email ? `Email: ${c.email}` : "",
    c.address ? `Address: ${c.address}` : "",
    `Municipality: ${input.municipality || "Not given"}`,
    `Project: ${input.project || "Not clear yet"}`,
    input.scope ? `Scope: ${input.scope}` : "",
    input.drawings.length ? `Drawings: ${input.drawings.flatMap((g) => g.items).slice(0, 6).map((i) => i.replace(/\.$/, "")).join("; ")}` : "",
    input.chat.length ? `Chat: ${input.chat.map((q) => `"${q.slice(0, 160)}"`).join(" ")}` : "",
  ].filter(Boolean);
  const text = lines.join("\n");
  return text.length > WHATSAPP_MAX ? `${text.slice(0, WHATSAPP_MAX - 1)}…` : text;
}

const lastVisitorLines = (t: readonly TranscriptLine[], n = 3) =>
  t
    .filter((l) => l.role === "visitor")
    .slice(-n)
    .map((l) => l.text);

const scopeDrawings = (scope: unknown) => ((scope as ProjectScope | null)?.drawings ?? []).map((g) => ({ discipline: g.discipline, items: [...g.items] }));

/** The closing card was sent: the owners' CLOSED LEAD, plus the visitor's confirmation. */
export function closedLeadNotice(
  lead: Lead,
  extra: { reference: string; projectLabel: string; sessionId: string | null; upgradedFromPossibleLead: boolean },
): OwnerNotice {
  const { inquiry } = lead;
  const a = lead.assistant;
  const firstName = inquiry.name.split(/\s+/)[0];
  const drawings = scopeDrawings(a?.scope ?? null);
  const transcript = a?.transcript ?? [];
  const model: LeadEmailModel = {
    badge: "🔥 CLOSED LEAD",
    tone: "closed",
    intro: [
      "The visitor sent the assistant's closing card and is waiting for your quote and timeline.",
      extra.upgradedFromPossibleLead ? "Upgraded from POSSIBLE LEAD: a chat summary for this conversation was sent earlier." : "",
    ]
      .filter(Boolean)
      .join(" "),
    contact: [
      ["Name", inquiry.name],
      ["Phone", inquiry.phone],
      ["Email", inquiry.email],
      ["Preferred contact", inquiry.preferredContact === "phone" ? "Phone" : "Email"],
      ["Property address", a?.propertyAddress ?? ""],
      ["Best time to call", a?.bestTimeToCall ?? ""],
    ],
    project: [
      ["Project", extra.projectLabel],
      ["Municipality", inquiry.municipality],
      ["Stage", inquiry.stage],
      ["Asked for", a?.recommendedAction ?? ""],
      ["Description", inquiry.details],
    ],
    drawings,
    questions: [],
    transcript,
    visit: visitLines((a?.visit as Parameters<typeof visitLines>[0]) ?? null),
    whatsappReply: replyLink(inquiry.phone, inquiry.name, extra.projectLabel),
    footer: [
      ["Reference", extra.reference],
      ["Session", extra.sessionId ?? ""],
      ["Submitted", lead.submittedAt],
      ["Consent", "The visitor agreed that PermitGuys may contact them about this inquiry."],
    ],
  };
  return {
    leadStatus: "closed_handoff",
    key: `closed-${lead.id}`,
    subject: `🔥 [CLOSED LEAD] ${extra.projectLabel}${inPlace(inquiry.municipality)} — ${inquiry.name} (${inquiry.phone || inquiry.email})`,
    replyTo: inquiry.email,
    text: leadText(model),
    html: leadHtml(model),
    whatsapp: whatsappSummary({
      status: "🔥 CLOSED LEAD (closing card)",
      reference: extra.reference,
      contact: { name: inquiry.name, phone: inquiry.phone, email: inquiry.email, address: a?.propertyAddress },
      municipality: inquiry.municipality,
      project: extra.projectLabel,
      scope: inquiry.details.split("\n")[0],
      drawings,
      chat: lastVisitorLines(transcript),
    }),
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
        `Thank you for sending your ${extra.projectLabel.toLowerCase()} project to ${site.name}. Our team will review it and get in touch with next steps; your custom quote and timeline are prepared directly by our team.`,
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

function dossierModel(d: ChatDossier, badge: string, tone: LeadEmailModel["tone"], intro: string, footer: [string, string][]): LeadEmailModel {
  return {
    badge,
    tone,
    intro,
    contact: [
      ["Name", d.contact.name],
      ["Phone", d.contact.phone],
      ["Email", d.contact.email],
      ["Address", d.contact.address],
    ],
    project: [
      ["Project type", d.projectType || "Not clear from the chat"],
      ["Municipality", d.municipality || "Not given"],
      ["Scope summary", d.scope?.summary ?? ""],
      ["Stage", d.scope?.stage ?? ""],
    ],
    drawings: scopeDrawings(d.scope),
    questions: d.questions,
    transcript: d.transcript,
    visit: visitLines(d.visit),
    whatsappReply: replyLink(d.contact.phone, d.contact.name, d.projectType),
    footer: [...footer, ["Session", d.sessionId], ["Messages", String(d.messageCount)], ["Captured", d.capturedAt]],
  };
}

/** A phone number or email typed in the chat: a CLOSED LEAD built from the conversation. */
export function chatContactNotice(d: ChatDossier, reference: string): OwnerNotice {
  const model = dossierModel(
    d,
    "🔥 CLOSED LEAD (contact details typed in the chat)",
    "closed",
    "The visitor typed their contact details in a chat message instead of the closing card, so nothing beyond what is below was confirmed.",
    [["Reference", reference]],
  );
  return {
    leadStatus: "closed_handoff",
    key: `chat-contact-${d.sessionId}-${d.messageCount}`,
    subject: `🔥 [CLOSED LEAD] ${d.projectType || "Project"}${inPlace(d.municipality)} — ${d.contact.name || "Visitor"} (${d.contact.phone || d.contact.email})`,
    replyTo: d.contact.email || undefined,
    text: leadText(model),
    html: leadHtml(model),
    whatsapp: whatsappSummary({
      status: "🔥 CLOSED LEAD (typed in the chat)",
      reference,
      contact: d.contact,
      municipality: d.municipality,
      project: d.projectType,
      scope: d.scope?.summary,
      drawings: model.drawings,
      chat: d.questions.length ? d.questions.slice(-3) : lastVisitorLines(d.transcript),
    }),
    payload: { origin: "chat_message", reference, dossier: d },
  };
}

/** The visitor chatted and left without sending anything: a POSSIBLE LEAD summary. */
export function possibleLeadNotice(d: ChatDossier, reason: "idle" | "page_exit" | "chat_closed"): OwnerNotice {
  const topic = d.projectType || d.questions[0]?.slice(0, 60) || "Chat";
  const why = { idle: "stopped replying for two minutes", page_exit: "left the page", chat_closed: "closed the chat" }[reason];
  const model = dossierModel(
    d,
    "👀 POSSIBLE LEAD (Visitor Chatted & Left Without Submitting Form)",
    "possible",
    `The visitor chatted with the assistant and ${why} without sending the closing card. If they send it later, you will get a CLOSED LEAD for the same session.`,
    [["Reason", reason]],
  );
  return {
    leadStatus: "possible_lead_abandoned",
    key: `possible-${d.sessionId}-${d.messageCount}`,
    subject: `👀 [POSSIBLE LEAD — CHAT SUMMARY] ${topic}${inPlace(d.municipality)} (Visitor Left)`,
    replyTo: d.contact.email || undefined,
    text: leadText(model),
    html: leadHtml(model),
    whatsapp: whatsappSummary({
      status: `👀 POSSIBLE LEAD (visitor ${why})`,
      contact: d.contact,
      municipality: d.municipality,
      project: d.projectType,
      scope: d.scope?.summary,
      drawings: model.drawings,
      chat: d.questions.length ? d.questions.slice(0, 3) : lastVisitorLines(d.transcript),
    }),
    payload: { origin: "chat_summary", reason, dossier: d },
  };
}
