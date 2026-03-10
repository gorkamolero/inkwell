import { test, expect } from "@playwright/test";
import {
  createSharedSessionViaApi,
  waitForLiveblocksConnection,
} from "../fixtures/liveblocks-helpers";

/**
 * Presence Feature Tests
 *
 * Simple tests for presence indicators on shared sessions.
 */
test.describe("Presence Indicators", () => {
  test("shows Live badge when connected", async ({ page }) => {
    await createSharedSessionViaApi(page);
    await waitForLiveblocksConnection(page, 30000);
    await expect(page.getByText(/live|collaborative/i).first()).toBeVisible();
  });

  test("editor is interactive after connection", async ({ page }) => {
    await createSharedSessionViaApi(page);
    await waitForLiveblocksConnection(page, 30000);

    // Editor should be interactive
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible();
  });
});
