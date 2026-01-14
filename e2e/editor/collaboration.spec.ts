import { test, expect, chromium } from "@playwright/test";
import {
  setupCollaborationTest,
  createSharedSession,
} from "../fixtures/liveblocks-helpers";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Real-Time Collaboration Tests
 *
 * These tests use real Liveblocks rooms for collaboration testing.
 * They require two browser contexts simulating two users.
 */
test.describe("Real-Time Collaboration", () => {
  test("changes from user A appear for user B", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      // User A creates a shared session
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      // Get the session URL (assuming it's in the address bar or share dialog)
      const url = userA.page.url();

      // User B joins the same session
      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      // Wait for Liveblocks connection
      await userA.page.waitForTimeout(2000);
      await userB.page.waitForTimeout(2000);

      // User A types something
      await editorA.clear();
      await editorA.type("Hello from User A");

      // Wait for sync
      await userB.page.waitForTimeout(2000);

      // User B should see the change
      const contentB = await editorB.getTextContent();
      expect(contentB).toContain("Hello from User A");
    } finally {
      await cleanup();
    }
  });

  test("changes from user B appear for user A", async () => {
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
      await userB.page.waitForTimeout(2000);

      // User B types something
      await editorB.clear();
      await editorB.type("Hello from User B");

      // Wait for sync
      await userA.page.waitForTimeout(2000);

      // User A should see the change
      const contentA = await editorA.getTextContent();
      expect(contentA).toContain("Hello from User B");
    } finally {
      await cleanup();
    }
  });

  test("concurrent edits merge correctly (CRDT)", async () => {
    const { userA, userB, cleanup } = await setupCollaborationTest();

    try {
      await userA.page.goto("/");
      const editorA = createEditorHelper(userA.page);
      await editorA.waitForEditor();

      const url = userA.page.url();

      await userB.page.goto(url);
      const editorB = createEditorHelper(userB.page);
      await editorB.waitForEditor();

      // Wait for sync
      await userA.page.waitForTimeout(2000);

      // Clear content
      await editorA.clear();
      await userA.page.waitForTimeout(500);

      // Both users type at the same time
      await Promise.all([
        editorA.type("AAA"),
        editorB.type("BBB"),
      ]);

      // Wait for CRDT merge
      await userA.page.waitForTimeout(3000);

      // Both pages should have merged content
      const contentA = await editorA.getTextContent();
      const contentB = await editorB.getTextContent();

      // Both should have both pieces of text
      expect(contentA).toContain("AAA");
      expect(contentA).toContain("BBB");
      expect(contentB).toContain("AAA");
      expect(contentB).toContain("BBB");

      // Content should be identical after sync
      expect(contentA).toBe(contentB);
    } finally {
      await cleanup();
    }
  });

  test("formatting changes sync correctly", async () => {
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

      // User A types and makes it bold
      await editorA.clear();
      await editorA.type("Bold text");
      await editorA.selectAll();
      await editorA.bold();

      // Wait for sync
      await userB.page.waitForTimeout(2000);

      // User B should see bold text
      await editorB.expectBold("Bold text");
    } finally {
      await cleanup();
    }
  });

  test("deleted content syncs correctly", async () => {
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

      // User A types content
      await editorA.clear();
      await editorA.type("This will be deleted");
      await userB.page.waitForTimeout(1000);

      // Verify B sees it
      let contentB = await editorB.getTextContent();
      expect(contentB).toContain("This will be deleted");

      // User A deletes content
      await editorA.clear();
      await userB.page.waitForTimeout(2000);

      // User B should see empty editor
      contentB = await editorB.getTextContent();
      expect(contentB.trim()).toBe("");
    } finally {
      await cleanup();
    }
  });
});

test.describe("Shared Session Collaboration", () => {
  test("user can share session via link", async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Click share button
    const shareButton = page.getByRole("button", { name: /share/i });
    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Should see share dialog with link
      const shareInput = page.locator('input[readonly]').first();
      await expect(shareInput).toBeVisible({ timeout: 5000 });

      const shareUrl = await shareInput.inputValue();
      expect(shareUrl).toContain("/s/");
    }
  });

  test("shared session is accessible via link", async ({ page, context }) => {
    // Create a session and get share link
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Add some content
    await editor.clear();
    await editor.type("Shared content");

    // Get share link
    const shareButton = page.getByRole("button", { name: /share/i });
    if (await shareButton.isVisible()) {
      await shareButton.click();

      const shareInput = page.locator('input[readonly]').first();
      await shareInput.waitFor({ state: "visible", timeout: 5000 });

      const shareUrl = await shareInput.inputValue();

      // Close dialog
      await page.keyboard.press("Escape");

      // Open new tab with share link
      const newPage = await context.newPage();
      await newPage.goto(shareUrl);

      const newEditor = createEditorHelper(newPage);
      await newEditor.waitForEditor();

      // Should see the shared content
      const content = await newEditor.getTextContent();
      expect(content).toContain("Shared content");

      await newPage.close();
    }
  });
});
