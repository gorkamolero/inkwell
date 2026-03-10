import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and displays hero section", async ({ page }) => {
    await page.goto("/");

    // Check for the main headline (split across elements)
    await expect(
      page.getByRole("heading", { name: /write together/i })
    ).toBeVisible();

    // Check for the "Start writing" label (the badge above the editor)
    await expect(page.getByText(/start writing/i).first()).toBeVisible();

    // Check for subtext - actual text is "No account required. Content saves automatically."
    await expect(page.getByText(/no account required/i)).toBeVisible();
  });

  test("editor renders and becomes interactive", async ({ page }) => {
    await page.goto("/");

    // Wait for the editor to load (loading state disappears)
    // The editor shows a loading skeleton initially
    await expect(page.locator(".hotpress-editor")).toBeVisible({
      timeout: 15000,
    });

    // The ContentEditable should be present
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 10000 });
  });

  test("editor shows default content after loading", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Should show default "Start writing something great" heading
    await expect(
      page.getByText("Start writing something great")
    ).toBeVisible({ timeout: 5000 });
  });

  test("can type in the editor", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Clear the editor and type new content
    await editor.click();
    // Select all and delete to clear
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Hello, Hotpress!");

    // Verify the typed content appears
    await expect(page.getByText("Hello, Hotpress!")).toBeVisible();
  });

  test("displays status bar with word count", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    const editor = page.getByRole("textbox", { name: /editor/i });
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Status bar should show word count
    await expect(page.getByText(/\d+ words?/)).toBeVisible({ timeout: 5000 });
  });

  test("displays type selector in status bar", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    await expect(page.getByRole("textbox", { name: /editor/i })).toBeVisible({
      timeout: 15000,
    });

    // Type selector should be visible with "Book" as default
    await expect(page.getByRole("button", { name: /book/i })).toBeVisible();
  });

  test("displays fullscreen button", async ({ page }) => {
    await page.goto("/");

    // Wait for editor to load
    await expect(page.getByRole("textbox", { name: /editor/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByRole("button", { name: /go fullscreen/i })
    ).toBeVisible();
  });

  test("displays marketing sections", async ({ page }) => {
    await page.goto("/");

    // Scroll down to see other sections
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait a moment for lazy-loaded content
    await page.waitForTimeout(500);

    // How It Works section
    await expect(page.getByText(/how it works/i)).toBeVisible();

    // Features section (actual heading is "Everything you need to write")
    await expect(page.getByText(/everything you need/i)).toBeVisible();

    // Pricing section - look for pricing-related text
    await expect(page.getByText(/free|pro|enterprise/i).first()).toBeVisible();
  });
});
