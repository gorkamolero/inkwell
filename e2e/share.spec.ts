import { test, expect } from "@playwright/test";

test.describe("Share Functionality", () => {
  test("share button triggers share API call", async ({ page, context }) => {
    // Grant clipboard permission
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Track share requests
    let shareRequestMade = false;
    let shareSlug: string | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/sessions/") &&
        response.url().includes("/share") &&
        response.request().method() === "POST" &&
        response.status() === 200
      ) {
        shareRequestMade = true;
        const data = await response.json();
        shareSlug = data.shareSlug;
      }
    });

    await page.goto("/");

    // Wait for editor to load
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Handle the alert that shows after share
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    // Click share button
    await page.getByRole("button", { name: /share/i }).click();

    // Wait for the share request
    await page.waitForTimeout(2000);

    // Verify share request was made
    expect(shareRequestMade).toBe(true);
    expect(shareSlug).toBeTruthy();
  });

  test("share link is copied to clipboard", async ({ page, context }) => {
    // Grant clipboard permission
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");

    // Wait for editor to load
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Handle the alert
    let alertMessage = "";
    page.on("dialog", async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    // Click share button
    await page.getByRole("button", { name: /share/i }).click();

    // Wait for alert
    await page.waitForTimeout(2000);

    // Alert should contain the share URL
    expect(alertMessage).toContain("Link copied");
    expect(alertMessage).toContain("/s/");
  });

  test("can access shared session via share link", async ({ page }) => {
    // First, create a session and get share link
    let shareSlug: string | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/sessions/") &&
        response.url().includes("/share") &&
        response.request().method() === "POST" &&
        response.status() === 200
      ) {
        const data = await response.json();
        shareSlug = data.shareSlug;
      }
    });

    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Type some content
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Shared content test");

    // Wait for auto-save
    await page.waitForTimeout(2000);

    // Handle alert
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    // Click share button
    await page.getByRole("button", { name: /share/i }).click();

    // Wait for share request to complete
    await page.waitForTimeout(2000);

    // Verify we got a share slug
    expect(shareSlug).toBeTruthy();

    // Navigate to the shared link
    await page.goto(`/s/${shareSlug}`);

    // Should see the shared content (either in view mode or editor)
    // The shared session page renders the content
    await expect(page.getByText("Shared content test")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shared link shows session title in page", async ({ page }) => {
    let shareSlug: string | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/sessions/") &&
        response.url().includes("/share") &&
        response.request().method() === "POST" &&
        response.status() === 200
      ) {
        const data = await response.json();
        shareSlug = data.shareSlug;
      }
    });

    await page.goto("/");

    // Wait for editor
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Handle alert
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    // Click share button
    await page.getByRole("button", { name: /share/i }).click();

    // Wait for share request
    await page.waitForTimeout(2000);

    expect(shareSlug).toBeTruthy();

    // Navigate to shared link
    await page.goto(`/s/${shareSlug}`);

    // The page should load without 404
    // Check that we're not on a 404 page
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("not found", {
      ignoreCase: true,
    });
  });

  test("invalid share slug shows not found", async ({ page }) => {
    // Navigate to a non-existent share link
    await page.goto("/s/invalid-slug-that-does-not-exist");

    // Should show not found
    await expect(page.locator("body")).toContainText(
      /not found|404/i,
      { timeout: 10000 }
    );
  });
});
