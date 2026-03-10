/**
 * Format Panel Test Helpers
 *
 * Helpers for testing the format panel on shared session pages.
 * The format panel only exists on /s/[slug] pages.
 */

import { Page, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "./test-data";
import { createSharedSessionViaApi } from "./liveblocks-helpers";

/**
 * Navigate to a shared session page and open the format panel.
 */
export async function setupFormatPanelTest(page: Page): Promise<string> {
  const { shareSlug } = await createSharedSessionViaApi(page);

  await mockAuthSession(page, TEST_USERS.owner);
  await page.goto(`/s/${shareSlug}`);

  await expect(
    page.getByRole("textbox", { name: /editor/i })
  ).toBeVisible({ timeout: 10000 });

  // Open the format panel via "Customize" button (now in toolbar)
  const customizeButton = page.getByRole("button", { name: /customize/i });
  await expect(customizeButton).toBeVisible({ timeout: 5000 });
  await customizeButton.click();

  // Wait for format panel to be visible
  await expect(page.getByText("Format Settings")).toBeVisible({ timeout: 5000 });

  return shareSlug;
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
