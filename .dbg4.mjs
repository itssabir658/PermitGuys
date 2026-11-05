import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
await page.evaluate(() => scrollTo(0, 13800)); await page.waitForTimeout(800);
console.log(await page.evaluate(() => { const out = []; for (const el of document.querySelectorAll("body *")) { if (el.scrollWidth > 420 && getComputedStyle(el).position !== "fixed") out.push(el.tagName + "." + String(el.className).slice(0, 50) + " sw=" + el.scrollWidth + " cw=" + el.clientWidth + " " + getComputedStyle(el).overflowX); } return out.slice(0, 15); }));
await browser.close();
