/** Shared by the assistant's lead tests: settings for both channels, and a fetch that records what was sent. */

export const SESSION = "5e3c1d2a-9b8f-4a7e-8d6c-1f2e3d4c5b6a";

export const LEAD_ENV = {
  RESEND_API_KEY: "re_test",
  RESEND_FROM_EMAIL: "Assistant <ai@permitguys.test>",
  LEAD_NOTIFICATION_EMAIL: "team@permitguys.test",
  LEAD_WEBHOOK_URL: "https://hooks.permitguys.test/leads",
};

type Sent = { url: string; headers: Record<string, string>; body: Record<string, unknown> };

export function fakeFetch() {
  const sent: Sent[] = [];
  const fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    sent.push({ url: String(url), headers: (init?.headers ?? {}) as Record<string, string>, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return String(url).includes("resend") ? Response.json({ id: `email_${sent.length}` }) : new Response(null, { status: 200 });
  }) as typeof globalThis.fetch;
  return {
    fetch,
    sent,
    emails: () => sent.filter((s) => s.url.includes("resend")).map((s) => s.body as { to: string[]; from: string; subject: string; text: string; reply_to?: string }),
    webhooks: () => sent.filter((s) => !s.url.includes("resend")).map((s) => s.body),
  };
}
