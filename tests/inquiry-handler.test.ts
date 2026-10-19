import { describe, expect, it, vi } from "vitest";
import { handleInquiry, type InquiryDeps } from "@/lib/inquiry/handle";
import type { LeadDestination } from "@/lib/inquiry/delivery";
import { HONEYPOT_FIELD, memoryDuplicateGuard, memoryRateLimiter } from "@/lib/inquiry/protection";

const NOW = 1_800_000_000_000;
const fields = {
  name: "Sam Lee",
  email: "sam@example.com",
  phone: "416 555 0100",
  preferredContact: "phone",
  municipality: "Mississauga",
  projectType: "Legal basement apartment",
  details: "Existing basement, want to make it a legal second unit.",
  consent: "on",
  submissionId: "1f0c7a52-3b6e-4d4f-9b0a-2c1d5e6f7a8b",
  startedAt: String(NOW - 60_000),
  attribution: JSON.stringify({ utm_source: "google", landing_page: "/services/legal-basement-permits/", evil: "x" }),
};

function form(overrides: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ ...fields, ...overrides })) f.set(k, v);
  return f;
}

function okDestination(name = "test"): LeadDestination & { deliver: ReturnType<typeof vi.fn> } {
  return { name, deliver: vi.fn(async () => ({ ok: true as const, destination: name })) };
}

function deps(overrides: Partial<InquiryDeps> = {}): InquiryDeps {
  return {
    env: {},
    ip: "203.0.113.5",
    rateLimiter: memoryRateLimiter({ max: 5, windowMs: 600_000, now: () => NOW }),
    duplicates: memoryDuplicateGuard({ ttlMs: 86_400_000, now: () => NOW }),
    now: () => NOW,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...overrides,
  };
}

describe("handleInquiry", () => {
  it("delivers a valid inquiry and returns a reference", async () => {
    const dest = okDestination();
    const result = await handleInquiry(form(), deps({ destinations: [dest] }));
    expect(result).toEqual({ status: "sent", reference: "1F0C7A52" });
    const lead = dest.deliver.mock.calls[0][0];
    expect(lead.inquiry.municipality).toBe("Mississauga");
    expect(lead.attribution).toEqual({ utm_source: "google", landing_page: "/services/legal-basement-permits/" });
    expect(lead.submittedAt).toBe(new Date(NOW).toISOString());
  });

  it("returns field errors without delivering", async () => {
    const dest = okDestination();
    const result = await handleInquiry(form({ email: "bad" }), deps({ destinations: [dest] }));
    expect(result.status).toBe("invalid");
    expect(dest.deliver).not.toHaveBeenCalled();
  });

  it("says the inquiry was not sent when no destination is configured", async () => {
    const d = deps();
    const result = await handleInquiry(form(), d);
    expect(result.status).toBe("not_configured");
    if (result.status === "not_configured") expect(result.values.email).toBe("sam@example.com");
    expect(d.log!.error).toHaveBeenCalled();
  });

  it("reports failure when every destination fails", async () => {
    const failing: LeadDestination = { name: "crm", deliver: async () => ({ ok: false, destination: "crm", reason: "HTTP 500" }) };
    expect((await handleInquiry(form(), deps({ destinations: [failing] }))).status).toBe("failed");
  });

  it("counts a lead as delivered when one of several destinations confirms", async () => {
    const failing: LeadDestination = { name: "crm", deliver: async () => { throw new Error("boom"); } };
    expect((await handleInquiry(form(), deps({ destinations: [failing, okDestination()] }))).status).toBe("sent");
  });

  it("blocks the honeypot and too-fast submissions without claiming success", async () => {
    const dest = okDestination();
    expect((await handleInquiry(form({ [HONEYPOT_FIELD]: "http://spam" }), deps({ destinations: [dest] }))).status).toBe("blocked");
    expect((await handleInquiry(form({ startedAt: String(NOW - 500) }), deps({ destinations: [dest] }))).status).toBe("blocked");
    expect(dest.deliver).not.toHaveBeenCalled();
  });

  it("accepts submissions without a start time (no JavaScript)", async () => {
    expect((await handleInquiry(form({ startedAt: "" }), deps({ destinations: [okDestination()] }))).status).toBe("sent");
  });

  it("does not deliver the same submission twice", async () => {
    const dest = okDestination();
    const d = deps({ destinations: [dest] });
    await handleInquiry(form(), d);
    const again = await handleInquiry(form(), d);
    expect(again.status).toBe("sent");
    expect(dest.deliver).toHaveBeenCalledTimes(1);
  });

  it("rate limits repeated submissions from one address", async () => {
    const dest = okDestination();
    const d = deps({ destinations: [dest], rateLimiter: memoryRateLimiter({ max: 2, windowMs: 600_000, now: () => NOW }) });
    const ids = ["aaaaaaaa-1", "aaaaaaaa-2", "aaaaaaaa-3"];
    const results = [];
    for (const id of ids) results.push((await handleInquiry(form({ submissionId: id }), d)).status);
    expect(results).toEqual(["sent", "sent", "rate_limited"]);
  });

  it("checks Turnstile when a secret is configured", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false })));
    const d = deps({ env: { TURNSTILE_SECRET_KEY: "secret" }, destinations: [okDestination()], fetchImpl: fetchImpl as unknown as typeof fetch });
    expect((await handleInquiry(form({ "cf-turnstile-response": "token" }), d)).status).toBe("blocked");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("never logs the visitor's personal details", async () => {
    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    await handleInquiry(form(), deps({ destinations: [okDestination()], log }));
    await handleInquiry(form({ submissionId: "bbbbbbbb-1" }), deps({ log }));
    const logged = JSON.stringify([log.info.mock.calls, log.warn.mock.calls, log.error.mock.calls]);
    for (const secret of ["Sam Lee", "sam@example.com", "416 555 0100", "Existing basement"]) expect(logged).not.toContain(secret);
  });
});
