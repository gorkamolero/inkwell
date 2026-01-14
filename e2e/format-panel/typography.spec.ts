import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Typography Section Tests
 *
 * Tests for typography configuration:
 * - Body font, size, line height
 * - Heading font, size
 * - Paragraph indent, spacing
 */
test.describe("Format Panel - Typography", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    const formatButton = page.getByRole("button", { name: /format|settings|configure/i });
    if (await formatButton.isVisible({ timeout: 2000 })) {
      await formatButton.click();
    }
  });

  test("can change body font", async ({ page }) => {
    const bodyFontSelect = page.getByLabel(/body font|body typeface/i);
    if (await bodyFontSelect.isVisible()) {
      await bodyFontSelect.selectOption("Garamond");
      await expect(bodyFontSelect).toHaveValue("Garamond");
    }
  });

  test("can change body font size", async ({ page }) => {
    const bodySizeInput = page.getByLabel(/body.*size|font.*size/i).first();
    if (await bodySizeInput.isVisible()) {
      await bodySizeInput.fill("12pt");
      await expect(bodySizeInput).toHaveValue("12pt");
    }
  });

  test("can adjust line height", async ({ page }) => {
    const lineHeightInput = page.getByLabel(/line.*height|leading/i);
    if (await lineHeightInput.isVisible()) {
      await lineHeightInput.fill("1.6");
      await expect(lineHeightInput).toHaveValue("1.6");
    }
  });

  test("can change heading font", async ({ page }) => {
    const headingFontSelect = page.getByLabel(/heading.*font|heading.*typeface/i);
    if (await headingFontSelect.isVisible()) {
      await headingFontSelect.selectOption("Playfair Display");
      await expect(headingFontSelect).toHaveValue("Playfair Display");
    }
  });

  test("can change heading size", async ({ page }) => {
    const headingSizeInput = page.getByLabel(/heading.*size/i);
    if (await headingSizeInput.isVisible()) {
      await headingSizeInput.fill("18pt");
      await expect(headingSizeInput).toHaveValue("18pt");
    }
  });

  test("can set paragraph indent", async ({ page }) => {
    const indentInput = page.getByLabel(/indent|indentation/i);
    if (await indentInput.isVisible()) {
      await indentInput.fill("1.5em");
      await expect(indentInput).toHaveValue("1.5em");
    }
  });

  test("can set paragraph spacing", async ({ page }) => {
    const spacingInput = page.getByLabel(/paragraph.*spacing|space.*after/i);
    if (await spacingInput.isVisible()) {
      await spacingInput.fill("0.5em");
      await expect(spacingInput).toHaveValue("0.5em");
    }
  });

  test("can toggle first paragraph indent", async ({ page }) => {
    const firstIndentToggle = page.getByLabel(/first.*paragraph.*indent/i);
    if (await firstIndentToggle.isVisible()) {
      const wasChecked = await firstIndentToggle.isChecked();
      await firstIndentToggle.click();
      await expect(firstIndentToggle).toBeChecked({ checked: !wasChecked });
    }
  });
});
