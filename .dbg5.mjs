import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
for (let y = 13600; y <= 13800; y += 20) {
  await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(250);
  const r = await page.evaluate(() => [innerWidth, [...document.querySelectorAll("section")].filter(s => { const b = s.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0; }).map(s => s.getAttribute("aria-labelledby") + ":" + Math.round(s.getBoundingClientRect().top))]);
  console.log(y, JSON.stringify(r));
  if (r[0] > 412) {
    break;
  }
}
await browser.close();
