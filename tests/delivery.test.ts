import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { configuredDestinations, deliverLead, leadEmailText, resendDestination, webhookDestination, type Lead } from "@/lib/inquiry/delivery";

const lead: Lead = {
  id: "1f0c7a52-3b6e-4d4f-9b0a-2c1d5e6f7a8b",
  submittedAt: "2026-10-19T12:00:00.000Z",
  inquiry: {
    name: "Sam Lee",
    email: "sam@example.com",
    phone: "",
    preferredContact: "email",
    projectType: "Deck",
    municipality: "Toronto",
    stage: "",
    details: "Replace a raised rear deck.",
    consent: true,
  },
  attribution: { utm_source: "google" },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("webhook destination", () => {
  it("posts the lead as JSON and signs it when a secret is set", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const result = await webhookDestination("https://hooks.example.com/x", "s3cret", fetchImpl as unknown as typeof fetch).deliver(lead);
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://hooks.example.com/x");
    const body = init.body as string;
    expect(JSON.parse(body).contact.email).toBe("sam@example.com");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-permitguys-signature"]).toBe(`sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`);
    expect(headers["idempotency-key"]).toBe(lead.id);
  });

  it("fails on non-2xx responses and network errors", async () => {
    const http500 = vi.fn(async () => new Response("no", { status: 500 }));
    expect(await webhookDestination("https://h.example.com", undefined, http500 as unknown as typeof fetch).deliver(lead)).toMatchObject({ ok: false, reason: "HTTP 500" });
    const offline = vi.fn(async () => { throw new TypeError("fetch failed"); });
    expect((await webhookDestination("https://h.example.com", undefined, offline as unknown as typeof fetch).deliver(lead)).ok).toBe(false);
  });
});

describe("Resend destination", () => {
  const config = { apiKey: "re_test", from: "PermitGuys <inquiries@example.ca>", to: ["owner@example.ca"] };

  it("sends a plain-text email with reply-to set to the visitor", async () => {
    const fetchImpl = vi.fn(async () => json({ id: "email_123" }));
    const result = await resendDestination(config, fetchImpl as unknown as typeof fetch).deliver(lead);
    expect(result).toEqual({ ok: true, destination: "resend", reference: "email_123" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ from: config.from, to: config.to, reply_to: "sam@example.com", subject: "New inquiry: Deck, Toronto" });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test");
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(`inquiry-${lead.id}`);
  });

  it("only counts a response with a message id as delivered", async () => {
    const noId = vi.fn(async () => json({}));
    expect((await resendDestination(config, noId as unknown as typeof fetch).deliver(lead)).ok).toBe(false);
    const rejected = vi.fn(async () => json({ message: "domain not verified" }, 403));
    expect(await resendDestination(config, rejected as unknown as typeof fetch).deliver(lead)).toMatchObject({ ok: false, reason: "HTTP 403" });
  });

  it("keeps header-like text out of the subject", async () => {
    const fetchImpl = vi.fn(async () => json({ id: "x" }));
    await resendDestination(config, fetchImpl as unknown as typeof fetch).deliver({ ...lead, inquiry: { ...lead.inquiry, municipality: "Toronto\nBcc: a@b.c" } });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.subject).not.toMatch(/\n/);
  });

  it("writes every field into the email body", () => {
    const text = leadEmailText(lead);
    for (const s of ["Sam Lee", "sam@example.com", "Deck", "Toronto", "Replace a raised rear deck.", "utm_source: google", lead.id]) expect(text).toContain(s);
  });
});

describe("configuredDestinations", () => {
  it("is empty without environment variables", () => {
    expect(configuredDestinations({})).toEqual({ destinations: [], problems: [] });
  });

  it("enables each destination only when fully configured", () => {
    const both = configuredDestinations({
      INQUIRY_WEBHOOK_URL: "https://hooks.example.com/x",
      RESEND_API_KEY: "re_x",
      INQUIRY_EMAIL_FROM: "a@example.ca",
      INQUIRY_EMAIL_TO: "b@example.ca, c@example.ca",
    });
    expect(both.destinations.map((d) => d.name)).toEqual(["webhook", "resend"]);
    const partial = configuredDestinations({ RESEND_API_KEY: "re_x" });
    expect(partial.destinations).toHaveLength(0);
    expect(partial.problems[0]).toMatch(/INQUIRY_EMAIL_FROM/);
  });

  it("rejects non-https webhooks except on localhost", () => {
    expect(configuredDestinations({ INQUIRY_WEBHOOK_URL: "http://hooks.example.com" }).problems).toHaveLength(1);
    expect(configuredDestinations({ INQUIRY_WEBHOOK_URL: "http://localhost:4010/hook" }).destinations).toHaveLength(1);
  });
});

describe("deliverLead", () => {
  it("reports not_configured with no destinations", async () => {
    expect((await deliverLead(lead, [])).status).toBe("not_configured");
  });
});
