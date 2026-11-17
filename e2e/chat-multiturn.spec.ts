import { createAnthropic } from "@ai-sdk/anthropic";
import { expect, test } from "@playwright/test";
import { handleChat } from "../src/lib/ai/chat-handler";
import { fakeAnthropicFetch } from "../tests/fake-anthropic";
import { watchConsole } from "./helpers";

/*
 * A three-turn conversation in the real widget, answered by the real
 * /api/chat handler (src/lib/ai/chat-handler.ts) and the real Anthropic
 * provider. Only the Anthropic API itself is a stand-in
 * (tests/fake-anthropic.ts): it answers like Claude Opus 5.5 and refuses any
 * request the real API would refuse, so a broken follow-up turn fails here.
 * Needs a build with ANTHROPIC_API_KEY set (`ANTHROPIC_API_KEY=test npm run build`).
 */

test("answers a first question, a quick-reply tap and a typed follow-up", async ({ page }) => {
  const console = watchConsole(page);
  const api = { requests: [] as Record<string, unknown>[], rejected: [] as string[] };
  const model = createAnthropic({ apiKey: "test", fetch: fakeAnthropicFetch(api) as typeof fetch })("claude-opus-5-5");
  const turns: { roles: string[]; status: number }[] = [];
  await page.route("**/api/chat/", async (route) => {
    const body = route.request().postData() ?? "";
    const res = await handleChat(body, { env: {}, ip: "1", rateLimiter: { hit: () => true }, model, log: { info() {}, warn() {}, error() {} }, background: () => {} });
    turns.push({ roles: (JSON.parse(body) as { messages: { role: string }[] }).messages.map((m) => m.role), status: res.status });
    await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
  });

  await page.goto("/services/");
  const launcher = page.getByRole("button", { name: /Ask PermitGuys/ });
  test.skip((await launcher.count()) === 0, "The assistant is off in this build (no ANTHROPIC_API_KEY at build time).");
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Ask about your project" });
  const input = panel.getByLabel("Your question");

  // Turn 1: a typed question gets a reply, the scope card and quick replies.
  await input.fill("I want to remove a load-bearing wall in Toronto");
  await input.press("Enter");
  await expect(panel.getByText("needs a building permit and structural design")).toBeVisible();
  await expect(panel.getByRole("article", { name: "Project scope: Load-bearing wall removal" })).toBeVisible();
  const chip = panel.getByRole("list", { name: "Quick replies" }).getByRole("button", { name: "What drawings do I need?" });
  await expect(chip).toBeVisible();

  // Turn 2: tapping a quick reply sends the conversation so far and gets the second reply.
  await chip.click();
  await expect(panel.getByText("The scope card above lists the drawings")).toBeVisible();
  await expect(panel.getByRole("button", { name: "How do we get started and what does it cost?" })).toBeVisible();

  // Turn 3: a typed follow-up gets the closing card, and no price.
  await input.fill("How do we get started and what does it cost?");
  await input.press("Enter");
  await expect(panel.getByText("Final pricing and timelines are tailored by our senior permit team")).toBeVisible();
  await expect(panel.getByRole("article", { name: "Lock in your project" })).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveCount(0);

  expect(turns).toEqual([
    { roles: ["user"], status: 200 },
    { roles: ["user", "assistant", "user"], status: 200 },
    { roles: ["user", "assistant", "user", "assistant", "user"], status: 200 },
  ]);
  expect(api.rejected).toEqual([]);
  console.expectNone();
});

test("offers a retry when a reply fails, and the retry answers", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/chat/", async (route) => {
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 500, body: "unavailable" });
    const body = `data: ${JSON.stringify({ type: "start", messageId: "r1" })}\n\ndata: ${JSON.stringify({ type: "text-start", id: "t" })}\n\ndata: ${JSON.stringify({ type: "text-delta", id: "t", delta: "Back again: yes, a permit is needed." })}\n\ndata: ${JSON.stringify({ type: "text-end", id: "t" })}\n\ndata: ${JSON.stringify({ type: "finish" })}\n\ndata: [DONE]\n\n`;
    return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" }, body });
  });
  const logged: string[] = [];
  page.on("console", (m) => logged.push(m.text()));
  await page.goto("/services/");
  const launcher = page.getByRole("button", { name: /Ask PermitGuys/ });
  test.skip((await launcher.count()) === 0, "The assistant is off in this build (no ANTHROPIC_API_KEY at build time).");
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Ask about your project" });
  await panel.getByLabel("Your question").fill("Do I need a permit?");
  await panel.getByLabel("Your question").press("Enter");
  await expect(panel.getByRole("alert")).toContainText("couldn't reach our assistant");
  expect(logged.some((l) => l.includes("[advisor] reply failed: unavailable"))).toBe(true);
  await panel.getByRole("button", { name: "Try again" }).click();
  await expect(panel.getByText("Back again: yes, a permit is needed.")).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  expect(calls).toBe(2);
});
