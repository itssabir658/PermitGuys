import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, sitemapPaths, watchConsole } from "./helpers";

test.describe("every page", () => {
  test("loads without errors or sideways scrolling", async ({ page }) => {
    const console = watchConsole(page);
    const paths = [...(await sitemapPaths(page)), "/projects/"];
    expect(paths.length).toBeGreaterThan(15);
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
    console.expectNone();
  });

  test("returns a helpful 404 for unknown URLs", async ({ page }) => {
    const res = await page.goto("/services/not-a-real-service/");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We could not find that page.");
    await expect(page.getByRole("link", { name: "Go to the homepage" })).toBeVisible();
  });
});

test.describe("accessibility", () => {
  const pages = ["/", "/services/", "/services/legal-basement-permits/", "/permit-guides/permit-costs-and-timelines/", "/how-it-works/", "/about/", "/contact/", "/service-areas/", "/projects/", "/privacy-policy/"];
  for (const path of pages) {
    test(`has no serious axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("contact form errors pass axe", async ({ page }) => {
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByRole("heading", { name: /problems? with your inquiry/ })).toBeVisible();
    const results = await new AxeBuilder({ page }).include("form").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("the skip link is the first focusable element and moves focus to main", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard test");
    await page.goto("/services/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animation = await page.locator(".motion-rise").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("none");
  });
});

test.describe("navigation", () => {
  test("desktop menus open, close with Escape and navigate", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop navigation");
    await page.goto("/");
    const trigger = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Services" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole("link", { name: /Deck permits/ }).first().click();
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the mobile menu opens, closes with Escape and navigates", async ({ page }, info) => {
    test.skip(info.project.name === "desktop", "Mobile and tablet navigation");
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await button.click();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/\/how-it-works\/$/);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("calls to action lead to real pages", async ({ page }) => {
    await page.goto("/services/deck-permits/");
    await page.getByRole("link", { name: "Discuss Your Project" }).last().click();
    await expect(page).toHaveURL(/\/contact\/\?service=deck-permits$/);
    await expect(page.getByLabel("Project type")).toHaveValue("Deck");
  });

  test("the homepage project picker opens the form with the project type chosen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start an inquiry: Deck" }).first().click();
    await expect(page).toHaveURL(/\/contact\/\?service=deck-permits$/);
    await expect(page.getByLabel("Project type")).toHaveValue("Deck");
  });

  test("touch targets are at least 44px on small screens", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Mobile only");
    await page.goto("/contact/");
    for (const target of [
      page.getByRole("button", { name: "Open menu" }),
      page.getByRole("button", { name: "Send inquiry" }),
      page.getByLabel("Your name"),
      page.getByLabel("Project type"),
      page.locator("label[for=preferredContact-phone]"),
    ]) {
      const box = await target.boundingBox();
      expect(box!.height, await target.evaluate((el) => el.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44);
    }
  });
});
