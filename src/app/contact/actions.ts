"use server";

import { headers } from "next/headers";
import { handleInquiry, sharedProtection } from "@/lib/inquiry/handle";
import { clientIp } from "@/lib/inquiry/protection";
import type { InquiryState } from "@/lib/inquiry/state";

/**
 * Server action behind the contact form. All validation, spam screening and
 * delivery happen in handleInquiry; this wrapper only supplies request
 * context. Secrets stay in server-side environment variables.
 */
export async function submitInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  const ip = clientIp(await headers());
  return handleInquiry(form, { env: process.env, ip, ...sharedProtection(process.env) });
}
