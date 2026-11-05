import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
for (const y of [0, 5000, 9000, 12000, 15000, 18000]) {
  await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(600);
  console.log(y, await page.evaluate(() => [innerWidth, innerHeight, document.documentElement.scrollWidth, [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== "fixed"; }).slice(0, 4).map((el) => el.tagName + "." + String(el.className).slice(0, 40) + " " + Math.round(el.getBoundingClientRect().right))]));
}
await browser.close();
