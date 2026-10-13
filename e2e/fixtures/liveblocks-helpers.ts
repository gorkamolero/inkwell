/**
 * Liveblocks Helpers for E2E Collaboration Tests
 *
 * Utilities for setting up and cleaning up Liveblocks rooms for testing.
 */

import { Browser, BrowserContext, Page, chromium } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { TestUser, TEST_USERS } from "./test-data";

import { trackRoom } from "../proof/rooms";

const LIVEBLOCKS_BASE_URL = "https://api.liveblocks.io/v2";
const APP_BASE_URL = "http://localhost:3847";

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
  page.on("response", async response => {
    if (response.request().method() === "POST" && new URL(response.url()).pathname === "/api/sessions" && response.ok()) {
      const data = await response.json();
      trackRoom(data.session.id);
    }
  });
  await page.goto("/");
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

  await page.getByRole("button", { name: /go fullscreen/i }).click();
  await page.waitForURL(/\/s\/.+/, { timeout: 15000 });

  const shareUrl = page.url();
  const shareSlug = shareUrl.split("/s/")[1] ?? "";

  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

  return { url: shareUrl, shareSlug };
}

/**
 * Create a shared session via API and navigate directly to the shared page.
 * Useful for tests that need a valid shared session but are not verifying
 * the homepage editor/fullscreen flow itself.
 */
export async function createSharedSessionViaApi(
  page: Page
): Promise<{ sessionId: string; url: string; shareSlug: string }> {
  const createResponse = await page.context().request.post(
    `${APP_BASE_URL}/api/sessions`,
    {
      data: { type: "book" },
    }
  );

  if (!createResponse.ok()) {
    throw new Error(`Failed to create session: ${createResponse.status()}`);
  }

  const createData = (await createResponse.json()) as {
    session: { id: string };
  };

  trackRoom(createData.session.id);

  const shareResponse = await page.context().request.post(
    `${APP_BASE_URL}/api/sessions/${createData.session.id}/share`,
    {
      data: {},
    }
  );

  if (!shareResponse.ok()) {
    throw new Error(`Failed to create share link: ${shareResponse.status()}`);
  }

  const shareData = (await shareResponse.json()) as {
    shareSlug: string;
    shareUrl: string;
  };

  const shareUrl = new URL(shareData.shareUrl);
  const localOrigin = new URL(APP_BASE_URL);
  if (shareUrl.host !== localOrigin.host || shareUrl.pathname !== `/s/${shareData.shareSlug}`) {
    throw new Error("Refusing non-local shared URL");
  }
  // The API hardcodes HTTPS in production mode, while local next start uses
  // HTTP. Adapt only the validated localhost transport, preserving the slug.
  shareUrl.protocol = localOrigin.protocol;
  await page.goto(shareUrl.href);
  await page.waitForURL(/\/s\/.+/, { timeout: 15000 });
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

  return {
    sessionId: createData.session.id,
    url: shareUrl.href,
    shareSlug: shareData.shareSlug,
  };
}

/**
 * Delete a Liveblocks room via the admin API
 *
 * Note: This requires LIVEBLOCKS_SECRET_KEY to be set
 */
export async function deleteTestRoom(roomId: string): Promise<void> {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) throw new Error("LIVEBLOCKS_SECRET_KEY required for room cleanup");
  // DELETE is idempotent. Retry only transient service/network failures on
  // this exact recorded room; never discover or substitute other room IDs.
  const request = async (method: "DELETE" | "GET") => {
    for (let attempt = 0; attempt < 5; attempt++) {
      let response: Response;
      try {
        response = await fetch(`${LIVEBLOCKS_BASE_URL}/rooms/${encodeURIComponent(roomId)}`, {
          method, headers: { Authorization: `Bearer ${secretKey}` },
        });
      } catch {
        if (attempt === 4) throw new Error(`Room cleanup ${method} network failure`);
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      if (response.status === 429 || response.status >= 500) {
        if (attempt === 4) throw new Error(`Room cleanup ${method} failed: ${response.status}`);
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      return response;
    }
    throw new Error("Room cleanup retry limit reached");
  };
  const response = await request("DELETE");
  if (!response.ok && response.status !== 404) throw new Error(`Room cleanup failed: ${response.status}`);
  const verification = await request("GET");
  if (verification.status !== 404) throw new Error(`Room absence verification failed: ${verification.status}`);
  console.log(`[E2E] Room removed; verified GET 404: ${roomId}`);
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
  await page.getByRole("textbox", { name: /editor/i }).waitFor({
    state: "visible",
    timeout,
  });
  await page.getByText("Live", { exact: true }).waitFor({ state: "visible", timeout });
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
