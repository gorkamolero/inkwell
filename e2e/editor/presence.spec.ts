import { test, expect } from "@playwright/test";
import { TEST_SESSION_SLUG } from "../fixtures/format-panel-helpers";

/**
 * Presence Feature Tests
 *
 * Simple tests for presence indicators on shared sessions.
 */
test.describe("Presence Indicators", () => {
  test("shows Live badge when connected", async ({ page }) => {
    await page.goto(`/s/${TEST_SESSION_SLUG}`);

    // Wait for Liveblocks connection
    await expect(page.getByText("Live", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  test("editor is interactive after connection", async ({ page }) => {
    await page.goto(`/s/${TEST_SESSION_SLUG}`);

    // Wait for connection
    await expect(page.getByText("Live", { exact: true })).toBeVisible({ timeout: 30000 });

    // Editor should be interactive
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible();
  });
});
