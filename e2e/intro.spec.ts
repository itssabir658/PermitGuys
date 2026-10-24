import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

/*
 * The Greater Toronto Area intro (Preloader.tsx, docs/MOTION.md "Load
 * sequence"): on every full load, the map draws and its five regions come in west
 * to east, each aligned with its region of the map; then the page.
 */
test.describe("GTA intro", () => {
  test("draws the map, reveals the five regions in order inside it, then fades onto the page", async ({ page }) => {
    const console = watchConsole(page);
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    // The regions' pictures start in order, west to east.
    const starts = await page.locator(".intro__region").evaluateAll((els) =>
      els.map((el) => {
        const a = el.getAnimations()[0] as CSSAnimation;
        return { delay: Number(a.effect?.getTiming().delay), name: a.animationName };
      }),
    );
    expect(starts.map((s) => s.name)).toEqual(Array(5).fill("fade-in"));
    for (let i = 1; i < 5; i++) expect(starts[i].delay).toBeGreaterThan(starts[i - 1].delay);

    // Each region's frame sits exactly where its shape is on the map.
    const fit = await page.evaluate(() => {
      const map = document.querySelector(".intro")!.getBoundingClientRect();
      const lines = document.querySelector(".intro__lines")!.getBoundingClientRect();
      const edge = document.querySelector(".intro__stroke:not(.intro__stroke--border)")!.getBoundingClientRect();
      const regions = [...document.querySelectorAll(".intro__region")].map((el) => el.getBoundingClientRect());
      const union = { left: Math.min(...regions.map((r) => r.left)), top: Math.min(...regions.map((r) => r.top)), right: Math.max(...regions.map((r) => r.right)), bottom: Math.max(...regions.map((r) => r.bottom)) };
      return { map: [map.left, map.top, map.width, map.height], lines: [lines.left, lines.top, lines.width, lines.height], edge: [edge.left, edge.top, edge.right, edge.bottom], union: [union.left, union.top, union.right, union.bottom], inView: map.left >= 0 && map.top >= 0 && map.right <= innerWidth && map.bottom <= innerHeight };
    });
    expect(fit.inView).toBe(true);
    fit.lines.forEach((v, i) => expect(v).toBeCloseTo(fit.map[i], 0));
    fit.union.forEach((v, i) => expect(Math.abs(v - fit.edge[i])).toBeLessThan(1.5));

    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await expect(page.locator(".preloader")).toBeHidden();
    console.expectNone();
  });

  test("plays again, pictures and all, on a later load in the same tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    // Every region's picture is set, and every region comes up.
    const pictures = await page.locator(".intro__picture").evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage));
    expect(pictures).toHaveLength(5);
    for (const p of pictures) expect(p).toContain("/images/intro/");
    await page.waitForFunction(() => [...document.querySelectorAll(".intro__region")].every((el) => Number(getComputedStyle(el).opacity) > 0.99), null, { timeout: 6000 });
  });

  test("the page transition shows the same map, its five pictures coming up in their regions", async ({ page }) => {
    await page.goto("/services/");
    await page.waitForFunction(() => "preloaded" in document.documentElement.dataset, null, { timeout: 9000 });
    await page.getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "cover");
    const pictures = await page.locator(".screen-veil .gta__picture").evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage));
    expect(pictures).toHaveLength(5);
    for (const p of pictures) expect(p).toContain("/images/intro/");
    await page.waitForFunction(() => [...document.querySelectorAll(".screen-veil .gta__region")].every((el) => Number(getComputedStyle(el).opacity) > 0.99));
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
  });

  test("with reduced motion there is no screen at all", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await page.evaluate(() => "preloaded" in document.documentElement.dataset)).toBe(true);
    await expect(page.locator(".preloader")).toBeHidden();
  });
});
