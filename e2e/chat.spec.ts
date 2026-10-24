import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, watchConsole } from "./helpers";

/*
 * The website assistant. It is built into the pages only when
 * ANTHROPIC_API_KEY is set at build time, so these tests skip otherwise
 * (`ANTHROPIC_API_KEY=test npm run build`). The API route is mocked: no
 * request reaches Anthropic.
 */

const lines = (...events: object[]) => events.map((e) => JSON.stringify(e)).join("\n") + "\n";

async function mockChat(page: Page, body: string) {
  const sent: unknown[] = [];
  await page.route("**/api/chat/", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body });
  });
  return sent;
}

async function openAssistant(page: Page, path = "/services/") {
  await page.goto(path);
  const launcher = page.getByRole("button", { name: "Ask PermitGuys" });
  test.skip((await launcher.count()) === 0, "The assistant is off in this build (no ANTHROPIC_API_KEY at build time).");
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Ask about your project" });
  await expect(panel).toBeVisible();
  return panel;
}

test.describe("website assistant", () => {
  test("answers a suggested question with links to the site", async ({ page }) => {
    const console = watchConsole(page);
    const sent = await mockChat(
      page,
      lines(
        { type: "text", text: "Most decks need a permit. Our " },
        { type: "text", text: "[deck permits page](/services/deck-permits/) explains more." },
        { type: "done" },
      ),
    );
    const panel = await openAssistant(page);
    await expect(panel.getByLabel("Your question")).toBeFocused();
    await panel.getByRole("button", { name: "Do I need a permit for a deck?" }).click();
    await expect(panel.getByRole("link", { name: "deck permits page" })).toHaveAttribute("href", "/services/deck-permits/");
    expect(sent).toEqual([{ messages: [{ role: "user", content: "Do I need a permit for a deck?" }] }]);
    await expectNoHorizontalOverflow(page);
    const results = await new AxeBuilder({ page }).include("#pg-chat").analyze();
    expect(results.violations).toEqual([]);
    console.expectNone();
  });

  test("hands the project over to the inquiry form", async ({ page }) => {
    await mockChat(
      page,
      lines(
        { type: "text", text: "I've filled in the inquiry form with your project details." },
        {
          type: "handoff",
          handoff: {
            projectType: "Residential addition",
            municipality: "Oakville",
            stage: "Planning and budgeting",
            details: "We want to add a second storey over our bungalow.",
          },
        },
        { type: "done" },
      ),
    );
    const panel = await openAssistant(page);
    await panel.getByLabel("Your question").fill("Can someone help with my second-storey addition in Oakville?");
    await panel.getByLabel("Your question").press("Enter");
    await panel.getByRole("link", { name: "Review and send" }).click();
    await expect(page).toHaveURL(/\/contact\/\?from=chat$/);
    await expect(page.getByLabel("Project type")).toHaveValue("Residential addition");
    await expect(page.getByLabel("Municipality or project location")).toHaveValue("Oakville");
    await expect(page.getByLabel("Where are you in the project?")).toHaveValue("Planning and budgeting");
    await expect(page.getByLabel("Tell us about your project")).toHaveValue("We want to add a second storey over our bungalow.");
  });

  test("explains a failure and offers the phone and form", async ({ page }) => {
    await mockChat(page, lines({ type: "error", reason: "unavailable" }));
    const panel = await openAssistant(page);
    await panel.getByLabel("Your question").fill("Hello");
    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("alert")).toContainText("couldn't reach our assistant");
    await expect(panel.getByRole("link", { name: "send an inquiry" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: "Ask PermitGuys" })).toBeFocused();
  });
});
