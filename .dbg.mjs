import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const page = await ctx.newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
const at = (e) => page.evaluate((e) => { let top = 0; for (let n = document.querySelector("[data-making]"); n; n = n.offsetParent) top += n.offsetTop; const y = Math.round(top + e * innerHeight); scrollTo(0, y); return [y, top, innerHeight, document.documentElement.scrollHeight]; }, e);
const shown = (k) => page.locator(`[data-mk-fade='${k}']`).first().evaluate((el) => Number(getComputedStyle(el).opacity));
for (const e of [0.6, 7, 0.6]) { console.log(e, await at(e)); for (let i = 0; i < 4; i++) { await page.waitForTimeout(500); console.log("  ", Math.round(await page.evaluate(() => scrollY)), await shown("site"), await shown("dusk")); } }
await browser.close();
