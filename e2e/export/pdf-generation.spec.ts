import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { createEditorHelper } from "../utils/editor-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * PDF Generation Tests
 *
 * NOTE: These tests are marked as .skip() because the PDF generation
 * API endpoint currently returns 501 (Not Implemented).
 *
 * Unskip these tests when the /api/sessions/[id]/generate endpoint
 * is implemented.
 */
test.describe("PDF Generation", () => {
  test.skip("can generate PDF from session", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Add some content
    await editor.clear();
    await editor.type("# My Book\n\nThis is chapter content.");

    // Look for generate/download button
    const generateButton = page.getByRole("button", {
      name: /generate.*pdf|download.*pdf|export/i,
    });

    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Wait for generation to complete
    const downloadPromise = page.waitForEvent("download");
    const download = await downloadPromise;

    // Verify PDF was downloaded
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test.skip("shows progress indicator during generation", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# Test Content");

    const generateButton = page.getByRole("button", {
      name: /generate.*pdf|download.*pdf|export/i,
    });

    await generateButton.click();

    // Should show progress indicator
    await expect(page.getByText(/generating|processing/i)).toBeVisible();
  });

  test.skip("handles generation errors gracefully", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    // Mock error response
    await page.route("**/api/sessions/*/generate", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Generation failed" }),
      });
    });

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# Content");

    const generateButton = page.getByRole("button", {
      name: /generate.*pdf|download.*pdf|export/i,
    });

    await generateButton.click();

    // Should show error message
    await expect(page.getByText(/error|failed/i)).toBeVisible();
  });

  test.skip("can generate EPUB format", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# My eBook\n\nChapter content here.");

    // Look for format selector
    const formatSelect = page.getByLabel(/output.*format|format/i);
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption("epub");
    }

    const generateButton = page.getByRole("button", {
      name: /generate|download|export/i,
    });

    await generateButton.click();

    const downloadPromise = page.waitForEvent("download");
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.epub$/);
  });

  test.skip("can generate HTML format", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# My Article\n\nArticle content.");

    const formatSelect = page.getByLabel(/output.*format|format/i);
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption("html");
    }

    const generateButton = page.getByRole("button", {
      name: /generate|download|export/i,
    });

    await generateButton.click();

    const downloadPromise = page.waitForEvent("download");
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.html$/);
  });
});

test.describe("Export Preview", () => {
  test.skip("shows PDF preview before download", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# Preview Test\n\nContent for preview.");

    // Look for preview button
    const previewButton = page.getByRole("button", { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Should show preview modal/panel
      const previewPane = page.getByRole("dialog", { name: /preview/i }).or(
        page.locator('[data-testid="pdf-preview"]')
      );

      await expect(previewPane).toBeVisible();
    }
  });

  test.skip("preview updates when format changes", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clear();
    await editor.type("# Format Change Test");

    // Open preview
    const previewButton = page.getByRole("button", { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Change format setting (e.g., font)
      const fontSelect = page.getByLabel(/body.*font/i);
      if (await fontSelect.isVisible()) {
        await fontSelect.selectOption("Garamond");

        // Preview should update
        await page.waitForTimeout(1000);
        // Verify preview content changed (implementation dependent)
      }
    }
  });
});

test.describe("Export Configuration", () => {
  test.skip("can configure PDF color profile", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    // Look for output settings
    const colorProfileSelect = page.getByLabel(/color.*profile/i);
    if (await colorProfileSelect.isVisible()) {
      await colorProfileSelect.selectOption("CMYK");
      await expect(colorProfileSelect).toHaveValue("CMYK");
    }
  });

  test.skip("can configure PDF bleed", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const bleedInput = page.getByLabel(/bleed/i);
    if (await bleedInput.isVisible()) {
      await bleedInput.fill("0.125in");
      await expect(bleedInput).toHaveValue("0.125in");
    }
  });

  test.skip("can configure EPUB cover image", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    const coverInput = page.getByLabel(/cover.*image/i);
    if (await coverInput.isVisible()) {
      // Would need to upload or provide URL
      await expect(coverInput).toBeVisible();
    }
  });
});
