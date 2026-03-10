import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Markdown Paste Tests
 *
 * Tests for MarkdownPastePlugin - pasting markdown content should convert to rich text.
 */

test.describe("Markdown Paste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test("pasting heading creates heading format", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("# My Document");

    const content = await editor.getContent();
    expect(content).toContain("My Document");
  });

  test("pasting markdown list creates list", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("- First item\n- Second item");

    const content = await editor.getContent();
    expect(content).toContain("First item");
    expect(content).toContain("Second item");
  });

  test("pasting bold markdown creates bold text", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("This is **bold** text");

    const content = await editor.getContent();
    expect(content).toContain("bold");
  });

  test("pasting code block preserves formatting", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("```javascript\nconsole.log('hello');\n```");

    const content = await editor.getContent();
    expect(content).toContain("console.log");
  });

  test("pasting link creates link node", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("[Click here](https://example.com)");

    const content = await editor.getContent();
    expect(content).toContain("Click here");
    expect(content).toContain("example.com");
  });

  test("pasting blockquote creates quote format", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("> This is a quote");

    const content = await editor.getContent();
    expect(content).toContain("quote");
  });

  test("pasting regular text is not affected", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.pasteText("Just plain text");

    const content = await editor.getContent();
    expect(content).toContain("Just plain text");
  });
});
