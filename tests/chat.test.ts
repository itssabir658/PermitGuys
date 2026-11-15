import { describe, expect, it } from "vitest";
import { chatConfigured, chatSettings, DEFAULT_CHAT_MODEL } from "@/lib/chat/config";
import { HANDOFF_TOOL, handoffTool, sanitizeHandoff } from "@/lib/chat/handoff";
import { staticSystemPrompt } from "@/lib/ai/system-prompt";
import { gtaPermits, officialHosts, ontarioPermitFacts } from "@/content/gta-permits";
import { projectStages, projectTypes } from "@/lib/validation/inquiry";

const env = { ANTHROPIC_API_KEY: "test-key" };

describe("hand-off to the inquiry form", () => {
  it("keeps only values the form accepts", () => {
    expect(
      sanitizeHandoff({ projectType: "Deck", municipality: " Oakville\n", stage: "Ready for drawings", details: "A 12 by 16 foot deck off the kitchen." }),
    ).toEqual({ projectType: "Deck", municipality: "Oakville", stage: "Ready for drawings", details: "A 12 by 16 foot deck off the kitchen." });
    expect(sanitizeHandoff({ projectType: "Spaceport", municipality: "Toronto", stage: "Tomorrow", details: "x" })).toEqual({
      projectType: "Something else",
      municipality: "Toronto",
      stage: "",
      details: "x",
    });
  });

  it("reads browser storage safely", () => {
    expect(sanitizeHandoff('{"projectType":"Custom home","details":"New build"}')?.projectType).toBe("Custom home");
    expect(sanitizeHandoff("not json")).toBeNull();
    expect(sanitizeHandoff("")).toBeNull();
    expect(sanitizeHandoff({})).toBeNull();
  });

  it("offers the model exactly the form's project types and stages", () => {
    expect(handoffTool.name).toBe(HANDOFF_TOOL);
    expect(handoffTool.input_schema.properties.projectType.enum).toEqual(projectTypes.map((t) => t.label));
    expect(handoffTool.input_schema.properties.stage.enum).toEqual([...projectStages, ""]);
  });
});

describe("GTA permit reference", () => {
  const all = [ontarioPermitFacts, ...gtaPermits];

  it("cites an official https page for every entry", () => {
    for (const entry of all) {
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const s of entry.sources) expect(s.url).toMatch(/^https:\/\/[^/]*(ontario\.ca|oaa\.on\.ca|trca\.ca|toronto\.ca|mississauga\.ca|brampton\.ca|caledon\.ca|oakville\.ca|burlington\.ca|milton\.ca|haltonhills\.ca|vaughan\.ca|markham\.ca|richmondhill\.ca|aurora\.ca|newmarket\.ca|pickering\.ca|ajax\.ca|whitby\.ca|oshawa\.ca)\//);
    }
    expect(officialHosts).toContain("toronto.ca");
  });

  it("quotes no fees, and the municipalities are unique", () => {
    for (const entry of all) for (const f of entry.facts) expect(f).not.toMatch(/\$\s?\d/);
    const names = gtaPermits.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("is in the assistant's knowledge with the rule to cite it", () => {
    const prompt = staticSystemPrompt();
    expect(prompt).toContain("### Toronto (City of Toronto)");
    expect(prompt).toContain("https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/when-do-i-need-a-building-permit/");
    expect(prompt).toMatch(/say it is what that government's website says, link it/);
    expect(prompt).toMatch(/Knowing a municipality's rules is not the same as working there/);
  });
});

describe("settings", () => {
  it("is off without a key and defaults to the current Opus", () => {
    expect(chatConfigured({})).toBe(false);
    expect(chatConfigured(env)).toBe(true);
    expect(chatSettings({}).model).toBe(DEFAULT_CHAT_MODEL);
    expect(chatSettings({ CHAT_MODEL: "claude-sonnet-5-5" }).model).toBe("claude-sonnet-5-5");
    expect(chatSettings({ CHAT_RATE_LIMIT_MAX: "-3" }).rateLimitMax).toBe(30);
  });
});
