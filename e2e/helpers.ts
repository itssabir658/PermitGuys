import { expect, type Page } from "@playwright/test";

/** Collects console errors and uncaught exceptions raised by the application. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return {
    errors,
    // Browsers log failed resource loads (such as the 404 document itself) as console errors.
    expectNone: (allow: RegExp[] = []) => expect(errors.filter((e) => !allow.some((re) => re.test(e)))).toEqual([]),
  };
}

export async function sitemapPaths(page: Page): Promise<string[]> {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}
