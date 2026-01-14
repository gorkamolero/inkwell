import { test, expect } from "@playwright/test";

test.describe("Session Management", () => {
  test("creates a new session on page load", async ({ page }) => {
    // Intercept the session creation API
    let sessionCreated = false;
    let sessionId: string | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/sessions") &&
        response.request().method() === "POST" &&
        response.status() === 201
      ) {
        sessionCreated = true;
        const data = await response.json();
        sessionId = data.session?.id;
      }
    });

    await page.goto("/");

    // Wait for editor to load (session is created during this time)
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Verify session was created
    expect(sessionCreated).toBe(true);
    expect(sessionId).toBeTruthy();
  });

  test("auto-saves content after typing", async ({ page }) => {
    // Track save requests
    let saveRequestCount = 0;

    page.on("request", (request) => {
      if (
        request.url().includes("/api/sessions/") &&
        request.method() === "PATCH"
      ) {
        saveRequestCount++;
      }
    });

    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Type something
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Test auto-save content");

    // Wait for auto-save (debounced at 1 second)
    await page.waitForTimeout(2000);

    // Verify at least one save request was made
    expect(saveRequestCount).toBeGreaterThan(0);
  });

  test("shows saving status indicator", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Type to trigger save
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Trigger save");

    // Should see "Saving..." or "Saved" status
    // The status cycles: idle -> saving -> saved -> idle
    await expect(
      page.getByText(/saving|saved|auto-saving/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows saved confirmation after save completes", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Type to trigger save
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Content to save");

    // Wait for save to complete (debounce + request)
    await page.waitForTimeout(3000);

    // Should see "Saved" status
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  });

  test("word count updates as you type", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Get initial word count
    const wordCountText = page.getByText(/\d+ words?/);
    await expect(wordCountText).toBeVisible({ timeout: 5000 });

    // Clear and type specific content
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("one two three four five");

    // Wait a moment for the word count to update
    await page.waitForTimeout(500);

    // Should show 5 words
    await expect(page.getByText(/5 words/)).toBeVisible({ timeout: 2000 });
  });

  test("can change content type via dropdown", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Click the type selector (initially "Book")
    await page.getByRole("button", { name: /book/i }).click();

    // Should see dropdown with options - items include descriptions
    const articleOption = page.getByRole("button", {
      name: /article.*blog posts/i,
    });
    await expect(articleOption).toBeVisible();

    // Click on Article option in the dropdown
    await articleOption.click();

    // Dropdown should close - the selected item is now the visible button
    // Wait a moment for dropdown to close
    await page.waitForTimeout(100);

    // Verify the type changed (button text should contain Article)
    await expect(page.locator('[data-testid="type-selector"]').or(
      page.getByRole("button", { name: /^article$/i })
    ).first()).toBeVisible();
  });

  test("supports markdown shortcuts", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Clear editor
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");

    // Type markdown heading
    await page.keyboard.type("# This is a heading");
    await page.keyboard.press("Enter");

    // The heading should be rendered (h1 element created by markdown transform)
    // Note: Lexical transforms "# " at start of line to heading
    await expect(
      page.locator("h1").filter({ hasText: "This is a heading" })
    ).toBeVisible({ timeout: 2000 });
  });

  test("supports bold formatting with keyboard shortcut", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Clear and type
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("normal ");

    // Type bold text
    await page.keyboard.press("ControlOrMeta+b");
    await page.keyboard.type("bold text");
    await page.keyboard.press("ControlOrMeta+b");

    // Verify bold element exists
    await expect(page.locator("strong, b").filter({ hasText: "bold text" })).toBeVisible();
  });

  test("supports italic formatting with keyboard shortcut", async ({ page }) => {
    await page.goto("/");

    // Wait for editor
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Clear and type
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("normal ");

    // Type italic text
    await page.keyboard.press("ControlOrMeta+i");
    await page.keyboard.type("italic text");
    await page.keyboard.press("ControlOrMeta+i");

    // Verify italic element exists
    await expect(page.locator("em, i").filter({ hasText: "italic text" })).toBeVisible();
  });
});
