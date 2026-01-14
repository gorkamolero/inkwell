/**
 * Liveblocks Helpers for E2E Collaboration Tests
 *
 * Utilities for setting up and cleaning up Liveblocks rooms for testing.
 */

import { Browser, BrowserContext, Page, chromium } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { TestUser, TEST_USERS } from "./test-data";

const LIVEBLOCKS_BASE_URL = "https://api.liveblocks.io/v2";

export interface CollaborationContext {
  browser: Browser;
  userA: {
    context: BrowserContext;
    page: Page;
    user: TestUser;
  };
  userB: {
    context: BrowserContext;
    page: Page;
    user: TestUser;
  };
  cleanup: () => Promise<void>;
}

/**
 * Generate a unique test room ID
 */
export function generateTestRoomId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `e2e-test-room-${timestamp}-${random}`;
}

/**
 * Set up a collaboration test with two browser contexts
 *
 * @param userAData - First user (default: owner)
 * @param userBData - Second user (default: collaborator)
 * @returns Context with both users' pages
 */
export async function setupCollaborationTest(
  userAData: TestUser = TEST_USERS.owner,
  userBData: TestUser = TEST_USERS.collaborator
): Promise<CollaborationContext> {
  const browser = await chromium.launch();

  // Create separate contexts for each user (isolated cookies/storage)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Set up auth for each user
  await setupAuthBeforeNavigation(pageA, userAData);
  await setupAuthBeforeNavigation(pageB, userBData);

  return {
    browser,
    userA: { context: contextA, page: pageA, user: userAData },
    userB: { context: contextB, page: pageB, user: userBData },
    cleanup: async () => {
      await pageA.close();
      await pageB.close();
      await contextA.close();
      await contextB.close();
      await browser.close();
    },
  };
}

/**
 * Create a shared session and return the URL for collaboration testing
 */
export async function createSharedSession(
  page: Page
): Promise<{ url: string; shareSlug: string }> {
  // Navigate to home to create a new session
  await page.goto("/");

  // Wait for editor to load
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

  // Click share button
  await page.getByRole("button", { name: /share/i }).click();

  // Wait for share dialog and get the share URL
  const shareInput = page.locator('input[readonly]').first();
  await shareInput.waitFor({ state: "visible", timeout: 5000 });

  const shareUrl = await shareInput.inputValue();
  const shareSlug = shareUrl.split("/s/")[1] ?? "";

  // Close the share dialog
  const closeButton = page.getByRole("button", { name: /close|done|×/i });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  return { url: `/s/${shareSlug}`, shareSlug };
}

/**
 * Delete a Liveblocks room via the admin API
 *
 * Note: This requires LIVEBLOCKS_SECRET_KEY to be set
 */
export async function deleteTestRoom(roomId: string): Promise<void> {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) {
    console.warn("[E2E] LIVEBLOCKS_SECRET_KEY not set, cannot delete room");
    return;
  }

  try {
    const response = await fetch(`${LIVEBLOCKS_BASE_URL}/rooms/${roomId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (response.ok) {
      console.log(`[E2E] Deleted Liveblocks room: ${roomId}`);
    } else if (response.status !== 404) {
      console.warn(
        `[E2E] Failed to delete room ${roomId}: ${response.status}`
      );
    }
  } catch (error) {
    console.warn(`[E2E] Error deleting room ${roomId}:`, error);
  }
}

/**
 * Clean up all test rooms (rooms with e2e-test- prefix)
 */
export async function cleanupTestRooms(): Promise<void> {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) {
    console.warn("[E2E] LIVEBLOCKS_SECRET_KEY not set, cannot cleanup rooms");
    return;
  }

  try {
    // List rooms with test prefix
    const response = await fetch(
      `${LIVEBLOCKS_BASE_URL}/rooms?startingAfter=e2e-test-`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!response.ok) {
      console.warn("[E2E] Failed to list rooms for cleanup");
      return;
    }

    const data = await response.json();
    const rooms = data.data ?? [];

    // Delete each test room
    for (const room of rooms) {
      if (room.id.startsWith("e2e-test-")) {
        await deleteTestRoom(room.id);
      }
    }

    console.log(`[E2E] Cleaned up ${rooms.length} test rooms`);
  } catch (error) {
    console.warn("[E2E] Error during room cleanup:", error);
  }
}

/**
 * Wait for Liveblocks connection in the editor
 */
export async function waitForLiveblocksConnection(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for "Live" indicator or similar connection status
  await page
    .getByText(/live|connected/i)
    .waitFor({ state: "visible", timeout });
}

/**
 * Wait for content sync between two pages
 *
 * @param sourcePage - Page where content was typed
 * @param targetPage - Page where content should appear
 * @param content - The content to wait for
 * @param timeout - Maximum wait time
 */
export async function waitForContentSync(
  sourcePage: Page,
  targetPage: Page,
  content: string,
  timeout: number = 5000
): Promise<void> {
  await targetPage
    .getByText(content)
    .waitFor({ state: "visible", timeout });
}
