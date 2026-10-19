import { defineConfig, devices } from "@playwright/test";

/*
 * Browser tests against a production build. Run `npm run build` first, then
 * `npm run test:e2e`. A local mock webhook stands in for the CRM so the
 * success and failure paths of the inquiry form are exercised end to end
 * without sending real email.
 */
const PORT = 3200;
const WEBHOOK_PORT = 4010;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `node e2e/mock-webhook.mjs ${WEBHOOK_PORT}`,
      url: `http://localhost:${WEBHOOK_PORT}/health`,
      reuseExistingServer: false,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: false,
      env: {
        INQUIRY_WEBHOOK_URL: `http://localhost:${WEBHOOK_PORT}/hook`,
        // The time trap and rate limit have unit tests; relax them for fast automated typing.
        INQUIRY_MIN_FILL_SECONDS: "0",
        INQUIRY_RATE_LIMIT_MAX: "1000",
      },
    },
  ],
});
