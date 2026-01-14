import { test, expect, chromium, BrowserContext, Page } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Real-Time Collaboration Tests
 *
 * These tests use real Liveblocks rooms for collaboration testing.
 * User A creates a session and shares it, User B joins via the share link.
 */

// Helper to create a share link and return the URL
async function createAndShareSession(page: Page): Promise<string> {
  await page.goto("/");

  // Wait for editor
  await expect(
    page.getByRole("textbox", { name: /editor/i })
  ).toBeVisible({ timeout: 15000 });

  // Open share dialog
  await page.getByRole("button", { name: /share/i }).click();

  // Create share link
  await page.getByRole("button", { name: /create share link/i }).click();

  // Wait for share URL
  const shareInput = page.locator("input[readonly]");
  await expect(shareInput).toBeVisible({ timeout: 10000 });

  const shareUrl = await shareInput.inputValue();

  // Close dialog
  await page.getByRole("button", { name: /done/i }).click();

  return shareUrl;
}

test.describe("Real-Time Collaboration", () => {
  // Collaboration tests run sequentially with workers: 1
  test.describe.configure({ mode: "serial" });

  let browser: import("playwright").Browser;
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
  });

  test.afterAll(async () => {
    await contextA.close();
    await contextB.close();
    await browser.close();
  });

  test("user B can join user A's session via share link", async () => {
    // User A creates and shares a session
    const shareUrl = await createAndShareSession(pageA);

    // IMPORTANT: User A must also navigate to the share URL
    // to be in the same Liveblocks room as User B
    await pageA.goto(shareUrl);
    await expect(
      pageA.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(pageA.getByText(/live/i)).toBeVisible({ timeout: 10000 });

    // User B joins via share link
    await pageB.goto(shareUrl);

    // Both should see the editor
    await expect(
      pageB.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Both should show "Live" status (Liveblocks connected)
    await expect(pageB.getByText(/live/i)).toBeVisible({ timeout: 10000 });

    // Wait for both to connect
    await pageA.waitForTimeout(2000);
    await pageB.waitForTimeout(2000);
  });

  test("changes from user A sync to user B", async () => {
    // Get editors
    const editorA = createEditorHelper(pageA);
    const editorB = createEditorHelper(pageB);

    // Clear and type as User A
    await editorA.clear();
    await editorA.type("Hello from User A");

    // Wait for sync (Liveblocks real-time)
    await pageA.waitForTimeout(3000);

    // User B should see the change
    await expect(pageB.getByText("Hello from User A")).toBeVisible({
      timeout: 10000,
    });
  });

  test("changes from user B sync to user A", async () => {
    const editorB = createEditorHelper(pageB);

    // User B adds content
    await editorB.type(" and User B");

    // Wait for sync
    await pageB.waitForTimeout(3000);

    // User A should see the combined content
    await expect(
      pageA.getByText(/Hello from User A.*User B|User B.*Hello from User A/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Shared Session Access", () => {
  test("shared session shows editor for anonymous users", async ({ page }) => {
    // Create a session and get share link
    const shareUrl = await createAndShareSession(page);

    // Open a new context (anonymous user)
    const browser = await chromium.launch();
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    try {
      await anonPage.goto(shareUrl);

      // Should see the collaborative editor
      await expect(
        anonPage.getByRole("textbox", { name: /editor/i })
      ).toBeVisible({ timeout: 15000 });

      // Should show Live status
      await expect(anonPage.getByText(/live/i)).toBeVisible({ timeout: 10000 });
    } finally {
      await anonContext.close();
      await browser.close();
    }
  });

  test("shared session URL contains share slug", async ({ page }) => {
    const shareUrl = await createAndShareSession(page);

    // URL should contain /s/ path
    expect(shareUrl).toContain("/s/");
  });
});
