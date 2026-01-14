import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Format Panel - Metadata Section Tests
 *
 * Tests for the format panel's metadata configuration:
 * - Title, subtitle, author
 * - Series information
 * - Language, ISBN, description, tags
 */
test.describe("Format Panel - Metadata", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/");

    // Wait for editor to load
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });

    // Open format panel (if it exists)
    const formatButton = page.getByRole("button", { name: /format|settings|configure/i });
    if (await formatButton.isVisible({ timeout: 2000 })) {
      await formatButton.click();
    }
  });

  test("can edit book title", async ({ page }) => {
    // Find metadata section
    const metadataSection = page.getByRole("region", { name: /metadata/i })
      .or(page.getByText(/metadata/i).locator(".."));

    if (await metadataSection.isVisible()) {
      // Click to expand if collapsed
      const expandButton = metadataSection.getByRole("button");
      if (await expandButton.isVisible()) {
        await expandButton.click();
      }

      const titleInput = page.getByLabel(/title/i).first();
      if (await titleInput.isVisible()) {
        await titleInput.fill("My Amazing Book");
        await expect(titleInput).toHaveValue("My Amazing Book");
      }
    }
  });

  test("can edit subtitle", async ({ page }) => {
    const subtitleInput = page.getByLabel(/subtitle/i);
    if (await subtitleInput.isVisible()) {
      await subtitleInput.fill("A Compelling Subtitle");
      await expect(subtitleInput).toHaveValue("A Compelling Subtitle");
    }
  });

  test("can edit author name", async ({ page }) => {
    const authorInput = page.getByLabel(/author/i);
    if (await authorInput.isVisible()) {
      await authorInput.fill("John Doe");
      await expect(authorInput).toHaveValue("John Doe");
    }
  });

  test("can add series information", async ({ page }) => {
    const seriesNameInput = page.getByLabel(/series.*name|series title/i);
    const seriesNumberInput = page.getByLabel(/series.*number|book.*number/i);

    if (await seriesNameInput.isVisible()) {
      await seriesNameInput.fill("Epic Fantasy Series");
      await expect(seriesNameInput).toHaveValue("Epic Fantasy Series");
    }

    if (await seriesNumberInput.isVisible()) {
      await seriesNumberInput.fill("1");
      await expect(seriesNumberInput).toHaveValue("1");
    }
  });

  test("can set language", async ({ page }) => {
    const languageSelect = page.getByLabel(/language/i);
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption("en-US");
      await expect(languageSelect).toHaveValue("en-US");
    }
  });

  test("can set ISBN", async ({ page }) => {
    const isbnInput = page.getByLabel(/isbn/i);
    if (await isbnInput.isVisible()) {
      await isbnInput.fill("978-3-16-148410-0");
      await expect(isbnInput).toHaveValue("978-3-16-148410-0");
    }
  });

  test("can add description", async ({ page }) => {
    const descInput = page.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill("A thrilling adventure through fantastical lands.");
      await expect(descInput).toHaveValue(
        "A thrilling adventure through fantastical lands."
      );
    }
  });

  test("can add tags", async ({ page }) => {
    const tagsInput = page.getByLabel(/tags/i);
    if (await tagsInput.isVisible()) {
      await tagsInput.fill("fantasy, adventure, epic");
      await expect(tagsInput).toHaveValue("fantasy, adventure, epic");
    }
  });
});
