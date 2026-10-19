import { describe, expect, it } from "vitest";
import { parseInquiry } from "@/lib/validation/inquiry";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = {
  name: "Sam Lee",
  email: "sam@example.com",
  phone: "",
  municipality: "Toronto",
  projectType: "Deck",
  stage: "Just exploring",
  details: "We want to replace our raised rear deck this spring.",
  consent: "on",
};

describe("parseInquiry", () => {
  it("accepts a complete inquiry", () => {
    const r = parseInquiry(form(valid));
    expect(r.ok).toBe(true);
  });

  it("reports each missing or invalid field", () => {
    const r = parseInquiry(form({ ...valid, email: "nope", details: "short", consent: "", projectType: "Castle" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(["consent", "details", "email", "projectType"]);
      expect(r.values.email).toBe("nope");
    }
  });

  it("validates an optional phone only when given", () => {
    expect(parseInquiry(form({ ...valid, phone: "416-555-0100" })).ok).toBe(true);
    expect(parseInquiry(form({ ...valid, phone: "call me" })).ok).toBe(false);
  });
});
