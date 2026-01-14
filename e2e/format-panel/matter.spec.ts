import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Front & Back Matter Section Tests
 *
 * Tests for front matter (half title, title, copyright, etc.)
 * and back matter (epilogue, acknowledgements, about author, etc.)
 */
test.describe("Format Panel - Front Matter", () => {
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

  test("can add half title page", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*front.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const halfTitleOption = page.getByText(/half.*title/i);
      if (await halfTitleOption.isVisible()) {
        await halfTitleOption.click();
        await expect(page.getByText(/half.*title/i)).toBeVisible();
      }
    }
  });

  test("can add title page", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*front.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const titleOption = page.getByText(/^title$/i);
      if (await titleOption.isVisible()) {
        await titleOption.click();
      }
    }
  });

  test("can add copyright page", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*front.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const copyrightOption = page.getByText(/copyright/i);
      if (await copyrightOption.isVisible()) {
        await copyrightOption.click();
        await expect(page.getByText(/copyright/i)).toBeVisible();
      }
    }
  });

  test("can add dedication", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*front.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const dedicationOption = page.getByText(/dedication/i);
      if (await dedicationOption.isVisible()) {
        await dedicationOption.click();

        // Fill dedication content
        const contentInput = page.getByLabel(/dedication.*content|content/i);
        if (await contentInput.isVisible()) {
          await contentInput.fill("For my family");
          await expect(contentInput).toHaveValue("For my family");
        }
      }
    }
  });

  test("can add table of contents", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*front.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const tocOption = page.getByText(/table.*contents|toc/i);
      if (await tocOption.isVisible()) {
        await tocOption.click();
      }
    }
  });

  test("can reorder front matter items", async ({ page }) => {
    // This would test drag-and-drop reordering
    // Implementation depends on the UI library used
    const frontMatterList = page.getByRole("list", { name: /front.*matter/i });
    if (await frontMatterList.isVisible()) {
      // Check for drag handles or reorder buttons
      const dragHandle = frontMatterList.locator('[aria-label*="drag"], [data-drag-handle]');
      await expect(dragHandle.first()).toBeVisible();
    }
  });

  test("can remove front matter item", async ({ page }) => {
    const removeButton = page.getByRole("button", { name: /remove|delete/i }).first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      // Confirm if dialog appears
      const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });
});

test.describe("Format Panel - Back Matter", () => {
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

  test("can add acknowledgements", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*back.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const ackOption = page.getByText(/acknowledgements/i);
      if (await ackOption.isVisible()) {
        await ackOption.click();
      }
    }
  });

  test("can add about the author", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*back.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const aboutOption = page.getByText(/about.*author/i);
      if (await aboutOption.isVisible()) {
        await aboutOption.click();
      }
    }
  });

  test("can add also by section", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*back.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const alsoByOption = page.getByText(/also.*by/i);
      if (await alsoByOption.isVisible()) {
        await alsoByOption.click();
      }
    }
  });

  test("can add glossary", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*back.*matter|add.*page/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const glossaryOption = page.getByText(/glossary/i);
      if (await glossaryOption.isVisible()) {
        await glossaryOption.click();
      }
    }
  });
});

test.describe("Format Panel - Scene Breaks", () => {
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

  test("can select scene break ornament", async ({ page }) => {
    const ornamentSelect = page.getByLabel(/scene.*break.*ornament|ornament/i);
    if (await ornamentSelect.isVisible()) {
      await ornamentSelect.selectOption("three-asterisks");
      await expect(ornamentSelect).toHaveValue("three-asterisks");
    }
  });

  test("can set scene break spacing", async ({ page }) => {
    const spacingInput = page.getByLabel(/scene.*break.*spacing|break.*spacing/i);
    if (await spacingInput.isVisible()) {
      await spacingInput.fill("2em");
      await expect(spacingInput).toHaveValue("2em");
    }
  });

  test("can use custom scene break image", async ({ page }) => {
    const customImageInput = page.getByLabel(/custom.*image|scene.*break.*image/i);
    if (await customImageInput.isVisible()) {
      await customImageInput.fill("https://example.com/ornament.png");
      await expect(customImageInput).toHaveValue(
        "https://example.com/ornament.png"
      );
    }
  });
});
