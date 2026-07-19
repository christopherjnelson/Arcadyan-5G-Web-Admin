import { defineConfig, devices } from "@playwright/test";

const traceEnabled = process.env.ARCADYAN_PLAYWRIGHT_TRACE === "1";
const hardwareEnabled = Boolean(process.env.ARCADYAN_PASSWORD);

export default defineConfig({
  testDir: "./tests/hardware",
  testMatch: "**/*.hardware.ts",
  outputDir: ".playwright-artifacts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "off",
    video: "off",
    trace: traceEnabled ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: hardwareEnabled
    ? {
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173/login",
        reuseExistingServer: true,
        timeout: 30_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
