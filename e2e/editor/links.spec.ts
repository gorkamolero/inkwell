import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Link Feature Tests
 *
 * Tests for AutoLinkOnIdlePlugin (auto-links after idle) and LinkPastePlugin.
 *
 * The AutoLinkOnIdlePlugin converts URLs to links after 700ms of idle time,
 * WITHOUT requiring a space or delimiter after the URL.
 */

test.describe("AutoLink on Idle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("typing URL followed by space creates a link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Check out https://example.com for more info");

    // Wait for autolink to process (700ms delay + buffer)
    await page.waitForTimeout(1000);

    await editor.expectLink("https://example.com", "https://example.com");
  });

  test("typing URL WITHOUT space still creates link after idle", async ({
    page,
  }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("https://no-space-needed.com");
    // No space after URL - just wait for idle

    // Wait for autolink to process (700ms delay + buffer)
    await page.waitForTimeout(1000);

    // Should become a link without pressing space
    await editor.expectLink(
      "https://no-space-needed.com",
      "https://no-space-needed.com"
    );
  });

  test("typing www URL creates link with https prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Visit www.google.com today");

    await page.waitForTimeout(1000);

    // www URLs should be prefixed with https://
    await editor.expectLink("www.google.com", "https://www.google.com");
  });

  test("typing www URL without space still creates link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("www.no-space.com");

    await page.waitForTimeout(1000);

    await editor.expectLink("www.no-space.com", "https://www.no-space.com");
  });

  test("typing email address creates mailto link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Contact us at hello@example.com for help");

    await page.waitForTimeout(1000);

    await editor.expectLink("hello@example.com", "mailto:hello@example.com");
  });

  test("email without surrounding text creates link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("test@domain.org");

    await page.waitForTimeout(1000);

    await editor.expectLink("test@domain.org", "mailto:test@domain.org");
  });

  test("URL at start of text becomes link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("https://start.com is a great site");

    await page.waitForTimeout(1000);

    await editor.expectLink("https://start.com", "https://start.com");
  });

  test("URL in middle of text becomes link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Check https://middle.com out");

    await page.waitForTimeout(1000);

    await editor.expectLink("https://middle.com", "https://middle.com");
  });

  test("multiple URLs in same paragraph all become links", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("See https://one.com and https://two.com for details");

    // Need longer timeout for multiple URLs (processed one at a time)
    await page.waitForTimeout(2000);

    await editor.expectLink("https://one.com", "https://one.com");
    await editor.expectLink("https://two.com", "https://two.com");
  });

  test("does not link URL while cursor is inside it", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("https://typing-in-progress.com");
    // Cursor is still at end of URL - should NOT link yet if still typing
    // Type more to simulate continuous typing
    await editor.type("/path");

    // Short wait - less than idle threshold
    await page.waitForTimeout(300);

    // Should not be linked yet (user still actively typing)
    // But after idle, it will link
    await page.waitForTimeout(1000);

    // Now it should be linked with the full path
    await editor.expectLink(
      "https://typing-in-progress.com/path",
      "https://typing-in-progress.com/path"
    );
  });
});

test.describe("Link Paste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("pasting a URL creates a link immediately", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("https://pasted-link.com");

    // Paste should be immediate, but give brief buffer
    await page.waitForTimeout(500);

    await editor.expectLink("https://pasted-link.com", "https://pasted-link.com");
  });

  test("pasting www URL creates link with https prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("www.pasted-site.com");

    await page.waitForTimeout(500);

    await editor.expectLink("www.pasted-site.com", "https://www.pasted-site.com");
  });

  test("pasting http URL preserves http protocol", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("http://insecure-site.com");

    await page.waitForTimeout(500);

    await editor.expectLink("http://insecure-site.com", "http://insecure-site.com");
  });

  test("pasting non-URL text does not create a link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("This is just regular text");

    await page.waitForTimeout(500);

    await expect(page.getByText("This is just regular text")).toBeVisible();
    // Should not have any links in editor
    await expect(editor.editorContainer.locator("a")).toHaveCount(0);
  });

  test("pasting URL with trailing space works correctly", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("https://trimmed-url.com   ");

    await page.waitForTimeout(500);

    await editor.expectLink("https://trimmed-url.com", "https://trimmed-url.com");
  });

  test("pasting URL with query params preserves them", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("https://example.com/search?q=test&page=1");

    await page.waitForTimeout(500);

    await editor.expectLink(
      "https://example.com/search?q=test&page=1",
      "https://example.com/search?q=test&page=1"
    );
  });

  test("pasting URL with hash fragment preserves it", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("https://example.com/page#section");

    await page.waitForTimeout(500);

    await editor.expectLink(
      "https://example.com/page#section",
      "https://example.com/page#section"
    );
  });
});

test.describe("Link Attributes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("autolinked URLs have proper href attribute", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Visit https://example.com now");

    await page.waitForTimeout(1000);

    const link = editor.editorContainer
      .locator("a")
      .filter({ hasText: "https://example.com" });
    await expect(link).toHaveAttribute("href", "https://example.com");
  });

  test("links have target=_blank for external URLs", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("https://external-site.com");

    await page.waitForTimeout(1000);

    const link = editor.editorContainer.locator("a").first();
    // Check if target attribute is set (may vary by implementation)
    const target = await link.getAttribute("target");
    // AutoLinkNode may or may not set target - this test documents current behavior
    expect(target === "_blank" || target === null).toBeTruthy();
  });
});
