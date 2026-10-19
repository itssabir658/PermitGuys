import type { InquiryErrors, InquiryValues } from "@/lib/validation/inquiry";

/**
 * What the inquiry server action returns to the form. Only "sent" means a
 * destination confirmed the lead; every other status keeps the visitor's
 * values so nothing they typed is lost.
 */
export type InquiryState =
  | { status: "idle" }
  | { status: "sent"; reference: string }
  | { status: "invalid"; errors: InquiryErrors; values: InquiryValues }
  | { status: "not_configured"; values: InquiryValues }
  | { status: "failed"; values: InquiryValues }
  | { status: "rate_limited"; values: InquiryValues }
  | { status: "blocked"; values: InquiryValues };
