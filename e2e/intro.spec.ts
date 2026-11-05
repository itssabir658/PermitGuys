import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

/*
 * The loader, the façade (Preloader.tsx, docs/MOTION.md "Load sequence"):
 * on every full load a dark façade of blades with the logo on it, a light
 * crossing it; then the blades pivot open onto the page.
 */
test.describe("Loader", () => {
  test("shows the façade with the logo, then opens the blades from the middle onto the page", async ({ page }) => {
    const console = watchConsole(page);
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    // The blades cover the screen edge to edge, and the logo sits on them.
    const cover = await page.evaluate(() => {
      const blades = [...document.querySelectorAll<HTMLElement>(".loader__blade")].filter((b) => b.offsetWidth > 0).map((b) => b.getBoundingClientRect());
      const logo = document.querySelector(".loader__logo")!.getBoundingClientRect();
      return { count: blades.length, left: blades[0].left, right: blades.at(-1)!.right, top: Math.max(...blades.map((b) => b.top)), bottom: Math.min(...blades.map((b) => b.bottom)), logoInView: logo.left > 0 && logo.right < innerWidth, width: innerWidth, height: innerHeight };
    });
    expect(cover.count).toBeGreaterThanOrEqual(8);
    expect(cover.left).toBeLessThanOrEqual(0);
    expect(cover.right).toBeGreaterThanOrEqual(cover.width - 1);
    expect(cover.top).toBeLessThanOrEqual(0);
    expect(cover.bottom).toBeGreaterThanOrEqual(cover.height);
    expect(cover.logoInView).toBe(true);

    // Then the blades turn, the middle ones first.
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset, null, { timeout: 9000 });
    const delays = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".loader__blade")].filter((b) => b.offsetWidth > 0).map((b) => Number(b.getAnimations().find((a) => !(a instanceof CSSAnimation))?.effect?.getTiming().delay)),
    );
    const mid = delays.length / 2;
    expect(delays[mid]).toBeLessThan(delays[0]);
    expect(delays[mid - 1]).toBeLessThan(delays.at(-1)!);
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await expect(page.locator(".preloader")).toBeHidden();
    console.expectNone();
  });

  test("plays again on a later load in the same tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.reload();
    await expect(page.locator(".preloader")).toBeVisible();
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
  });

  test("the page transition shows the logo and its red rule", async ({ page }) => {
    await page.goto("/services/");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "cover");
    await expect(page.locator(".screen-veil .screen-veil__logo")).toHaveCount(1);
    await expect(page.locator(".screen-veil .screen-veil__rule")).toHaveCount(1);
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
  });

  test("with reduced motion the loader still plays (gentle motion), the blades stay still and the screen fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".preloader")).toBeVisible();
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await expect(page.locator(".preloader")).toBeHidden();
    const turned = await page.locator(".loader__blade").evaluateAll((els) => els.filter((el) => el.getAnimations().some((a) => !(a instanceof CSSAnimation))).length);
    expect(turned).toBe(0);
  });
});
