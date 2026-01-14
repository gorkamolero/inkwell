import { test, expect } from "@playwright/test";

test.describe("Share Functionality", () => {
  test("share button opens share dialog", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Click share button
    await page.getByRole("button", { name: /share/i }).click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/share session/i)).toBeVisible();
  });

  test("can create share link via dialog", async ({ page }) => {
    // Track share API call
    let shareApiCalled = false;
    let shareSlug: string | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/sessions/") &&
        response.url().includes("/share") &&
        response.request().method() === "POST" &&
        response.status() === 200
      ) {
        shareApiCalled = true;
        try {
          const data = await response.json();
          shareSlug = data.shareSlug;
        } catch {
          // Response may already be consumed
        }
      }
    });

    await page.goto("/");

    // Wait for editor
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Click share button to open dialog
    await page.getByRole("button", { name: /share/i }).click();

    // Dialog should show "Create Share Link" button
    const createButton = page.getByRole("button", {
      name: /create share link/i,
    });
    await expect(createButton).toBeVisible();

    // Click to create share link
    await createButton.click();

    // Wait for API call to complete
    await page.waitForTimeout(2000);

    // Should now show the share URL input
    const shareInput = page.locator('input[readonly]');
    await expect(shareInput).toBeVisible({ timeout: 10000 });

    // Verify the share URL contains /s/
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toContain("/s/");
  });

  test("copy button copies share link to clipboard", async ({
    page,
    context,
  }) => {
    // Grant clipboard permission
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");

    // Wait for editor
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Open share dialog and create link
    await page.getByRole("button", { name: /share/i }).click();
    await page.getByRole("button", { name: /create share link/i }).click();

    // Wait for share URL to appear
    const shareInput = page.locator('input[readonly]');
    await expect(shareInput).toBeVisible({ timeout: 10000 });

    // Click copy button
    const copyButton = page.getByRole("button", { name: /copy/i });
    await copyButton.click();

    // Should show copied confirmation
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 3000 });
  });

  test("can access shared session via share link", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Open share dialog and create link
    await page.getByRole("button", { name: /share/i }).click();
    await page.getByRole("button", { name: /create share link/i }).click();

    // Wait for share URL
    const shareInput = page.locator('input[readonly]');
    await expect(shareInput).toBeVisible({ timeout: 10000 });

    // Get the share URL
    const shareUrl = await shareInput.inputValue();
    const shareSlug = shareUrl.split("/s/")[1];

    // Close dialog
    await page.getByRole("button", { name: /done/i }).click();

    // Navigate to share link
    await page.goto(`/s/${shareSlug}`);

    // Should load the collaborative editor page
    // The share page shows a collaborative editor with toolbar and "Live" indicator
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Should show "Live" indicator (Liveblocks connected)
    await expect(page.getByText(/live/i)).toBeVisible({ timeout: 10000 });
  });

  test("shared link loads without 404", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Open share dialog and create link
    await page.getByRole("button", { name: /share/i }).click();
    await page.getByRole("button", { name: /create share link/i }).click();

    // Wait for share URL
    const shareInput = page.locator('input[readonly]');
    await expect(shareInput).toBeVisible({ timeout: 10000 });

    const shareUrl = await shareInput.inputValue();
    const shareSlug = shareUrl.split("/s/")[1];

    // Navigate to share link
    await page.goto(`/s/${shareSlug}`);

    // Should not be a 404 page
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("not found", {
      ignoreCase: true,
    });
  });

  test("invalid share slug shows not found", async ({ page }) => {
    // Navigate to a non-existent share link
    await page.goto("/s/invalid-slug-that-does-not-exist-12345");

    // Should show not found
    await expect(page.locator("body")).toContainText(/not found|404/i, {
      timeout: 10000,
    });
  });
});
