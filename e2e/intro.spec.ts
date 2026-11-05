import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

/*
 * The loader, "through the front door" (Preloader.tsx, docs/MOTION.md "Load
 * sequence"): on every full load a house is drawn in line, its red door
 * opens, and the screen goes in through the doorway onto the page.
 */
test.describe("Loader", () => {
  test("draws the house, opens the door and goes in through it onto the page", async ({ page }) => {
    const console = watchConsole(page);
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    // The door is drawn after every other line of the house.
    const order = await page.locator(".loader__drawing .house__stroke").evaluateAll((els) =>
      els.map((el) => ({ kind: [...el.classList].find((c) => c.startsWith("house__stroke--"))!, delay: Number((el.getAnimations()[0] as CSSAnimation).effect?.getTiming().delay) })),
    );
    const door = order.find((s) => s.kind === "house__stroke--door")!;
    for (const s of order.filter((x) => x.kind === "house__stroke--ink")) expect(s.delay).toBeLessThanOrEqual(door.delay);

    // The house sits on the screen, the doorway inside it.
    const fit = await page.evaluate(() => {
      const house = document.querySelector(".loader")!.getBoundingClientRect();
      const door = document.querySelector(".loader__door")!.getBoundingClientRect();
      return { inView: house.left >= 0 && house.top >= 0 && house.right <= innerWidth && house.bottom <= innerHeight, inside: door.left > house.left && door.right < house.right && door.top > house.top && door.bottom <= house.bottom };
    });
    expect(fit).toEqual({ inView: true, inside: true });

    // Then the screen grows around the doorway, and is gone.
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.waitForFunction(() => document.querySelector(".preloader")!.getAnimations().some((a) => String((a.effect as KeyframeEffect).getKeyframes().at(-1)?.transform).startsWith("scale(")));
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

  test("the page transition draws the same house", async ({ page }) => {
    await page.goto("/services/");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "cover");
    await expect(page.locator(".screen-veil .house__stroke--door")).toHaveCount(1);
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
  });

  test("with reduced motion the loader still plays (gentle motion), the door stays shut and the screen fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".preloader")).toBeVisible();
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await expect(page.locator(".preloader")).toBeHidden();
    expect(await page.locator(".loader__leaf").evaluate((el) => el.getAnimations().length)).toBe(0);
  });
});
