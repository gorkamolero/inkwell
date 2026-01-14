import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

/**
 * Format Panel - Chapters Section Tests
 *
 * Tests for chapter configuration:
 * - Chapter numbering toggle and format
 * - Drop caps toggle and height
 */
test.describe("Format Panel - Chapters", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "chapter");
  });

  test("can toggle chapter numbering", async ({ page }) => {
    // Find the Chapter Numbering switch
    const numberingSwitch = page.getByRole("switch", { name: /chapter numbering/i });
    await expect(numberingSwitch).toBeVisible();

    const wasChecked = await numberingSwitch.isChecked();
    await numberingSwitch.click();
    await expect(numberingSwitch).toBeChecked({ checked: !wasChecked });

    // Toggle back
    await numberingSwitch.click();
    await expect(numberingSwitch).toBeChecked({ checked: wasChecked });
  });

  test("can change chapter numbering format", async ({ page }) => {
    // Ensure numbering is enabled first
    const numberingSwitch = page.getByRole("switch", { name: /chapter numbering/i });
    if (!(await numberingSwitch.isChecked())) {
      await numberingSwitch.click();
    }

    // Find the Format dropdown (first combobox after the switch in the Chapters section)
    // The format dropdown appears below "Format" label
    const formatSelect = page.locator("select").filter({ has: page.locator("option:has-text('Chapter 1, Chapter 2')") });
    await expect(formatSelect).toBeVisible();

    // Select Roman numerals format
    await formatSelect.selectOption({ label: "I, II, III..." });
    await expect(formatSelect).toHaveValue("{roman}");
  });

  test("can use numeric format", async ({ page }) => {
    const numberingSwitch = page.getByRole("switch", { name: /chapter numbering/i });
    if (!(await numberingSwitch.isChecked())) {
      await numberingSwitch.click();
    }

    const formatSelect = page.locator("select").filter({ has: page.locator("option:has-text('Chapter 1, Chapter 2')") });
    await formatSelect.selectOption({ label: "1, 2, 3..." });
    await expect(formatSelect).toHaveValue("{n}");
  });

  test("can use word format", async ({ page }) => {
    const numberingSwitch = page.getByRole("switch", { name: /chapter numbering/i });
    if (!(await numberingSwitch.isChecked())) {
      await numberingSwitch.click();
    }

    const formatSelect = page.locator("select").filter({ has: page.locator("option:has-text('Chapter 1, Chapter 2')") });
    await formatSelect.selectOption({ label: "One, Two, Three..." });
    await expect(formatSelect).toHaveValue("{word}");
  });

  test("shows preview with chapter format", async ({ page }) => {
    // Check preview section exists
    const preview = page.getByText("Preview").first();
    await expect(preview).toBeVisible();

    // Preview should show chapter text
    const chapterPreview = page.getByText("The Beginning");
    await expect(chapterPreview).toBeVisible();
  });
});

test.describe("Format Panel - Drop Caps", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "chapter");
  });

  test("can toggle drop caps", async ({ page }) => {
    const dropCapsSwitch = page.getByRole("switch", { name: /drop caps/i });
    await expect(dropCapsSwitch).toBeVisible();

    const wasChecked = await dropCapsSwitch.isChecked();
    await dropCapsSwitch.click();
    await expect(dropCapsSwitch).toBeChecked({ checked: !wasChecked });
  });

  test("can set drop caps height to 2 lines", async ({ page }) => {
    // Enable drop caps first
    const dropCapsSwitch = page.getByRole("switch", { name: /drop caps/i });
    if (!(await dropCapsSwitch.isChecked())) {
      await dropCapsSwitch.click();
    }

    // Click the "2" button for 2-line drop cap
    const twoLineButton = page.getByRole("button", { name: "2", exact: true });
    await expect(twoLineButton).toBeVisible();
    await twoLineButton.click();

    // Button should be selected (has blue background)
    await expect(twoLineButton).toHaveClass(/bg-brutal-blue/);
  });

  test("can set drop caps height to 4 lines", async ({ page }) => {
    const dropCapsSwitch = page.getByRole("switch", { name: /drop caps/i });
    if (!(await dropCapsSwitch.isChecked())) {
      await dropCapsSwitch.click();
    }

    const fourLineButton = page.getByRole("button", { name: "4", exact: true });
    await expect(fourLineButton).toBeVisible();
    await fourLineButton.click();

    await expect(fourLineButton).toHaveClass(/bg-brutal-blue/);
  });

  test("drop caps height buttons are visible when enabled", async ({ page }) => {
    const dropCapsSwitch = page.getByRole("switch", { name: /drop caps/i });
    if (!(await dropCapsSwitch.isChecked())) {
      await dropCapsSwitch.click();
    }

    // All height buttons should be visible
    await expect(page.getByRole("button", { name: "2", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "3", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "4", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "5", exact: true })).toBeVisible();
  });
});
