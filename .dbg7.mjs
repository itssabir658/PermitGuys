import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"], isMobile: false })).newPage();
await page.goto(`http://localhost:3100/`, { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
const top = await page.evaluate(() => document.querySelector("[data-services]").getBoundingClientRect().top + scrollY);
await page.evaluate((y) => scrollTo(0, y), Math.round(top)); await page.waitForTimeout(600);
console.log(await page.evaluate(() => { const W = document.documentElement.clientWidth; const out = [document.documentElement.scrollWidth, W]; for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.right > W + 2 && getComputedStyle(el).position !== "fixed") out.push(el.tagName + "." + String(el.className).slice(0, 60) + " " + Math.round(r.left) + "-" + Math.round(r.right) + " " + getComputedStyle(el).transform.slice(0,40)); } return out.slice(0, 20); }));
await browser.close();
