"use server";

import { parseInquiry, type InquiryErrors } from "@/lib/validation/inquiry";

export type InquiryState =
  | { status: "idle" }
  | { status: "invalid"; errors: InquiryErrors; values: Record<string, string> }
  | { status: "sent" }
  | { status: "unavailable"; values: Record<string, string> };

/**
 * Validates the inquiry on the server and forwards it to INQUIRY_WEBHOOK_URL
 * (for example a CRM or email automation endpoint). Until that variable is
 * configured, the form tells the visitor that online inquiries are not yet
 * connected instead of pretending the message was sent.
 */
export async function submitInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  // Honeypot: real visitors never fill the hidden "company" field.
  if (typeof form.get("company") === "string" && form.get("company") !== "") return { status: "sent" };

  const result = parseInquiry(form);
  if (!result.ok) return { status: "invalid", errors: result.errors, values: result.values };

  const endpoint = process.env.INQUIRY_WEBHOOK_URL;
  const values: Record<string, string> = Object.fromEntries(
    Object.entries(result.value).filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  if (!endpoint) return { status: "unavailable", values };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...result.value, submittedAt: new Date().toISOString(), source: "website-contact" }),
    });
    if (!res.ok) return { status: "unavailable", values };
    return { status: "sent" };
  } catch {
    return { status: "unavailable", values };
  }
}
