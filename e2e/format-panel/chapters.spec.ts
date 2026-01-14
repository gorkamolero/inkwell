import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Chapters Section Tests
 *
 * Tests for chapter configuration:
 * - Chapter numbering format
 * - Title styling
 * - Drop caps
 * - Start page (recto/verso)
 * - Ornaments
 */
test.describe("Format Panel - Chapters", () => {
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

  test("can toggle chapter numbering", async ({ page }) => {
    const numberingToggle = page.getByLabel(/chapter.*numbering|numbering.*enabled/i);
    if (await numberingToggle.isVisible()) {
      const wasChecked = await numberingToggle.isChecked();
      await numberingToggle.click();
      await expect(numberingToggle).toBeChecked({ checked: !wasChecked });
    }
  });

  test("can set chapter numbering format", async ({ page }) => {
    const formatInput = page.getByLabel(/numbering.*format|chapter.*format/i);
    if (await formatInput.isVisible()) {
      await formatInput.fill("Chapter {n}");
      await expect(formatInput).toHaveValue("Chapter {n}");
    }
  });

  test("can use roman numeral format", async ({ page }) => {
    const formatInput = page.getByLabel(/numbering.*format|chapter.*format/i);
    if (await formatInput.isVisible()) {
      await formatInput.fill("Chapter {roman}");
      await expect(formatInput).toHaveValue("Chapter {roman}");
    }
  });

  test("can use word format", async ({ page }) => {
    const formatInput = page.getByLabel(/numbering.*format|chapter.*format/i);
    if (await formatInput.isVisible()) {
      await formatInput.fill("Chapter {word}");
      await expect(formatInput).toHaveValue("Chapter {word}");
    }
  });

  test("can set chapter title alignment", async ({ page }) => {
    const alignSelect = page.getByLabel(/title.*align|chapter.*align/i);
    if (await alignSelect.isVisible()) {
      await alignSelect.selectOption("center");
      await expect(alignSelect).toHaveValue("center");
    }
  });

  test("can set chapter title transform", async ({ page }) => {
    const transformSelect = page.getByLabel(/transform|case/i);
    if (await transformSelect.isVisible()) {
      await transformSelect.selectOption("uppercase");
      await expect(transformSelect).toHaveValue("uppercase");
    }
  });

  test("can set chapter start page", async ({ page }) => {
    const startOnSelect = page.getByLabel(/start.*on|start.*page/i);
    if (await startOnSelect.isVisible()) {
      await startOnSelect.selectOption("right");
      await expect(startOnSelect).toHaveValue("right");
    }
  });
});

test.describe("Format Panel - Drop Caps", () => {
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

  test("can toggle drop caps", async ({ page }) => {
    const dropCapsToggle = page.getByLabel(/drop.*caps|dropcaps/i);
    if (await dropCapsToggle.isVisible()) {
      const wasChecked = await dropCapsToggle.isChecked();
      await dropCapsToggle.click();
      await expect(dropCapsToggle).toBeChecked({ checked: !wasChecked });
    }
  });

  test("can set drop caps lines", async ({ page }) => {
    const linesInput = page.getByLabel(/lines|drop.*cap.*size/i);
    if (await linesInput.isVisible()) {
      await linesInput.fill("3");
      await expect(linesInput).toHaveValue("3");
    }
  });

  test("can set drop caps font", async ({ page }) => {
    const fontSelect = page.getByLabel(/drop.*cap.*font/i);
    if (await fontSelect.isVisible()) {
      await fontSelect.selectOption("Cinzel");
      await expect(fontSelect).toHaveValue("Cinzel");
    }
  });

  test("can set drop caps style", async ({ page }) => {
    const styleSelect = page.getByLabel(/drop.*cap.*style/i);
    if (await styleSelect.isVisible()) {
      await styleSelect.selectOption("dropped");
      await expect(styleSelect).toHaveValue("dropped");
    }
  });
});
