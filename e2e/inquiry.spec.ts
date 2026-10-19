import { expect, test, type Page } from "@playwright/test";
import { watchConsole } from "./helpers";

const WEBHOOK = "http://localhost:4010";

async function fill(page: Page, name: string) {
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("textbox", { name: "Email" }).fill("homeowner@example.com");
  await page.getByLabel("Project type").selectOption("Legal basement apartment");
  await page.getByLabel("Municipality or project location").fill("Brampton");
  await page.getByLabel("Tell us about your project").fill("We want to turn our finished basement into a legal second unit.");
  await page.getByLabel(/may use these details to contact me/).check();
}

test.describe("project inquiry form", () => {
  test("shows an error summary that links to each problem", async ({ page }) => {
    const console = watchConsole(page);
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    const summary = page.getByRole("heading", { name: /are \d problems with your inquiry/ });
    await expect(summary).toBeVisible();
    await expect(page.locator("#error-summary-title").locator("..")).toBeFocused();
    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await page.getByRole("link", { name: "Enter your email address." }).click();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
    console.expectNone();
  });

  test("requires a phone number when phone is preferred", async ({ page }) => {
    await page.goto("/contact/");
    await fill(page, "Pat Phone");
    await page.getByLabel("Phone", { exact: true }).check();
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByText("Enter a phone number, or choose email as your preferred contact method.").first()).toBeVisible();
  });

  test("delivers a valid inquiry with attribution and confirms it", async ({ page }) => {
    const console = watchConsole(page);
    const name = `Riley Success ${test.info().project.name}`;
    await page.goto("/services/legal-basement-permits/?utm_source=e2e&utm_campaign=launch");
    // Attribution is stored after hydration; wait for it before moving on.
    await page.waitForFunction(() => sessionStorage.getItem("pg_attribution")?.includes("e2e"));
    await page.goto("/contact/?service=legal-basement-permits");
    await expect(page.getByLabel("Project type")).toHaveValue("Legal basement apartment");
    await fill(page, name);
    await page.getByRole("button", { name: "Send inquiry" }).click();
    const heading = page.getByRole("heading", { name: "Thank you. Your inquiry has been sent." });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByText(/Your reference is [0-9A-F]{8}/)).toBeVisible();

    const lead = await (await page.request.get(`${WEBHOOK}/leads?name=${encodeURIComponent(name)}`)).json();
    expect(lead).toMatchObject({
      contact: { name, email: "homeowner@example.com", preferredContact: "email", phone: null },
      project: { type: "Legal basement apartment", municipality: "Brampton" },
      attribution: { utm_source: "e2e", utm_campaign: "launch", landing_page: "/services/legal-basement-permits/", cta_service: "legal-basement-permits" },
    });
    console.expectNone();
  });

  test("keeps the visitor's details and says so when delivery fails", async ({ page }) => {
    await page.goto("/contact/");
    await fill(page, "Fail Case");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Your inquiry was not sent." });
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(page.getByLabel("Your name")).toHaveValue("Fail Case");
    await expect(page.getByLabel("Tell us about your project")).toHaveValue(/legal second unit/);
    await expect(page.getByLabel(/may use these details to contact me/)).toBeChecked();
    await expect(page.getByRole("button", { name: "Send inquiry" })).toBeEnabled();
  });

  test("disables the button while sending to prevent duplicates", async ({ page }) => {
    await page.goto("/contact/");
    await fill(page, `Dana Double ${test.info().project.name}`);
    await page.route("**/contact/**", async (route) => {
      if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "Thank you. Your inquiry has been sent." })).toBeVisible();
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/contact/");
    await expect(page.getByLabel("Your name")).toBeVisible();
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByText("Enter your name.").first()).toBeVisible();
    await context.close();
  });
});
