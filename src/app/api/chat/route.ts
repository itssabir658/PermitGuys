import { after } from "next/server";
import { clientIp } from "@/lib/inquiry/protection";
import { handleChat, sharedAdvisorLimiter } from "@/lib/ai/chat-handler";

/**
 * POST /api/chat: one turn of the permit strategist (src/lib/ai), streamed
 * back as an AI SDK UI message stream. The API key stays on the server;
 * without one the route answers 503 and the widget is not on the page.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  // Only this site's own pages may use the assistant.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response(null, { status: 403 });

  return handleChat(await request.text(), {
    env: process.env,
    ip: clientIp(request.headers),
    rateLimiter: sharedAdvisorLimiter(process.env),
    signal: request.signal,
    // Contact details typed in the chat reach the team after the reply has started streaming.
    background: (task) => after(task),
  });
}
