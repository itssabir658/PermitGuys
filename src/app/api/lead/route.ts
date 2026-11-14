import { sharedProtection } from "@/lib/inquiry/handle";
import { clientIp } from "@/lib/inquiry/protection";
import { submitClosedLead } from "@/lib/ai/submit-lead";

/**
 * POST /api/lead: the assistant's closing card sends the visitor's request
 * here (src/lib/ai/submit-lead.ts). Same delivery, rate limit and duplicate
 * guard as the inquiry form. Answers JSON with a status the card explains.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response(null, { status: 403 });

  const raw = await request.text();
  let body: unknown = null;
  try {
    if (raw.length <= 120_000) body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const { rateLimiter, duplicates } = sharedProtection(process.env);
  const result = await submitClosedLead(body, { env: process.env, ip: clientIp(request.headers), rateLimiter, duplicates });
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
