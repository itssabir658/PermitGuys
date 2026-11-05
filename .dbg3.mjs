import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
for (const y of [13600, 13800, 14000]) {
await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(600);
console.log(y, await page.evaluate(() => { const W = 412; const out = []; for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.right > W + 2 && !el.closest(".site-nav, .site-menu, .screen-veil") && getComputedStyle(el).position !== "fixed") { let p = el.parentElement, clipped = false;  while (p) { const o = getComputedStyle(p); if (o.overflowX !== "visible" || o.contain.includes("paint")) { clipped = true; break; } p = p.parentElement; } out.push((clipped?"C ":"") + el.tagName + "." + String(el.className).slice(0, 50) + " " + Math.round(r.left) + "-" + Math.round(r.right) + " " + (el.closest("section")?.getAttribute("aria-labelledby") ?? "")); } } return [document.documentElement.scrollWidth, out.filter(s=>!s.startsWith("C ")).slice(0, 10)]; }));
}
await browser.close();
