import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const hide of [".praise-scroll{contain:paint}", ".praise-scroll{contain:paint}", ".praise-scroll{contain:paint}", "x{}", "x{}"]) {
  const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
  if (hide) await page.addInitScript((h) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = h; document.head.append(s); }); }, hide);
  await page.goto(`http://localhost:3100/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
  const top = await page.evaluate(() => document.querySelector("[data-services]").getBoundingClientRect().top + scrollY);
  let w = [];
  for (const k of [-0.5, 0, 0.5]) { await page.evaluate((y) => scrollTo(0, y), Math.round(top + k * 839)); await page.waitForTimeout(400); w.push(await page.evaluate(() => innerWidth)); }
  console.log(hide || "none", w.join(" "));
  await page.close();
}
await browser.close();
