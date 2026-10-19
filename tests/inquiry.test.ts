import { describe, expect, it } from "vitest";
import { parseInquiry, projectTypeForService, projectTypes, validateInquiry } from "@/lib/validation/inquiry";
import { services } from "@/content/services";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = {
  name: "Sam Lee",
  email: "Sam@Example.com",
  phone: "",
  preferredContact: "email",
  municipality: "Toronto",
  projectType: "Deck",
  stage: "",
  details: "We want to replace our raised rear deck this spring.",
  consent: "on",
};

describe("validateInquiry", () => {
  it("accepts a complete inquiry and normalizes it", () => {
    const r = parseInquiry(form({ ...valid, name: "  Sam   Lee " }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("Sam Lee");
      expect(r.value.email).toBe("sam@example.com");
      expect(r.value.stage).toBe("");
    }
  });

  it("reports each missing or invalid field and keeps the values", () => {
    const r = parseInquiry(form({ ...valid, email: "nope", details: "short", consent: "", projectType: "Castle", municipality: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(["consent", "details", "email", "municipality", "projectType"]);
      expect(r.values.email).toBe("nope");
    }
  });

  it("validates an optional phone only when given", () => {
    expect(parseInquiry(form({ ...valid, phone: "416-555-0100" })).ok).toBe(true);
    expect(parseInquiry(form({ ...valid, phone: "+1 (905) 555-0100" })).ok).toBe(true);
    expect(parseInquiry(form({ ...valid, phone: "call me" })).ok).toBe(false);
    expect(parseInquiry(form({ ...valid, phone: "555-0100" })).ok).toBe(false);
  });

  it("requires a phone number when phone is the preferred contact method", () => {
    const r = parseInquiry(form({ ...valid, preferredContact: "phone" }));
    expect(!r.ok && r.errors.phone).toMatch(/phone number/);
    expect(parseInquiry(form({ ...valid, preferredContact: "phone", phone: "416 555 0100" })).ok).toBe(true);
    expect(parseInquiry(form({ ...valid, preferredContact: "fax" })).ok).toBe(false);
  });

  it("rejects an unknown project stage but allows none", () => {
    expect(parseInquiry(form({ ...valid, stage: "Ready for drawings" })).ok).toBe(true);
    expect(parseInquiry(form({ ...valid, stage: "Finished" })).ok).toBe(false);
  });

  it("enforces length limits", () => {
    expect(parseInquiry(form({ ...valid, details: "x".repeat(4001) })).ok).toBe(false);
    expect(parseInquiry(form({ ...valid, name: "x".repeat(121) })).ok).toBe(false);
  });

  it("strips control characters", () => {
    const r = validateInquiry({ ...valid, municipality: "Toronto\r\nBcc: x@y.z" });
    expect(r.ok && r.value.municipality).toBe("Toronto Bcc: x@y.z");
  });
});

describe("project types", () => {
  it("map to real service pages", () => {
    const slugs = new Set(services.map((s) => s.slug));
    for (const t of projectTypes) if (t.service) expect(slugs.has(t.service)).toBe(true);
  });

  it("preselect from a service slug", () => {
    expect(projectTypeForService("deck-permits")).toBe("Deck");
    expect(projectTypeForService("unknown")).toBeUndefined();
    expect(projectTypeForService(null)).toBeUndefined();
  });
});
