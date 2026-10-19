import { describe, expect, it } from "vitest";
import { absoluteUrl, paths } from "@/lib/routes";

describe("routes", () => {
  it("uses trailing slashes everywhere", () => {
    const all = [paths.home, paths.about, paths.services, paths.service("x"), paths.guide("y"), paths.serviceArea("z"), paths.project("p")];
    for (const p of all) expect(p.endsWith("/")).toBe(true);
  });

  it("builds absolute URLs against the origin", () => {
    expect(absoluteUrl("/services/", "https://example.ca")).toBe("https://example.ca/services/");
    expect(absoluteUrl("/", "https://example.ca/")).toBe("https://example.ca/");
  });
});
