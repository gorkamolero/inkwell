import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

/**
 * Format Panel - Page Layout Section Tests
 *
 * Tests for page layout configuration:
 * - Page size (preset buttons and custom dimensions)
 * - Margin presets and custom values
 */
test.describe("Format Panel - Page Layout", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "page layout");
  });

  test("can select 6x9 page size", async ({ page }) => {
    const sizeButton = page.getByRole("button", { name: '6" x 9"' });
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/bg-brutal-blue/);
  });

  test("can select 5.5x8.5 page size", async ({ page }) => {
    const sizeButton = page.getByRole("button", { name: '5.5" x 8.5"' });
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/bg-brutal-blue/);
  });

  test("can select A5 page size", async ({ page }) => {
    const sizeButton = page.getByRole("button", { name: "A5" });
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/bg-brutal-blue/);
  });

  test("can select US Letter page size", async ({ page }) => {
    const sizeButton = page.getByRole("button", { name: "US Letter" });
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/bg-brutal-blue/);
  });

  test("can select standard margins preset", async ({ page }) => {
    const marginButton = page.getByRole("button", { name: "Standard", exact: true });
    await expect(marginButton).toBeVisible();
    await marginButton.click();
    await expect(marginButton).toHaveClass(/bg-brutal-yellow/);
  });

  test("can select wide margins preset", async ({ page }) => {
    const marginButton = page.getByRole("button", { name: "Wide Margins" });
    await expect(marginButton).toBeVisible();
    await marginButton.click();
    await expect(marginButton).toHaveClass(/bg-brutal-yellow/);
  });

  test("can select narrow margins preset", async ({ page }) => {
    const marginButton = page.getByRole("button", { name: "Narrow" });
    await expect(marginButton).toBeVisible();
    await marginButton.click();
    await expect(marginButton).toHaveClass(/bg-brutal-yellow/);
  });

  test("can edit top margin", async ({ page }) => {
    const topInput = page.getByLabel("Top");
    await expect(topInput).toBeVisible();
    await topInput.fill("1in");
    await expect(topInput).toHaveValue("1in");
  });

  test("can edit bottom margin", async ({ page }) => {
    const bottomInput = page.getByLabel("Bottom");
    await expect(bottomInput).toBeVisible();
    await bottomInput.fill("1in");
    await expect(bottomInput).toHaveValue("1in");
  });

  test("can edit outer margin", async ({ page }) => {
    const outerInput = page.getByLabel("Outer");
    await expect(outerInput).toBeVisible();
    await outerInput.fill("0.75in");
    await expect(outerInput).toHaveValue("0.75in");
  });

  test("can edit gutter margin", async ({ page }) => {
    const gutterInput = page.getByLabel("Gutter");
    await expect(gutterInput).toBeVisible();
    await gutterInput.fill("0.5in");
    await expect(gutterInput).toHaveValue("0.5in");
  });

  test("shows preview with dimensions", async ({ page }) => {
    // Preview should show page dimensions
    const dimensionText = page.getByText(/\d+in x \d+in/);
    await expect(dimensionText).toBeVisible();
  });
});
