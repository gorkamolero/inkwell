import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables for auth token signing
config({ path: resolve(__dirname, ".env.local") });

/**
 * Playwright E2E Test Configuration for Hotpress
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Global setup and teardown for database seeding */
  // Temporarily disabled - DB seeding not required for mocked tests
  // globalSetup: require.resolve("./e2e/fixtures/global-setup"),
  // globalTeardown: require.resolve("./e2e/fixtures/global-teardown"),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Default timeout for tests */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. */
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ...(process.env.CI ? [["github"] as const] : []),
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3847",

    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Main tests - Chromium
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Collaboration tests - run sequentially with real Liveblocks
    {
      name: "collaboration",
      testMatch: "**/collaboration*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      workers: 1, // Run sequentially for real-time sync tests
    },

    // Mobile viewport tests
    {
      name: "mobile",
      testMatch: "**/mobile*.spec.ts",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // Disabled - expecting dev server to be running separately
  // webServer: {
  //   command: "pnpm run dev --port 3847",
  //   url: "http://localhost:3847",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
