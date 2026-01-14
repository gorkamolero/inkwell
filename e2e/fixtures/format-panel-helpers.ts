/**
 * Format Panel Test Helpers
 *
 * Helpers for testing the format panel on shared session pages.
 * The format panel only exists on /s/[slug] pages, not the homepage.
 *
 * Uses the pre-existing test session from CLAUDE.md:
 * - Slug: <TEST_SLUG>
 * - This session has a working Liveblocks room already set up
 */

import { Page, expect } from "@playwright/test";

/**
 * Pre-existing test session that has a working Liveblocks room.
 * Creating new sessions dynamically takes too long for Liveblocks to connect.
 */
export const TEST_SESSION_SLUG = "<TEST_SLUG>";

/**
 * Navigate to a shared session page and open the format panel.
 * Uses the pre-existing test session for reliable Liveblocks connection.
 */
export async function setupFormatPanelTest(page: Page): Promise<string> {
  // Navigate directly to the pre-existing test session
  // This session already has a Liveblocks room, avoiding connection delays
  await page.goto(`/s/${TEST_SESSION_SLUG}`);

  // Wait for the Liveblocks connection - indicated by "Live" badge
  // Use exact match to avoid matching content with "live" in it (e.g. "alive")
  await expect(page.getByText("Live", { exact: true })).toBeVisible({ timeout: 30000 });

  // Now wait for the editor textbox to be interactive
  await expect(
    page.getByRole("textbox", { name: /editor/i })
  ).toBeVisible({ timeout: 10000 });

  // Open the format panel via "Customize" button
  const customizeButton = page.getByRole("button", { name: /customize/i });
  await expect(customizeButton).toBeVisible({ timeout: 5000 });
  await customizeButton.click();

  // Wait for format panel to be visible
  await expect(page.getByText("Format Settings")).toBeVisible({ timeout: 5000 });

  return TEST_SESSION_SLUG;
}

/**
 * Open a specific section in the format panel
 */
export async function openFormatSection(
  page: Page,
  sectionName: string
): Promise<void> {
  const section = page.getByRole("button", { name: new RegExp(sectionName, "i") });
  if (await section.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Check if it's collapsed (has aria-expanded="false")
    const expanded = await section.getAttribute("aria-expanded");
    if (expanded === "false") {
      await section.click();
    }
  }
}

/**
 * Close the format panel
 */
export async function closeFormatPanel(page: Page): Promise<void> {
  const closeButton = page.locator('[class*="format"] button').filter({ hasText: /×|close/i });
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  } else {
    await page.keyboard.press("Escape");
  }
}
