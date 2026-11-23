import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, watchConsole } from "./helpers";

/*
 * The permit strategist. It is built into the pages only when
 * ANTHROPIC_API_KEY is set at build time, so these tests skip otherwise
 * (`ANTHROPIC_API_KEY=test npm run build`). /api/chat is mocked with AI SDK
 * UI message streams: no request reaches Anthropic. /api/lead runs for real
 * against the mock webhook in playwright.config.ts.
 */

type Chunk = Record<string, unknown>;
const stream = (...chunks: Chunk[]) =>
  [{ type: "start", messageId: `m${Math.random().toString(36).slice(2)}` }, ...chunks, { type: "finish" }].map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
const text = (t: string, id = "t1"): Chunk[] => [
  { type: "text-start", id },
  { type: "text-delta", id, delta: t },
  { type: "text-end", id },
];
const toolCall = (toolName: string, input: unknown, output: unknown, toolCallId = `call_${toolName}`): Chunk[] => [
  { type: "tool-input-available", toolCallId, toolName, input },
  { type: "tool-output-available", toolCallId, output },
];

async function mockChat(page: Page, ...bodies: string[]) {
  const sent: { messages: { role: string; parts: { type: string; text?: string }[] }[]; snapshot: Record<string, unknown>; sessionId: string }[] = [];
  await page.route("**/api/chat/", async (route) => {
    sent.push(route.request().postDataJSON());
    const body = bodies[Math.min(sent.length - 1, bodies.length - 1)];
    await route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" }, body });
  });
  return sent;
}

async function openAssistant(page: Page, path = "/services/") {
  await page.goto(path);
  const launcher = page.getByRole("button", { name: /Ask PermitGuys/ });
  // The assistant is fetched once the page has opened (PermitAdvisorLazy.tsx).
  await launcher.waitFor({ timeout: 12_000 }).catch(() => undefined);
  test.skip((await launcher.count()) === 0, "The assistant is off in this build (no ANTHROPIC_API_KEY at build time).");
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Ask about your project" });
  await expect(panel).toBeVisible();
  return panel;
}

const scopeInput = { projectType: "deck", municipality: "Toronto", estimatedSqFt: 200, structuralChanges: false, stage: "Ready for drawings", summary: "A raised deck off the kitchen." };
const scopeOutput = {
  projectType: "deck",
  projectLabel: "Deck",
  municipality: "Toronto",
  summary: "A raised deck off the kitchen.",
  stage: "Ready for drawings",
  estimatedSqFt: 200,
  structuralChanges: false,
  servicePage: "/services/deck-permits/",
  drawingIntro: "Deck applications commonly include items such as:",
  drawings: [
    { discipline: "Site", items: ["A site plan showing the deck, the house and property lines."] },
    { discipline: "Structural", items: ["A framing plan with joist, beam and post sizes."] },
  ],
  qualifier: "Your local building department makes the final determination.",
  draftingTurnaround: "Custom fixed-fee quote & exact timeline prepared directly by PermitGuys upon handoff.",
  cityReview: { window: "10 business days for a complete application (City of Toronto, houses)", note: "The clock starts once the application is complete.", source: "", page: "/permit-guides/permit-costs-and-timelines/" },
  recommendedPackage: "Scope review and custom quote",
  timelineFactors: [],
  considerations: [],
  serviceArea: "to-confirm",
  municipalityReference: null,
};

