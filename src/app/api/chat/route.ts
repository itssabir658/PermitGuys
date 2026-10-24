import { clientIp } from "@/lib/inquiry/protection";
import { respond, sharedChatLimiter } from "@/lib/chat/respond";

/**
 * POST /api/chat: one turn of the website assistant, streamed back as
 * newline-delimited JSON events (src/lib/chat/conversation.ts). The API key
 * stays on the server; without one, the reply says the assistant is off.
 */
export async function POST(request: Request) {
  // Only this site's own pages may use the assistant.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response(null, { status: 403 });

  let body: unknown = null;
  try {
    const text = await request.text();
    if (text.length <= 64_000) body = JSON.parse(text);
  } catch {
    body = null;
  }

  const events = respond(body, {
    env: process.env,
    ip: clientIp(request.headers),
    rateLimiter: sharedChatLimiter(process.env),
    signal: request.signal,
  });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await events.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
