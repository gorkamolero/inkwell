import base from "./playwright.config";
import { defineConfig } from "@playwright/test";
export default defineConfig({ ...base, retries: 0, workers: 1,
  projects: [{ name: "v11", testMatch: /(?:portfolio-v11|collaboration-latency|verify-rooms)\.spec\.ts$/, use: { ...base.use } }],
});
