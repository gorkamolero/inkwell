import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

/**
 * Format Panel - Headers & Footers Section Tests
 *
 * Tests for headers and footers configuration:
 * - Headers: enable toggle, left/right templates, text style
 * - Footers: enable toggle, page number position and format
 */
test.describe("Format Panel - Headers", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "headers");
  });

  test("can toggle headers", async ({ page }) => {
    const headersSwitch = page.getByRole("switch", { name: /enable headers/i });
    await expect(headersSwitch).toBeVisible();

    const wasChecked = await headersSwitch.isChecked();
    await headersSwitch.click();
    await expect(headersSwitch).toBeChecked({ checked: !wasChecked });

    // Toggle back
    await headersSwitch.click();
    await expect(headersSwitch).toBeChecked({ checked: wasChecked });
  });

  test("can change left page header template", async ({ page }) => {
    // Ensure headers are enabled
    const headersSwitch = page.getByRole("switch", { name: /enable headers/i });
    if (!(await headersSwitch.isChecked())) {
      await headersSwitch.click();
    }

    // Find the Left Page dropdown
    const leftPageSelect = page.locator("select").filter({ has: page.locator("option:has-text('Author Name')") }).first();
    await expect(leftPageSelect).toBeVisible();

    await leftPageSelect.selectOption({ label: "Chapter Title" });
    await expect(leftPageSelect).toHaveValue("{chapter}");
  });

  test("can change right page header template", async ({ page }) => {
    const headersSwitch = page.getByRole("switch", { name: /enable headers/i });
    if (!(await headersSwitch.isChecked())) {
      await headersSwitch.click();
    }

    // Right Page is the second dropdown with same options
    const rightPageSelect = page.locator("select").filter({ has: page.locator("option:has-text('Author Name')") }).nth(1);
    await expect(rightPageSelect).toBeVisible();

    await rightPageSelect.selectOption({ label: "Book Title" });
    await expect(rightPageSelect).toHaveValue("{title}");
  });

  test("can toggle hide on chapter start", async ({ page }) => {
    const headersSwitch = page.getByRole("switch", { name: /enable headers/i });
    if (!(await headersSwitch.isChecked())) {
      await headersSwitch.click();
    }

    const hideSwitch = page.getByRole("switch", { name: /hide on chapter start/i });
    await expect(hideSwitch).toBeVisible();

    const wasChecked = await hideSwitch.isChecked();
    await hideSwitch.click();
    await expect(hideSwitch).toBeChecked({ checked: !wasChecked });
  });

  test("can change header text style to uppercase", async ({ page }) => {
    const headersSwitch = page.getByRole("switch", { name: /enable headers/i });
    if (!(await headersSwitch.isChecked())) {
      await headersSwitch.click();
    }

    const uppercaseButton = page.getByRole("button", { name: "UPPERCASE", exact: true });
    await expect(uppercaseButton).toBeVisible();
    await uppercaseButton.click();

    // Button should be selected (has blue background)
    await expect(uppercaseButton).toHaveClass(/bg-brutal-blue/);
  });
});

test.describe("Format Panel - Footers", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "headers");
  });

  test("can toggle footers", async ({ page }) => {
    const footersSwitch = page.getByRole("switch", { name: /enable footers/i });
    await expect(footersSwitch).toBeVisible();

    const wasChecked = await footersSwitch.isChecked();
    await footersSwitch.click();
    await expect(footersSwitch).toBeChecked({ checked: !wasChecked });
  });

  test("can change page number position to left", async ({ page }) => {
    const footersSwitch = page.getByRole("switch", { name: /enable footers/i });
    if (!(await footersSwitch.isChecked())) {
      await footersSwitch.click();
    }

    const leftButton = page.getByRole("button", { name: "Left", exact: true });
    await expect(leftButton).toBeVisible();
    await leftButton.click();

    // Button should be selected (has yellow background)
    await expect(leftButton).toHaveClass(/bg-brutal-yellow/);
  });

  test("can change page number position to right", async ({ page }) => {
    const footersSwitch = page.getByRole("switch", { name: /enable footers/i });
    if (!(await footersSwitch.isChecked())) {
      await footersSwitch.click();
    }

    const rightButton = page.getByRole("button", { name: "Right", exact: true });
    await expect(rightButton).toBeVisible();
    await rightButton.click();

    await expect(rightButton).toHaveClass(/bg-brutal-yellow/);
  });

  test("can change page number format", async ({ page }) => {
    const footersSwitch = page.getByRole("switch", { name: /enable footers/i });
    if (!(await footersSwitch.isChecked())) {
      await footersSwitch.click();
    }

    // Find the page number format dropdown
    const formatSelect = page.locator("select").filter({ has: page.locator("option:has-text('Page 1, Page 2')") });
    await expect(formatSelect).toBeVisible();

    await formatSelect.selectOption({ label: "- 1 -, - 2 -..." });
    await expect(formatSelect).toHaveValue("- {n} -");
  });

  test("preview shows page number", async ({ page }) => {
    // Check preview section exists with page number
    const preview = page.getByText("42");
    await expect(preview).toBeVisible();
  });
});
