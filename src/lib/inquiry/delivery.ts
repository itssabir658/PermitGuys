import { createHmac } from "node:crypto";
import type { Inquiry } from "@/lib/validation/inquiry";
import type { Attribution } from "./attribution";

/*
 * Lead delivery. Every destination implements `LeadDestination`, so a CRM can
 * be added later without touching the form or the server action: write an
 * adapter, then return it from `configuredDestinations`.
 *
 * A lead counts as delivered only when a destination confirms it (a 2xx
 * response, plus a message id for email). Nothing here logs the visitor's
 * name, contact details or project description.
 */

export interface Lead {
  /** Client-generated id, used for duplicate protection and idempotency. */
  id: string;
  submittedAt: string;
  inquiry: Inquiry;
  attribution: Attribution;
}

export type DeliveryResult =
  | { ok: true; destination: string; reference?: string }
  | { ok: false; destination: string; reason: string };

export interface LeadDestination {
  /** Short, non-sensitive name used in logs, e.g. "webhook" or "resend". */
  readonly name: string;
  deliver(lead: Lead): Promise<DeliveryResult>;
}

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

const TIMEOUT_MS = 10_000;

function isAllowedEndpoint(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol === "https:") return true;
    // Plain http only for local testing.
    return u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname);
  } catch {
    return false;
  }
}

/** The JSON payload sent to webhooks and CRMs. */
export function leadPayload(lead: Lead) {
  const { inquiry } = lead;
  return {
    id: lead.id,
    submittedAt: lead.submittedAt,
    source: "website-inquiry-form",
    contact: {
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || null,
      preferredContact: inquiry.preferredContact,
    },
    project: {
      type: inquiry.projectType,
      municipality: inquiry.municipality,
      stage: inquiry.stage || null,
      details: inquiry.details,
    },
    consent: { contactAboutInquiry: inquiry.consent },
    attribution: lead.attribution,
  };
}

/**
 * Posts the lead as JSON to any endpoint (Zapier, Make, n8n, a CRM's inbound
 * webhook). With INQUIRY_WEBHOOK_SECRET set, the body is signed with
 * HMAC-SHA256 in the X-PermitGuys-Signature header so the receiver can
 * reject forged requests.
 */
export function webhookDestination(url: string, secret?: string, fetchImpl: Fetch = fetch): LeadDestination {
  return {
    name: "webhook",
    async deliver(lead) {
      const body = JSON.stringify(leadPayload(lead));
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "idempotency-key": lead.id,
      };
      if (secret) headers["x-permitguys-signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      try {
        const res = await fetchImpl(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
        return res.ok ? { ok: true, destination: "webhook" } : { ok: false, destination: "webhook", reason: `HTTP ${res.status}` };
      } catch (err) {
        return { ok: false, destination: "webhook", reason: err instanceof Error ? err.name : "network error" };
      }
    },
  };
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export function leadEmailText(lead: Lead): string {
  const { inquiry, attribution } = lead;
  const rows: [string, string][] = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone || "Not given"],
    ["Preferred contact", inquiry.preferredContact === "phone" ? "Phone" : "Email"],
    ["Project type", inquiry.projectType],
    ["Municipality or location", inquiry.municipality],
    ["Project stage", inquiry.stage || "Not given"],
  ];
  const attr = Object.entries(attribution);
  return [
    "New project inquiry from the PermitGuys website.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Project description:",
    inquiry.details,
    "",
    "The visitor agreed that PermitGuys may contact them about this inquiry.",
    ...(attr.length ? ["", "How they found the site:", ...attr.map(([k, v]) => `${k}: ${v}`)] : []),
    "",
    `Reference: ${lead.id}`,
    `Submitted: ${lead.submittedAt}`,
  ].join("\n");
}

/**
 * Sends the lead to the business inbox through Resend's REST API. The
 * visitor's address is set as reply-to so the business can answer directly.
 * The sender must be on a domain verified in Resend.
 */
export function resendDestination(
  config: { apiKey: string; from: string; to: string[] },
  fetchImpl: Fetch = fetch,
): LeadDestination {
  return {
    name: "resend",
    async deliver(lead) {
      const { inquiry } = lead;
      try {
        const res = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
            "idempotency-key": `inquiry-${lead.id}`,
          },
          body: JSON.stringify({
            from: config.from,
            to: config.to,
            reply_to: inquiry.email,
            subject: oneLine(`New inquiry: ${inquiry.projectType}, ${inquiry.municipality}`).slice(0, 200),
            text: leadEmailText(lead),
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return { ok: false, destination: "resend", reason: `HTTP ${res.status}` };
        const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
        return typeof data?.id === "string"
          ? { ok: true, destination: "resend", reference: data.id }
          : { ok: false, destination: "resend", reason: "no message id in response" };
      } catch (err) {
        return { ok: false, destination: "resend", reason: err instanceof Error ? err.name : "network error" };
      }
    },
  };
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Destinations enabled by environment variables. A destination whose
 * variables are only partly set is skipped and reported as a problem, so a
 * misconfiguration cannot silently swallow leads.
 */
export function configuredDestinations(env: Env = process.env, fetchImpl: Fetch = fetch) {
  const destinations: LeadDestination[] = [];
  const problems: string[] = [];

  const webhook = env.INQUIRY_WEBHOOK_URL?.trim();
  if (webhook) {
    if (isAllowedEndpoint(webhook)) destinations.push(webhookDestination(webhook, env.INQUIRY_WEBHOOK_SECRET || undefined, fetchImpl));
    else problems.push("INQUIRY_WEBHOOK_URL must be an https URL");
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.INQUIRY_EMAIL_FROM?.trim();
  const to = list(env.INQUIRY_EMAIL_TO);
  if (apiKey || from || to.length) {
    if (apiKey && from && to.length) destinations.push(resendDestination({ apiKey, from, to }, fetchImpl));
    else problems.push("Resend needs RESEND_API_KEY, INQUIRY_EMAIL_FROM and INQUIRY_EMAIL_TO");
  }

  return { destinations, problems };
}

export type DeliveryOutcome =
  | { status: "delivered"; results: DeliveryResult[] }
  | { status: "failed"; results: DeliveryResult[] }
  | { status: "not_configured"; results: [] };

/** Sends to every destination; the lead is delivered if at least one confirms. */
export async function deliverLead(lead: Lead, destinations: LeadDestination[]): Promise<DeliveryOutcome> {
  if (destinations.length === 0) return { status: "not_configured", results: [] };
  const results = await Promise.all(
    destinations.map((d) =>
      d.deliver(lead).catch((): DeliveryResult => ({ ok: false, destination: d.name, reason: "adapter error" })),
    ),
  );
  return { status: results.some((r) => r.ok) ? "delivered" : "failed", results };
}
