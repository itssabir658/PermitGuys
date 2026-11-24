import { chatConfigured, chatSettings } from "@/lib/chat/config";
import { configuredDestinations } from "@/lib/inquiry/delivery";
import { ownerNotifyConfig } from "./notify-owners";

/*
 * A cheap check of everything the assistant and the lead forms depend on,
 * for GET /api/chat/health/ (and an uptime monitor). The Anthropic key is
 * checked with the free model-list endpoint, so no tokens are spent. Only
 * status words are returned, never a key, an address or an error body.
 */

type Env = Record<string, string | undefined>;

export type KeyStatus = "ok" | "missing" | "rejected" | "unreachable";

export interface AssistantHealth {
  ok: boolean;
  anthropicKey: KeyStatus;
  backupRoute: "on" | "off";
  /** Where chat leads and contact-form inquiries go. "none" means they are not delivered. */
  chatLeads: "configured" | "none";
  inquiries: "configured" | "none";
  checkedAt: string;
}

export async function checkAnthropicKey(env: Env, fetchImpl: typeof fetch = fetch): Promise<KeyStatus> {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) return "missing";
  try {
    const res = await fetchImpl("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 || res.status === 403) return "rejected";
    return res.ok ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export async function assistantHealth(env: Env, fetchImpl: typeof fetch = fetch): Promise<AssistantHealth> {
  const anthropicKey = chatConfigured(env) ? await checkAnthropicKey(env, fetchImpl) : "missing";
  const owners = ownerNotifyConfig(env);
  const chatLeads = owners.resend || owners.webhook || owners.whatsapp ? "configured" : "none";
  const inquiries = configuredDestinations(env).destinations.length ? "configured" : "none";
  return {
    ok: anthropicKey === "ok" && chatLeads === "configured" && inquiries === "configured",
    anthropicKey,
    backupRoute: chatSettings(env).backup ? "on" : "off",
    chatLeads,
    inquiries,
    checkedAt: new Date().toISOString(),
  };
}
