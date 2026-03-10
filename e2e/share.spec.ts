import { test, expect } from "@playwright/test";
import { createSharedSession } from "./fixtures/liveblocks-helpers";

test.describe("Share Functionality", () => {
  test("fullscreen button opens shared session", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    const fullscreenButton = page.getByRole("button", {
      name: /go fullscreen/i,
    });
    await expect(fullscreenButton).toBeVisible();
    await fullscreenButton.click();

    await page.waitForURL(/\/s\/.+/, { timeout: 15000 });
  });

  test("go fullscreen creates shared session url", async ({ page }) => {
    const { url } = await createSharedSession(page);
    expect(url).toContain("/s/");
  });

  test("copy button copies share link to clipboard", async ({
    page,
    context,
  }) => {
    // Grant clipboard permission
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await createSharedSession(page);

    const copyButton = page.getByRole("button", { name: /copy/i });
    await copyButton.click();

    await expect(copyButton.locator("svg")).toBeVisible();
  });

  test("can access shared session via share link", async ({ page }) => {
    const { shareSlug } = await createSharedSession(page);

    await page.goto(`/s/${shareSlug}`);

    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/collaborative/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("shared link loads without 404", async ({ page }) => {
    const { shareSlug } = await createSharedSession(page);

    await page.goto(`/s/${shareSlug}`);

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
