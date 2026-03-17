import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start:standalone",
    cwd: __dirname,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      HOSTNAME: "127.0.0.1",
      PORT: "3000",
      DATABASE_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder",
      DATABASE_SSL: "disable",
      NEXTAUTH_SECRET: "playwright-placeholder-secret-32-chars-xx",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      AUTH_SECRET: "playwright-placeholder-secret-32-chars-xx",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
