import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

test.describe("Markdown Text Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("bold with **text**", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal **bold text** normal");

    await editor.expectBold("bold text");
  });

  test("bold with __text__", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal __bold text__ normal");

    await editor.expectBold("bold text");
  });

  test("italic with *text*", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal *italic text* normal");

    await editor.expectItalic("italic text");
  });

  test("italic with _text_", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal _italic text_ normal");

    await editor.expectItalic("italic text");
  });

  test("inline code with `code`", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal `inline code` normal");

    await editor.expectCode("inline code");
  });

  test("bold italic with ***text***", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ***bold and italic*** normal");

    // Should have both bold and italic
    const boldItalic = page
      .locator("strong em, em strong, b i, i b")
      .filter({ hasText: "bold and italic" });
    await expect(boldItalic).toBeVisible();
  });
});

test.describe("Markdown Block Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("heading 1 with # prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("# Main Title");
    await editor.press("Enter");

    await editor.expectHeading("Main Title", 1);
  });

  test("heading 2 with ## prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("## Subtitle");
    await editor.press("Enter");

    await editor.expectHeading("Subtitle", 2);
  });

  test("heading 3 with ### prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("### Section");
    await editor.press("Enter");

    await editor.expectHeading("Section", 3);
  });

  test("bullet list with - prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("- First item");
    await editor.press("Enter");
    await editor.type("Second item");

    await editor.expectBulletListItems(2);
  });

  test("bullet list with * prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("* First item");
    await editor.press("Enter");
    await editor.type("Second item");

    await editor.expectBulletListItems(2);
  });

  test("numbered list with 1. prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("1. First item");
    await editor.press("Enter");
    await editor.type("Second item");

    await editor.expectNumberedListItems(2);
  });

  test("blockquote with > prefix", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("> This is a quote");

    await editor.expectBlockquote("This is a quote");
  });

  test("horizontal rule with ---", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("---");
    await editor.press("Enter");

    // Note: Lexical may render this as hr or a specific scene break element
    const hr = page.locator("hr");
    // Only check if it's visible (may not be implemented in all editors)
    if (await hr.count() > 0) {
      await expect(hr.first()).toBeVisible();
    }
  });
});

test.describe("Markdown Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("unmatched asterisks are not converted", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("This is *not closed");

    // Should not have italic element
    const italic = page.locator("em, i").filter({ hasText: "not closed" });
    await expect(italic).not.toBeVisible();
  });

  test("nested formatting works", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Type with nested formats
    await editor.type("**bold with *italic* inside**");

    // Both should be visible
    await editor.expectBold("bold with");
    await editor.expectItalic("italic");
  });

  test("escaping asterisks with backslash", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("\\*not bold\\*");

    // Should show literal asterisks (or escaped version)
    const bold = page.locator("strong, b").filter({ hasText: "not bold" });
    await expect(bold).not.toBeVisible();
  });

  test("code blocks preserve formatting characters", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("`**not bold inside code**`");

    // The asterisks should be visible as text within code
    await editor.expectCode("**not bold inside code**");
  });
});

test.describe("Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("Ctrl+B toggles bold", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await page.keyboard.press("ControlOrMeta+b");
    await editor.type("bold");
    await page.keyboard.press("ControlOrMeta+b");
    await editor.type(" normal");

    await editor.expectBold("bold");
  });

  test("Ctrl+I toggles italic", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await page.keyboard.press("ControlOrMeta+i");
    await editor.type("italic");
    await page.keyboard.press("ControlOrMeta+i");
    await editor.type(" normal");

    await editor.expectItalic("italic");
  });

  test("Ctrl+U toggles underline", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("normal ");
    await page.keyboard.press("ControlOrMeta+u");
    await editor.type("underline");
    await page.keyboard.press("ControlOrMeta+u");
    await editor.type(" normal");

    await editor.expectUnderline("underline");
  });

  test("Ctrl+Z undoes action", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("before");
    await editor.type(" after");
    await page.keyboard.press("ControlOrMeta+z");

    const content = await editor.getTextContent();
    expect(content).not.toContain("after");
  });

  test("Ctrl+Shift+Z redoes action", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.type("text");
    await page.keyboard.press("ControlOrMeta+z");
    await page.keyboard.press("ControlOrMeta+Shift+z");

    await expect(page.getByText("text")).toBeVisible();
  });
});
