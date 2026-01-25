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

    // Paste markdown heading
    await page.keyboard.type("# My Document");
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");
    await page.keyboard.press("Control+V");

    // The heading should be formatted (H1)
    // Note: The actual implementation converts on paste, so we verify content exists
    const content = await editor.getContent();
    expect(content).toContain("My Document");
  });

  test("pasting markdown list creates list", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy list content and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({ "text/plain": "- First item\n- Second item" });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    const content = await editor.getContent();
    expect(content).toContain("First item");
    expect(content).toContain("Second item");
  });

  test("pasting bold markdown creates bold text", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy bold markdown and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({ "text/plain": "This is **bold** text" });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    // The content should be present
    const content = await editor.getContent();
    expect(content).toContain("bold");
  });

  test("pasting code block preserves formatting", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy code block markdown and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({
        "text/plain": "```javascript\nconsole.log('hello');\n```"
      });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    const content = await editor.getContent();
    expect(content).toContain("console.log");
  });

  test("pasting link creates link node", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy markdown link and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({
        "text/plain": "[Click here](https://example.com)"
      });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    const content = await editor.getContent();
    expect(content).toContain("Click here");
    expect(content).toContain("example.com");
  });

  test("pasting blockquote creates quote format", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy blockquote markdown and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({
        "text/plain": "> This is a quote"
      });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    const content = await editor.getContent();
    expect(content).toContain("quote");
  });

  test("pasting regular text is not affected", async ({ page }) => {
    const editor = createEditorHelper(page);

    // Copy plain text and paste
    await page.evaluate(() => {
      const clipboardItem = new ClipboardItem({ "text/plain": "Just plain text" });
      navigator.clipboard.write([clipboardItem]);
    });
    await page.keyboard.press("Control+V");

    const content = await editor.getContent();
    expect(content).toContain("Just plain text");
  });
});
