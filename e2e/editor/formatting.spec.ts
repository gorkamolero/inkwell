import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

test.describe("Rich Text Formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("applies bold formatting with Ctrl+B", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await editor.bold();
    await editor.type("bold text");
    await editor.bold();

    await editor.expectBold("bold text");
  });

  test("applies italic formatting with Ctrl+I", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await editor.italic();
    await editor.type("italic text");
    await editor.italic();

    await editor.expectItalic("italic text");
  });

  test("applies underline formatting with Ctrl+U", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await editor.underline();
    await editor.type("underlined text");
    await editor.underline();

    await editor.expectUnderline("underlined text");
  });

  test("toggles bold off when applied twice", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.bold();
    await editor.type("bold ");
    await editor.bold(); // Toggle off
    await editor.type("not bold");

    await editor.expectBold("bold");
    // "not bold" should not be in a bold element
    const notBold = page.locator("strong, b").filter({ hasText: "not bold" });
    await expect(notBold).not.toBeVisible();
  });

  test("can apply multiple formats together", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.bold();
    await editor.italic();
    await editor.type("bold and italic");
    await editor.bold();
    await editor.italic();

    // Should have both bold and italic
    const boldItalic = page
      .locator("strong em, em strong, b i, i b")
      .filter({ hasText: "bold and italic" });
    await expect(boldItalic).toBeVisible();
  });
});

test.describe("Heading Formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("creates H1 heading with # shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createHeading(1);
    await editor.type("Main Heading");
    await editor.press("Enter");

    await editor.expectHeading("Main Heading", 1);
  });

  test("creates H2 heading with ## shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createHeading(2);
    await editor.type("Subheading");
    await editor.press("Enter");

    await editor.expectHeading("Subheading", 2);
  });

  test("creates H3 heading with ### shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createHeading(3);
    await editor.type("Section");
    await editor.press("Enter");

    await editor.expectHeading("Section", 3);
  });
});

test.describe("List Formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("creates bullet list with - shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createBulletList();
    await editor.type("First item");
    await editor.press("Enter");
    await editor.type("Second item");

    await editor.expectBulletListItems(2);
  });

  test("creates numbered list with 1. shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createNumberedList();
    await editor.type("First item");
    await editor.press("Enter");
    await editor.type("Second item");

    await editor.expectNumberedListItems(2);
  });

  test("continues list on Enter", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createBulletList();
    await editor.type("First");
    await editor.press("Enter");
    await editor.type("Second");
    await editor.press("Enter");
    await editor.type("Third");

    await editor.expectBulletListItems(3);
  });

  test("exits list on double Enter", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createBulletList();
    await editor.type("Item");
    await editor.press("Enter");
    await editor.press("Enter"); // Should exit list
    await editor.type("Regular paragraph");

    await editor.expectBulletListItems(1);
    await expect(page.getByText("Regular paragraph")).toBeVisible();
  });
});

test.describe("Blockquote Formatting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("creates blockquote with > shortcut", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.createBlockquote();
    await editor.type("This is a quote");

    await editor.expectBlockquote("This is a quote");
  });
});

test.describe("Undo/Redo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("undo reverses last action", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("First text");
    await expect(page.getByText("First text")).toBeVisible();

    await editor.undo();

    // Text should be removed or reduced
    const textContent = await editor.getTextContent();
    expect(textContent.length).toBeLessThan("First text".length);
  });

  test("redo restores undone action", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("Text to undo");
    await editor.undo();
    await editor.redo();

    await expect(page.getByText("Text to undo")).toBeVisible();
  });
});

test.describe("Word Count", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("updates word count as you type", async ({ page }) => {
    const editor = createEditorHelper(page);
    await editor.clear();

    await editor.type("one two three four five");
    await page.waitForTimeout(500);

    await editor.expectWordCount(5);
  });

  test("word count handles empty content", async ({ page }) => {
    const editor = createEditorHelper(page);
    await editor.clear();
    await page.waitForTimeout(500);

    const count = await editor.getWordCount();
    expect(count).toBe(0);
  });
});
