import base from "./playwright.config";
import { defineConfig } from "@playwright/test";
// Importing the base config uses the existing automatic environment loader.
// Persist only a key classification; never persist or print credential material.
import { mkdirSync, writeFileSync } from "node:fs";
import { output } from "./e2e/proof/rooms";
const key = process.env.LIVEBLOCKS_SECRET_KEY || "";
if (!key.startsWith("sk_") || /^sk_(dev|test)_/.test(key))
  throw new Error("A configured production Liveblocks secret is required");
mkdirSync(output, { recursive: true });
writeFileSync(`${output}/production-key-verification.json`, JSON.stringify({configuredProductionKey: true,checkedAt:new Date().toISOString()}));
export default defineConfig({ ...base, retries: 0, workers: 1,
  projects: [{ name: "v13", testMatch: /(?:portfolio-v13|collaboration-latency|verify-rooms)\.spec\.ts$/, use: { ...base.use, launchOptions: { args: ["--force-device-scale-factor=2"] } } }],
});
