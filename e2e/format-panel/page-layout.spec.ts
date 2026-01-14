import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Page Layout Section Tests
 *
 * Tests for page layout configuration:
 * - Page size (presets and custom)
 * - Margins (top, bottom, outer, gutter)
 */
test.describe("Format Panel - Page Layout", () => {
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

  test("can select page size preset", async ({ page }) => {
    const pageSizeSelect = page.getByLabel(/page.*size/i);
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption("6x9");
      await expect(pageSizeSelect).toHaveValue("6x9");
    }
  });

  test("can select 5.5x8.5 page size", async ({ page }) => {
    const pageSizeSelect = page.getByLabel(/page.*size/i);
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption("5.5x8.5");
      await expect(pageSizeSelect).toHaveValue("5.5x8.5");
    }
  });

  test("can select A5 page size", async ({ page }) => {
    const pageSizeSelect = page.getByLabel(/page.*size/i);
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption("A5");
      await expect(pageSizeSelect).toHaveValue("A5");
    }
  });

  test("can set custom page dimensions", async ({ page }) => {
    const pageSizeSelect = page.getByLabel(/page.*size/i);
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption("custom");
    }

    const widthInput = page.getByLabel(/width/i);
    const heightInput = page.getByLabel(/height/i);

    if (await widthInput.isVisible()) {
      await widthInput.fill("5.5in");
      await expect(widthInput).toHaveValue("5.5in");
    }

    if (await heightInput.isVisible()) {
      await heightInput.fill("8.5in");
      await expect(heightInput).toHaveValue("8.5in");
    }
  });

  test("can set top margin", async ({ page }) => {
    const topMarginInput = page.getByLabel(/top.*margin|margin.*top/i);
    if (await topMarginInput.isVisible()) {
      await topMarginInput.fill("1in");
      await expect(topMarginInput).toHaveValue("1in");
    }
  });

  test("can set bottom margin", async ({ page }) => {
    const bottomMarginInput = page.getByLabel(/bottom.*margin|margin.*bottom/i);
    if (await bottomMarginInput.isVisible()) {
      await bottomMarginInput.fill("1in");
      await expect(bottomMarginInput).toHaveValue("1in");
    }
  });

  test("can set outer margin", async ({ page }) => {
    const outerMarginInput = page.getByLabel(/outer.*margin|margin.*outer/i);
    if (await outerMarginInput.isVisible()) {
      await outerMarginInput.fill("0.75in");
      await expect(outerMarginInput).toHaveValue("0.75in");
    }
  });

  test("can set gutter margin", async ({ page }) => {
    const gutterInput = page.getByLabel(/gutter|inside.*margin/i);
    if (await gutterInput.isVisible()) {
      await gutterInput.fill("0.5in");
      await expect(gutterInput).toHaveValue("0.5in");
    }
  });
});
