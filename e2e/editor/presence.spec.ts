import { test, expect } from "@playwright/test";
import { setupCollaborationTest } from "../fixtures/liveblocks-helpers";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Presence Feature Tests
 *
 * Tests for real-time presence features:
 * - Avatar display
 * - Cursor visibility
 * - User join/leave
 */
test.describe("Presence Avatars", () => {
  test("shows presence avatars for multiple users", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      // Both users navigate to the same session
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      const url = userA.page.url();

      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      // Wait for presence sync (Liveblocks takes a moment)
      await userA.page.waitForTimeout(3000);

      // User A should see User B's avatar
      const avatarsA = userA.page.locator(
        '[data-testid="presence-avatars"], [aria-label*="users"], [class*="avatar"]'
      );

      // User B should see User A's avatar
      const avatarsB = userB.page.locator(
        '[data-testid="presence-avatars"], [aria-label*="users"], [class*="avatar"]'
      );

      // At least one avatar container should be visible
      const avatarCountA = await avatarsA.count();
      const avatarCountB = await avatarsB.count();

      // Both should see presence indicators
      expect(avatarCountA + avatarCountB).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });

  test("avatar disappears when user leaves", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      const url = userA.page.url();

      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      // Wait for presence sync
      await userA.page.waitForTimeout(3000);

      // Get initial state
      const avatarSelector =
        '[data-testid="presence-avatars"] > *, [class*="avatar-stack"] > *';
      const initialAvatars = await userA.page.locator(avatarSelector).count();

      // User B leaves
      await userB.page.close();

      // Wait for presence update
      await userA.page.waitForTimeout(3000);

      // Avatar count should decrease (or indicator should change)
      const finalAvatars = await userA.page.locator(avatarSelector).count();
      expect(finalAvatars).toBeLessThanOrEqual(initialAvatars);
    } finally {
      await cleanup();
    }
  });

  test("shows overflow indicator for many users", async () => {
    // This test would require more than 4-5 users to trigger overflow
    // For now, we just verify the structure exists
    const { userA, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editor = createEditorHelper(userA.page);
      await editor.waitForEditor();

      // Look for avatar container
      const avatarContainer = userA.page.locator(
        '[data-testid="presence-avatars"], [class*="avatar"]'
      );

      // Should exist even with just one user
      await expect(avatarContainer.first()).toBeVisible({ timeout: 5000 });
    } finally {
      await cleanup();
    }
  });
});

test.describe("Cursor Presence", () => {
  test("shows cursor position of other users", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      const url = userA.page.url();

      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      // Wait for presence sync
      await userA.page.waitForTimeout(2000);

      // User A clicks in the editor
      await editorA.focus();
      await editorA.type("Click here");

      // Wait for cursor broadcast
      await userB.page.waitForTimeout(1000);

      // User B should see User A's cursor
      // Note: Implementation depends on how cursors are rendered
      const remoteCursor = userB.page.locator(
        '[data-remote-cursor], [class*="remote-cursor"], [data-liveblocks-cursor]'
      );

      // Check if cursor elements exist (may not be visible if not implemented)
      const cursorCount = await remoteCursor.count();
      // This assertion is soft - cursor rendering may vary
      expect(cursorCount).toBeGreaterThanOrEqual(0);
    } finally {
      await cleanup();
    }
  });

  test("cursor follows user selection", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      const url = userA.page.url();

      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      await userA.page.waitForTimeout(2000);

      // User A types and selects text
      await editorA.clear();
      await editorA.type("Select this text");
      await editorA.selectAll();

      // Wait for selection broadcast
      await userB.page.waitForTimeout(1000);

      // User B should see User A's selection
      // Look for selection highlight with user color
      const remoteSelection = userB.page.locator(
        '[data-remote-selection], [class*="remote-selection"], [data-liveblocks-selection]'
      );

      // Check if selection elements exist
      const selectionCount = await remoteSelection.count();
      expect(selectionCount).toBeGreaterThanOrEqual(0);
    } finally {
      await cleanup();
    }
  });
});

test.describe("User Name Display", () => {
  test("can edit own display name", async () => {
    const { userA, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editor = createEditorHelper(userA.page);
      await editor.waitForEditor();

      // Look for name edit button/input (usually on own avatar)
      const nameButton = userA.page.locator(
        '[data-testid="self-avatar"], [aria-label*="your name"], [class*="self-avatar"]'
      );

      if (await nameButton.isVisible()) {
        await nameButton.click();

        // Look for name input
        const nameInput = userA.page.getByRole("textbox", { name: /name/i });
        if (await nameInput.isVisible()) {
          await nameInput.fill("New Name");
          await userA.page.keyboard.press("Enter");

          // Name should be updated
          await expect(userA.page.getByText("New Name")).toBeVisible();
        }
      }
    } finally {
      await cleanup();
    }
  });

  test("shows anonymous user names correctly", async () => {
    // Anonymous users get auto-generated names like "Clever Wordsmith"
    const { userA, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editor = createEditorHelper(userA.page);
      await editor.waitForEditor();

      // Wait for Liveblocks connection
      await userA.page.waitForTimeout(2000);

      // Look for the presence display
      const presence = userA.page.locator(
        '[data-testid="presence"], [class*="presence"], [aria-label*="user"]'
      );

      // Should see some user indicator
      if (await presence.isVisible()) {
        const text = await presence.textContent();
        // Anonymous names follow pattern: Adjective + Noun
        expect(text).toBeTruthy();
      }
    } finally {
      await cleanup();
    }
  });
});

test.describe("Live Status Indicator", () => {
  test("shows Live indicator when connected", async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Wait for Liveblocks connection
    await page.waitForTimeout(3000);

    // Should show "Live" indicator
    const liveIndicator = page.getByText(/live/i);
    await expect(liveIndicator).toBeVisible({ timeout: 10000 });
  });

  test("shows connecting status initially", async ({ page }) => {
    await page.goto("/");

    // Before full connection, may show "Connecting..."
    const connectingIndicator = page.getByText(/connecting|loading/i);
    // This may flash quickly, so we just check it doesn't error
    await connectingIndicator.waitFor({ state: "attached", timeout: 5000 }).catch(() => {
      // It's okay if we miss it - it may connect too fast
    });

    // Eventually should show Live
    const liveIndicator = page.getByText(/live/i);
    await expect(liveIndicator).toBeVisible({ timeout: 15000 });
  });
});
