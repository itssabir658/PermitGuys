/*
 * The owners' contact details for assistant leads (confirmed by Sebra,
 * 2026-11-15). Production defaults, each overridable by an environment
 * variable:
 *
 * - LEAD_NOTIFICATION_EMAIL: where lead emails go (server only).
 * - OWNER_WHATSAPP_NUMBER: the WhatsApp number that receives lead pushes
 *   (server). The closing card's "Message on WhatsApp" button reads
 *   NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER at build time.
 * - RESEND_FROM_EMAIL: the sender. If Resend refuses it (domain not
 *   verified yet), the team's copy is sent again from Resend's shared
 *   onboarding address.
 *
 * Shared by the browser and the server: no server-only imports.
 */

export const OWNER_DEFAULTS = {
  email: "Mzaman@permitguys.ca",
  whatsapp: "16479686284",
  from: "PermitGuys AI Strategist <advisor@permitguys.ca>",
  fallbackFrom: "PermitGuys AI <onboarding@resend.dev>",
} as const;

const digits = (v: string | undefined) => (v ?? "").replace(/\D/g, "");

/** A WhatsApp number as digits with the country code; a 10-digit North American number gets the leading 1. */
export function whatsappDigits(raw: string | undefined): string {
  const d = digits(raw);
  if (d.length === 10) return `1${d}`;
  return d.length >= 11 && d.length <= 15 ? d : "";
}

/** "+1 (647) 968-6284" for North American numbers, "+44…" otherwise. */
export function whatsappDisplay(number: string): string {
  const d = digits(number);
  return d.length === 11 && d.startsWith("1") ? `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}` : `+${d}`;
}

export const waLink = (number: string, text: string) => `https://wa.me/${digits(number)}?text=${encodeURIComponent(text)}`;

/** The owner's WhatsApp number on the server. */
export const ownerWhatsapp = (env: Record<string, string | undefined>) => whatsappDigits(env.OWNER_WHATSAPP_NUMBER) || OWNER_DEFAULTS.whatsapp;

/** The owner's WhatsApp number in the browser (inlined at build time). */
export const publicOwnerWhatsapp = () => whatsappDigits(process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER) || OWNER_DEFAULTS.whatsapp;
