import { chromium, devices } from "@playwright/test";
const port = process.argv[2];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
const top = await page.evaluate(() => document.querySelector("[data-services]").getBoundingClientRect().top + scrollY);
for (const k of [-1.5, -1, -0.5, 0, 0.5, 1]) { await page.evaluate((y) => scrollTo(0, y), Math.round(top + k * 839)); await page.waitForTimeout(400); console.log(k, await page.evaluate(() => innerWidth)); }
await browser.close();
