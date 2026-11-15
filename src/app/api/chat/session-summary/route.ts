import { after } from "next/server";
import { clientIp } from "@/lib/inquiry/protection";
import { SUMMARY_BODY_MAX, sharedSummaryLimiter, summarizeSession } from "@/lib/ai/session-summary";

/**
 * POST /api/chat/session-summary: the assistant's possible-lead summary
 * (src/lib/ai/session-summary.ts). Usually sent with navigator.sendBeacon as
 * the visitor leaves, so nobody reads the answer: it is 202 straight away and
 * the summary goes to the team after the response.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response(null, { status: 403 });

  const raw = await request.text();
  if (raw.length > SUMMARY_BODY_MAX) return new Response(null, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const ip = clientIp(request.headers);
  after(() => summarizeSession(body, { env: process.env, ip, rateLimiter: sharedSummaryLimiter() }));
  return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
}
