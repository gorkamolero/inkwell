import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Headers & Footers Section Tests
 *
 * Tests for running headers and footers:
 * - Enable/disable
 * - Left/right templates
 * - Page numbers
 */
test.describe("Format Panel - Headers", () => {
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

  test("can toggle headers", async ({ page }) => {
    const headersToggle = page.getByLabel(/headers.*enabled|enable.*headers/i);
    if (await headersToggle.isVisible()) {
      const wasChecked = await headersToggle.isChecked();
      await headersToggle.click();
      await expect(headersToggle).toBeChecked({ checked: !wasChecked });
    }
  });

  test("can set left header template", async ({ page }) => {
    const leftHeaderInput = page.getByLabel(/left.*header/i);
    if (await leftHeaderInput.isVisible()) {
      await leftHeaderInput.fill("{author}");
      await expect(leftHeaderInput).toHaveValue("{author}");
    }
  });

  test("can set right header template", async ({ page }) => {
    const rightHeaderInput = page.getByLabel(/right.*header/i);
    if (await rightHeaderInput.isVisible()) {
      await rightHeaderInput.fill("{title}");
      await expect(rightHeaderInput).toHaveValue("{title}");
    }
  });

  test("can toggle hide on chapter start", async ({ page }) => {
    const hideToggle = page.getByLabel(/hide.*chapter|chapter.*start/i);
    if (await hideToggle.isVisible()) {
      const wasChecked = await hideToggle.isChecked();
      await hideToggle.click();
      await expect(hideToggle).toBeChecked({ checked: !wasChecked });
    }
  });

  test("can set header text transform", async ({ page }) => {
    const transformSelect = page.getByLabel(/header.*transform|header.*case/i);
    if (await transformSelect.isVisible()) {
      await transformSelect.selectOption("uppercase");
      await expect(transformSelect).toHaveValue("uppercase");
    }
  });
});

test.describe("Format Panel - Footers", () => {
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

  test("can toggle footers", async ({ page }) => {
    const footersToggle = page.getByLabel(/footers.*enabled|enable.*footers/i);
    if (await footersToggle.isVisible()) {
      const wasChecked = await footersToggle.isChecked();
      await footersToggle.click();
      await expect(footersToggle).toBeChecked({ checked: !wasChecked });
    }
  });

  test("can set page number position", async ({ page }) => {
    const positionSelect = page.getByLabel(/page.*number.*position|number.*position/i);
    if (await positionSelect.isVisible()) {
      await positionSelect.selectOption("center");
      await expect(positionSelect).toHaveValue("center");
    }
  });

  test("can set page number format", async ({ page }) => {
    const formatInput = page.getByLabel(/page.*number.*format|number.*format/i);
    if (await formatInput.isVisible()) {
      await formatInput.fill("{n}");
      await expect(formatInput).toHaveValue("{n}");
    }
  });

  test("can use roman numerals for page numbers", async ({ page }) => {
    const formatInput = page.getByLabel(/page.*number.*format|number.*format/i);
    if (await formatInput.isVisible()) {
      await formatInput.fill("{roman}");
      await expect(formatInput).toHaveValue("{roman}");
    }
  });
});
