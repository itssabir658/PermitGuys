import { describe, expect, it } from "vitest";
import { clientIp, isValidSubmissionId, memoryDuplicateGuard, memoryRateLimiter, submittedTooFast } from "@/lib/inquiry/protection";
import { nextAttribution, sanitizeAttribution } from "@/lib/inquiry/attribution";

describe("rate limiter", () => {
  it("allows max hits per window, then recovers", () => {
    let t = 0;
    const rl = memoryRateLimiter({ max: 2, windowMs: 1000, now: () => t });
    expect([rl.hit("a"), rl.hit("a"), rl.hit("a"), rl.hit("b")]).toEqual([true, true, false, true]);
    t = 1001;
    expect(rl.hit("a")).toBe(true);
  });
});

describe("duplicate guard", () => {
  it("forgets ids after the TTL", () => {
    let t = 0;
    const g = memoryDuplicateGuard({ ttlMs: 100, now: () => t });
    g.add("x");
    expect(g.has("x")).toBe(true);
    t = 101;
    expect(g.has("x")).toBe(false);
  });
});

describe("time trap and helpers", () => {
  it("flags fast, future and malformed timestamps", () => {
    expect(submittedTooFast(String(10_000 - 1000), 3000, 10_000)).toBe(true);
    expect(submittedTooFast(String(10_000 - 5000), 3000, 10_000)).toBe(false);
    expect(submittedTooFast(String(20_000), 3000, 10_000)).toBe(true);
    expect(submittedTooFast("abc", 3000, 10_000)).toBe(true);
    expect(submittedTooFast(undefined, 3000, 10_000)).toBe(false);
  });

  it("validates submission ids", () => {
    expect(isValidSubmissionId("1f0c7a52-3b6e-4d4f-9b0a-2c1d5e6f7a8b")).toBe(true);
    expect(isValidSubmissionId("<script>")).toBe(false);
    expect(isValidSubmissionId(undefined)).toBe(false);
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }))).toBe("203.0.113.1");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("attribution", () => {
  it("keeps known keys only, trimmed and bounded", () => {
    expect(sanitizeAttribution(JSON.stringify({ utm_source: " google ", password: "x", gclid: "a".repeat(500) }))).toEqual({
      utm_source: "google",
      gclid: "a".repeat(200),
    });
    expect(sanitizeAttribution("not json")).toEqual({});
    expect(sanitizeAttribution([1, 2])).toEqual({});
  });

  it("records the first landing page and the referring host only", () => {
    const a = nextAttribution(new URL("https://site.ca/services/deck-permits/?utm_source=news&x=1"), "https://www.google.com/search?q=private", null);
    expect(a).toEqual({ utm_source: "news", referrer_host: "www.google.com", landing_page: "/services/deck-permits/" });
  });

  it("keeps the first touch unless new campaign tags arrive", () => {
    const existing = { landing_page: "/" };
    expect(nextAttribution(new URL("https://site.ca/contact/"), "https://site.ca/", existing)).toBeNull();
    expect(nextAttribution(new URL("https://site.ca/?utm_campaign=spring"), "", existing)).toEqual({ utm_campaign: "spring", landing_page: "/" });
  });
});
