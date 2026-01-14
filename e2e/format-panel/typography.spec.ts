import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

/**
 * Format Panel - Typography Section Tests
 *
 * Tests for typography configuration:
 * - Body font, size, line height
 * - Heading font
 */
test.describe("Format Panel - Typography", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "typography");
  });

  test("can change body font", async ({ page }) => {
    // Find the combobox that follows "Body Font" text
    const select = page.locator("div:has(> :text('Body Font')) > select, div:has(> :text('Body Font')) + select").first();

    // Alternative: use the combobox role with text context
    const bodyFontCombo = page.getByRole("combobox").first();

    await expect(bodyFontCombo).toBeVisible();
    await bodyFontCombo.selectOption("Georgia");
    await expect(bodyFontCombo).toHaveValue("Georgia");
  });

  test("can change heading font", async ({ page }) => {
    // Heading font is the second combobox
    const headingFontCombo = page.getByRole("combobox").nth(1);

    await expect(headingFontCombo).toBeVisible();
    await headingFontCombo.selectOption("Playfair Display");
    await expect(headingFontCombo).toHaveValue("Playfair Display");
  });

  test("can change body size", async ({ page }) => {
    // Body size is the third combobox
    const bodySizeCombo = page.getByRole("combobox").nth(2);

    await expect(bodySizeCombo).toBeVisible();
    await bodySizeCombo.selectOption("12pt");
    await expect(bodySizeCombo).toHaveValue("12pt");
  });

  test("can adjust line height", async ({ page }) => {
    // Line height is the fourth combobox
    const lineHeightCombo = page.getByRole("combobox").nth(3);

    await expect(lineHeightCombo).toBeVisible();
    await lineHeightCombo.selectOption({ label: "Loose (1.6)" });
    await expect(lineHeightCombo).toHaveValue("1.6");
  });

  test("typography preview shows sample text", async ({ page }) => {
    // Preview should show the sample text
    const preview = page.getByText("The quick brown fox");
    await expect(preview).toBeVisible();
  });
});
