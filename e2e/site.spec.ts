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
      // Check the settled page: entrance and scroll-reveal motion only fades content in on the way.
      await page.emulateMedia({ reducedMotion: "reduce" });
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
    const animation = await page.locator(".hero-heading-line .split-line__inner").evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("none");
    await page.goto("/services/");
    const inner = await page.locator(".motion-rise").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(inner).toBe("none");
  });
});

test.describe("navigation", () => {
  test("the menu opens, traps focus, closes with Escape and navigates", async ({ page }) => {
    await page.goto("/");
    const wide = page.viewportSize()!.width >= 768;
    // Wide screens show the bar's links at the top of the page; the menu button comes in once the page scrolls past 80px.
    if (wide) {
      await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
      await page.evaluate(() => window.scrollTo(0, 800));
      await expect(page.locator(".site-nav")).toHaveAttribute("data-collapsed", "");
    }
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(menu.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(menu).toBeHidden();
    await button.click();
    await menu.getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/\/how-it-works\/$/);
    await expect(wide ? page.getByRole("navigation", { name: "Main" }) : page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("the desktop bar links to the main sections", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop navigation");
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Guides" }).click();
    await expect(page).toHaveURL(/\/permit-guides\/$/);
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Guides" })).toHaveAttribute("aria-current", "page");
  });

  test("calls to action lead to real pages", async ({ page }) => {
    await page.goto("/services/deck-permits/");
    await page.getByRole("link", { name: "Discuss Your Project" }).last().click();
    await expect(page).toHaveURL(/\/contact\/\?service=deck-permits$/);
    await expect(page.getByLabel("Project type")).toHaveValue("Deck");
  });

  test("the homepage service index opens each service", async ({ page }) => {
    await page.goto("/");
    await page.locator("#services").getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
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

test.describe("interactive pieces", () => {
  test("in-site links pass through the Ontario screen transition", async ({ page }) => {
    await page.goto("/services/");
    await page.getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "cover");
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("after a header click the next page starts at its content and the row still collapses", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop navigation");
    await page.goto("/services/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Process" }).click();
    await expect(page).toHaveURL(/\/how-it-works\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
    await expect(page.locator("main")).toBeFocused();
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect(page.locator(".site-nav")).toHaveAttribute("data-collapsed", "");
  });

  test("a link that only changes the query swaps the page without a cover", async ({ page }) => {
    await page.goto("/contact/?service=deck-permits");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => {
      const veil = document.querySelector<HTMLElement>(".screen-veil")!;
      new MutationObserver(() => veil.dataset.phase !== "idle" && document.documentElement.setAttribute("data-test-covered", "")).observe(veil, { attributes: true });
    });
    await page.locator("footer").getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-test-covered");
  });

  test("on phones the collapsed header bar over Contact is ivory, not the night behind it", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "The phone header bar");
    await page.goto("/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => {
      let top = 0;
      for (let n = document.querySelector<HTMLElement>("[data-contact]"); n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      window.scrollTo(0, top + 300);
    });
    const nav = page.locator(".site-nav");
    await expect(nav).toHaveAttribute("data-collapsed", "");
    await expect(nav).toHaveAttribute("data-tone", "light");
    const ivory = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.background = "color-mix(in srgb, #f4f1eb 88%, transparent)";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await expect.poll(() => page.locator(".site-nav__bar").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ivory);
  });

  test("the transition and intro stay out of the way with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".screen-veil")).toBeHidden();
    await page.locator("#services").getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("study images say they are not client projects", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[aria-labelledby=works-heading]")).toContainText("None of them is a client project");
    await expect(page.getByText("Rendered study for illustration, not a client project.").first()).toBeAttached();
  });

  test("the map loads from Google only when asked", async ({ page }) => {
    await page.route(/^https:\/\/www\.google\.com\/maps/, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Map</title>" }));
    await page.goto("/contact/");
    const map = page.locator('iframe[title^="Map:"]');
    await expect(map).toHaveCount(0);
    await page.getByRole("button", { name: "Show the map" }).click();
    await expect(map).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Open in Google Maps/ })).toHaveAttribute("href", /google\.com\/maps\/search/);
  });
});