test.describe("permit strategist", () => {
  test("answers with links, sends the visit with the message, and offers quick replies", async ({ page }) => {
    const console = watchConsole(page);
    const sent = await mockChat(
      page,
      stream(
        ...text("Most decks need a permit. Our [deck permits page](/services/deck-permits/) explains more."),
        ...toolCall("suggestReplies", { replies: ["Mine is 1 m high", "Scope my deck"] }, { replies: ["Mine is 1 m high", "Scope my deck"] }),
      ),
    );
    const panel = await openAssistant(page, "/services/deck-permits/");
    await expect(panel.getByLabel("Your question")).toBeFocused();
    await panel.getByRole("button", { name: "Do I need a permit for my deck?" }).click();
    await expect(panel.getByRole("link", { name: "deck permits page" })).toHaveAttribute("href", "/services/deck-permits/");
    await expect(panel.getByRole("button", { name: "Scope my deck" })).toBeVisible();
    expect(sent[0].messages[0].parts).toEqual([{ type: "text", text: "Do I need a permit for my deck?" }]);
    expect(sent[0].snapshot.currentPath).toBe("/services/deck-permits/");
    expect(sent[0].snapshot.pagesViewed).toContain("/services/deck-permits/");
    await expectNoHorizontalOverflow(page);
    const results = await new AxeBuilder({ page }).include("#pg-chat").analyze();
    expect(results.violations).toEqual([]);
    console.expectNone();
  });

  test("links official GTA sources in a new tab, and nothing else from the web", async ({ page }) => {
    await mockChat(
      page,
      stream(
        ...text(
          "Toronto's website says decks more than 60 cm above ground need a permit: [when do I need a building permit?](https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/when-do-i-need-a-building-permit/) Also see [this blog](https://example.com/permits).",
        ),
      ),
    );
    const panel = await openAssistant(page);
    await panel.getByLabel("Your question").fill("Deck in Toronto?");
    await panel.getByLabel("Your question").press("Enter");
    const official = panel.getByRole("link", { name: /when do I need a building permit/ });
    await expect(official).toHaveAttribute("target", "_blank");
    await expect(official).toHaveAttribute("rel", "noopener noreferrer");
    await expect(panel.getByText("this blog", { exact: false })).toBeVisible();
    await expect(panel.getByRole("link", { name: "this blog" })).toHaveCount(0);
  });

  test("shows the scope card and sends the visitor's request from it", async ({ page }) => {
    await mockChat(page, stream(...toolCall("generateProjectScope", scopeInput, scopeOutput), ...text("Here is your scope.", "t2")));
    const panel = await openAssistant(page, "/services/deck-permits/");
    await panel.getByLabel("Your question").fill("A raised deck in Toronto, ready for drawings");
    await panel.getByLabel("Your question").press("Enter");
    const sheet = panel.getByRole("article", { name: "Project scope: Deck" });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("A framing plan with joist, beam and post sizes.");
    await expect(sheet).toContainText("10 business days");
    await sheet.getByRole("button", { name: "Lock in this scope and get your quote" }).click();

    const closer = panel.getByRole("article", { name: "Lock in your project" });
    await expect(closer).toBeVisible();
    await expect(closer.getByLabel("Town or city")).toHaveValue("Toronto");
    await expect(closer).toContainText("Custom fixed-fee quote & exact timeline prepared directly by PermitGuys upon handoff.");
    await expect(closer.getByRole("link", { name: "Message Scope on WhatsApp", exact: true })).toHaveAttribute("href", /^https:\/\/wa\.me\/16479686284\?text=/);
    await closer.getByLabel("Name").fill("Sam Visitor");
    await closer.getByLabel("Phone").fill("416 555 0100");
    await closer.getByLabel("Email").fill("sam@example.com");
    await closer.getByRole("checkbox").check();
    const lead = page.waitForRequest("**/api/lead/");
    await closer.getByRole("button", { name: "Lock in my scope and quote" }).click();
    const body = (await lead).postDataJSON();
    expect(body.project).toMatchObject({ projectType: "deck", municipality: "Toronto" });
    expect(body.scopeInput).toMatchObject({ projectType: "deck" });
    expect(body.transcript[0]).toEqual({ role: "visitor", text: "A raised deck in Toronto, ready for drawings" });
    expect(body.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    await expect(panel.getByRole("status")).toContainText("Your reference is");
    await expect(panel.getByRole("status").getByRole("link", { name: /Message Scope on WhatsApp/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // A closed lead: closing the chat sends no possible-lead summary.
    const summaries: unknown[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/chat/session-summary/")) summaries.push(r.postDataJSON());
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    expect(summaries).toEqual([]);
  });

  test("a conversation the visitor walks away from is summarized for the team once", async ({ page }) => {
    const sent = await mockChat(page, stream(...text("Most decks need a permit. Our senior permit team tailors pricing and timelines.")));
    const summaries: Record<string, unknown>[] = [];
    await page.route("**/api/chat/session-summary/", async (route) => {
      summaries.push(route.request().postDataJSON());
      await route.fulfill({ status: 202 });
    });
    const panel = await openAssistant(page, "/services/deck-permits/");
    await expect(panel).toContainText("shared with the PermitGuys team");
    await panel.getByLabel("Your question").fill("How much is a deck permit in Whitby?");
    await panel.getByLabel("Your question").press("Enter");
    await expect(panel.getByText("Most decks need a permit.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect.poll(() => summaries.length).toBe(1);
    expect(summaries[0]).toMatchObject({
      sessionId: sent[0].sessionId,
      reason: "chat_closed",
      messageCount: 2,
      messages: [
        { role: "visitor", text: "How much is a deck permit in Whitby?" },
        { role: "assistant", text: "Most decks need a permit. Our senior permit team tailors pricing and timelines." },
      ],
    });
    expect((summaries[0].visitorSnapshot as { currentPath: string }).currentPath).toBe("/services/deck-permits/");

    // Nothing new since: opening and closing again, or hiding the page, sends nothing more.
    await page.getByRole("button", { name: /Ask PermitGuys/ }).click();
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
    await page.waitForTimeout(500);
    expect(summaries).toHaveLength(1);
  });

  test("explains a failure and offers the phone and form", async ({ page }) => {
    await page.route("**/api/chat/", (route) => route.fulfill({ status: 429, body: "rate_limited" }));
    const panel = await openAssistant(page);
    await panel.getByLabel("Your question").fill("Hello");
    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("alert")).toContainText("a lot of messages");
    await expect(panel.getByRole("link", { name: "send an inquiry" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: /Ask PermitGuys/ })).toBeFocused();
  });

  test("the homepage showcase puts the visitor's question to the assistant", async ({ page }) => {
    const console = watchConsole(page);
    const sent = await mockChat(page, stream(...text("Usually, yes. Sheds over a certain size need one.")));
    await page.goto("/");
    const field = page.getByLabel("Your question for the PermitGuys assistant");
    test.skip((await field.count()) === 0, "The assistant is off in this build (no ANTHROPIC_API_KEY at build time).");
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeVisible();
    await page.waitForFunction(() => [...document.querySelectorAll("[data-ask] .ask-rise")].every((el) => getComputedStyle(el).opacity === "1"));
    const results = await new AxeBuilder({ page }).include("[data-ask]").analyze();
    expect(results.violations).toEqual([]);
    await expectNoHorizontalOverflow(page);

    await field.fill("Do I need a permit for a shed?");
    await field.press("Enter");
    const panel = page.getByRole("dialog", { name: "Ask about your project" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Usually, yes.")).toBeVisible();
    expect(sent[0].messages.map((m) => m.parts[0].text)).toEqual(["Do I need a permit for a shed?"]);
    expect(sent[0].snapshot.currentPath).toBe("/");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(field).toBeFocused();
    console.expectNone();
  });
});
