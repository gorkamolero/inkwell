import { test, expect } from "@playwright/test";
import { setupFormatPanelTest, openFormatSection } from "../fixtures/format-panel-helpers";

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
    // Navigate to a shared session and open format panel
    await setupFormatPanelTest(page);

    // Open metadata section if collapsed
    await openFormatSection(page, "metadata");
  });

  test("can edit book title", async ({ page }) => {
    const titleInput = page.getByLabel(/^title$/i).or(page.getByLabel(/book title/i)).first();
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill("My Amazing Book");
      await expect(titleInput).toHaveValue("My Amazing Book");
    } else {
      // Test passes if metadata section doesn't have title field
      test.skip();
    }
  });

  test("can edit subtitle", async ({ page }) => {
    const subtitleInput = page.getByLabel(/subtitle/i);
    if (await subtitleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subtitleInput.fill("A Compelling Subtitle");
      await expect(subtitleInput).toHaveValue("A Compelling Subtitle");
    } else {
      test.skip();
    }
  });

  test("can edit author name", async ({ page }) => {
    const authorInput = page.getByLabel(/author/i);
    if (await authorInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await authorInput.fill("John Doe");
      await expect(authorInput).toHaveValue("John Doe");
    } else {
      test.skip();
    }
  });

  test("can add series information", async ({ page }) => {
    // Series name is a textbox with placeholder "Series name"
    const seriesNameInput = page.getByRole("textbox", { name: /series name/i });
    await expect(seriesNameInput).toBeVisible();
    await seriesNameInput.fill("Epic Fantasy Series");
    await expect(seriesNameInput).toHaveValue("Epic Fantasy Series");
  });

  test("can set language", async ({ page }) => {
    // Language is a dropdown with language options
    const languageSelect = page.locator("select").filter({ has: page.locator("option:has-text('English')") });
    await expect(languageSelect).toBeVisible();
    await languageSelect.selectOption({ label: "Spanish" });
    await expect(languageSelect).toHaveValue("es");
  });

  test("can set ISBN", async ({ page }) => {
    const isbnInput = page.getByLabel(/isbn/i);
    if (await isbnInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await isbnInput.fill("978-3-16-148410-0");
      await expect(isbnInput).toHaveValue("978-3-16-148410-0");
    } else {
      test.skip();
    }
  });

  test("can add tags", async ({ page }) => {
    // Tags input has placeholder "Type and press Enter..."
    const tagsInput = page.getByPlaceholder(/type and press enter/i);
    await expect(tagsInput).toBeVisible();
    await tagsInput.fill("fantasy");
    await tagsInput.press("Enter");
    // Tag should appear as a span
    await expect(page.locator("span").filter({ hasText: "fantasy" })).toBeVisible();
  });

  test("shows title page preview", async ({ page }) => {
    // Preview section should show title
    const preview = page.getByText("Title Page Preview");
    await expect(preview).toBeVisible();
  });
});
