/**
 * Playwright Global Teardown
 *
 * Runs once after all tests to clean up test data.
 */

import { cleanupTestDatabase } from "./db-seed";

async function globalTeardown(): Promise<void> {
  console.log("\n=== E2E Test Global Teardown ===\n");

  try {
    await cleanupTestDatabase();
  } catch (error) {
    console.error("[E2E] Failed to cleanup database:", error);
    // Don't fail teardown
  }

  console.log("\n=== Global Teardown Complete ===\n");
}

export default globalTeardown;
