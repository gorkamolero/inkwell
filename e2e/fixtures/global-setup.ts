/**
 * Playwright Global Setup
 *
 * Runs once before all tests to seed the database.
 */

import { seedTestDatabase } from "./db-seed";

async function globalSetup(): Promise<void> {
  console.log("\n=== E2E Test Global Setup ===\n");

  try {
    await seedTestDatabase();
  } catch (error) {
    console.error("[E2E] Failed to seed database:", error);
    // Don't fail setup - tests can still run with API mocking
    console.log("[E2E] Continuing without database seeding...");
  }

  console.log("\n=== Global Setup Complete ===\n");
}

export default globalSetup;
