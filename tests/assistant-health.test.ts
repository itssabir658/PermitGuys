import { describe, expect, it } from "vitest";
import { assistantHealth } from "@/lib/ai/health";

const answering = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;

describe("assistant health check", () => {
  it("reports a rejected key and undelivered leads, like production on 2026-11-24", async () => {
    const h = await assistantHealth({ ANTHROPIC_API_KEY: "revoked", VERCEL: "1" }, answering(401));
    expect(h).toMatchObject({ ok: false, anthropicKey: "rejected", backupRoute: "on", chatLeads: "none", inquiries: "none" });
  });

  it("is ok when the key works and both lead paths have a destination", async () => {
    const env = { ANTHROPIC_API_KEY: "k", RESEND_API_KEY: "r", INQUIRY_EMAIL_FROM: "PermitGuys <site@permitguys.ca>", INQUIRY_EMAIL_TO: "info@permitguys.ca" };
    const h = await assistantHealth(env, answering(200));
    expect(h).toMatchObject({ ok: true, anthropicKey: "ok", backupRoute: "off", chatLeads: "configured", inquiries: "configured" });
  });

  it("never returns the key", async () => {
    const h = await assistantHealth({ ANTHROPIC_API_KEY: "sk-ant-secret" }, answering(500));
    expect(JSON.stringify(h)).not.toContain("sk-ant");
    expect(h.anthropicKey).toBe("unreachable");
  });
});
