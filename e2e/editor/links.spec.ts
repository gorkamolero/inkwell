import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Link Feature Tests
 *
 * Tests for autolinking (type URL + space) and link paste functionality.
 */

test.describe("Autolinking", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("typing URL followed by space creates a link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Check out https://example.com for more info");

    // Wait for autolink to process
    await page.waitForTimeout(500);

    // Should have a clickable link
    await editor.expectLink("https://example.com", "https://example.com");
  });

  test("typing www URL followed by space creates a link with https", async ({
    page,
  }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Visit www.google.com today");

    await page.waitForTimeout(500);

    // www URLs should be prefixed with https://
    await editor.expectLink("www.google.com", "https://www.google.com");
  });

  test("typing email address creates mailto link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("Contact us at hello@example.com for help");

    await page.waitForTimeout(500);

    await editor.expectLink("hello@example.com", "mailto:hello@example.com");
  });

  test("partial URL without space does not create link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("https://example.com");
    // Don't press space - URL should not be linked yet

    await page.waitForTimeout(500);

    // The text should exist but not be a link
    await expect(page.getByText("https://example.com")).toBeVisible();
    // No anchor tag should exist
    await editor.expectNoLink("https://example.com");
  });

  test("multiple URLs in same paragraph all become links", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.type("See https://one.com and https://two.com for details");

    await page.waitForTimeout(500);

    await editor.expectLink("https://one.com");
    await editor.expectLink("https://two.com");
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

    await page.waitForTimeout(500);

    // Pasted URL should become a link immediately
    await editor.expectLink("https://pasted-link.com", "https://pasted-link.com");
  });

  test("pasting www URL creates link with https prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("www.pasted-site.com");

    await page.waitForTimeout(500);

    await editor.expectLink("www.pasted-site.com", "https://www.pasted-site.com");
  });

  test("pasting non-URL text does not create a link", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("This is just regular text");

    await page.waitForTimeout(500);

    await expect(page.getByText("This is just regular text")).toBeVisible();
    // Should not have any links
    await expect(editor.editorContainer.locator("a")).toHaveCount(0);
  });

  test("pasting URL with trailing space works correctly", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.pasteText("https://trimmed-url.com   ");

    await page.waitForTimeout(500);

    await editor.expectLink("https://trimmed-url.com", "https://trimmed-url.com");
  });
});

test.describe("Link Interaction", () => {
  test("links in editor are clickable", async ({ page }) => {
    const editor = createEditorHelper(page);

    await page.goto("/");
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("Visit https://example.com now");

    await page.waitForTimeout(500);

    // Link should have proper href
    const link = editor.editorContainer.locator("a").filter({
      hasText: "https://example.com",
    });
    await expect(link).toHaveAttribute("href", "https://example.com");
  });
});
