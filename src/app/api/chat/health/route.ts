import { assistantHealth, type AssistantHealth } from "@/lib/ai/health";

/**
 * GET /api/chat/health/: whether the assistant's API key works and whether
 * leads have somewhere to go (src/lib/ai/health.ts). 200 when all is well,
 * 503 otherwise, so an uptime monitor can alert on it. Cached for five
 * minutes per instance so it cannot be used to hammer Anthropic.
 */
export const dynamic = "force-dynamic";

let cached: { at: number; health: AssistantHealth } | null = null;
const TTL_MS = 5 * 60_000;

export async function GET() {
  if (!cached || Date.now() - cached.at > TTL_MS) cached = { at: Date.now(), health: await assistantHealth(process.env) };
  return Response.json(cached.health, {
    status: cached.health.ok ? 200 : 503,
    headers: { "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
