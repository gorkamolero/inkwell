import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

/**
 * Format Panel - Front & Back Matter Section Tests
 */
test.describe("Format Panel - Front Matter", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "front matter");
  });

  test("shows Add Page button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: "Add Page" });
    await expect(addButton).toBeVisible();
  });

  test("section is expandable", async ({ page }) => {
    const section = page.getByRole("button", { name: /front matter/i });
    await expect(section).toBeVisible();
  });
});

test.describe("Format Panel - Back Matter", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "back matter");
  });

  test("shows Add Page button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: "Add Page" });
    await expect(addButton).toBeVisible();
  });

  test("section is expandable", async ({ page }) => {
    const section = page.getByRole("button", { name: /back matter/i });
    await expect(section).toBeVisible();
  });
});

test.describe("Format Panel - Scene Breaks", () => {
  test.beforeEach(async ({ page }) => {
    await setupFormatPanelTest(page);
    await openFormatSection(page, "scene breaks");
  });

  test("section is expandable", async ({ page }) => {
    const section = page.getByRole("button", { name: /scene breaks/i });
    await expect(section).toBeVisible();
  });
});
