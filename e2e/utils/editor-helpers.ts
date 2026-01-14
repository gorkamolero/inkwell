/**
 * Editor Helpers for E2E Tests
 *
 * Utilities for interacting with the Lexical editor in tests.
 * Provides a clean API for common editor operations.
 */

import { Page, Locator, expect } from "@playwright/test";

export class EditorHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the editor container locator (scopes selectors to editor only)
   */
  get editorContainer(): Locator {
    return this.page.locator(".hotpress-editor");
  }

  /**
   * Get the editor textbox locator
   */
  get editor(): Locator {
    return this.page.getByRole("textbox", { name: /editor/i });
  }

  /**
   * Wait for the editor to be visible and ready
   * Waits for both the textbox AND content indicators (toolbar/word count)
   */
  async waitForEditor(timeout: number = 30000): Promise<void> {
    // Wait for the editor textbox to be visible
    await expect(this.editor).toBeVisible({ timeout });

    // Wait for the editor to be truly ready by checking for toolbar or word count
    // These only appear after the editor is fully initialized
    // Use .first() to avoid strict mode violation when both are visible
    const readyIndicator = this.page
      .getByRole("button", { name: /undo/i })
      .or(this.page.getByText(/\d+ words?/))
      .first();
    await expect(readyIndicator).toBeVisible({ timeout });
  }

  /**
   * Wait for editor to show "Live" status (Liveblocks connected)
   */
  async waitForLive(timeout: number = 10000): Promise<void> {
    await expect(this.page.getByText(/live/i)).toBeVisible({ timeout });
  }

  /**
   * Focus the editor
   */
  async focus(): Promise<void> {
    await this.editor.click();
  }

  /**
   * Select all content in the editor
   */
  async selectAll(): Promise<void> {
    await this.focus();
    await this.page.keyboard.press("ControlOrMeta+a");
  }

  /**
   * Clear editor content
   */
  async clear(): Promise<void> {
    await this.selectAll();
    await this.page.keyboard.press("Backspace");
  }

  /**
   * Clear and type new content
   */
  async clearAndType(text: string): Promise<void> {
    await this.clear();
    await this.page.keyboard.type(text);
  }

  /**
   * Type text at current cursor position
   */
  async type(text: string): Promise<void> {
    await this.focus();
    await this.page.keyboard.type(text);
  }

  /**
   * Press a key
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  // ============================================================================
  // Formatting Commands
  // ============================================================================

  /**
   * Toggle bold formatting (Ctrl/Cmd+B)
   */
  async bold(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+b");
  }

  /**
   * Toggle italic formatting (Ctrl/Cmd+I)
   */
  async italic(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+i");
  }

  /**
   * Toggle underline formatting (Ctrl/Cmd+U)
   */
  async underline(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+u");
  }

  /**
   * Create a heading using markdown shortcut
   */
  async createHeading(level: 1 | 2 | 3): Promise<void> {
    await this.page.keyboard.type("#".repeat(level) + " ");
  }

  /**
   * Create a bullet list using markdown shortcut
   */
  async createBulletList(): Promise<void> {
    await this.page.keyboard.type("- ");
  }

  /**
   * Create a numbered list using markdown shortcut
   */
  async createNumberedList(): Promise<void> {
    await this.page.keyboard.type("1. ");
  }

  /**
   * Create a blockquote using markdown shortcut
   */
  async createBlockquote(): Promise<void> {
    await this.page.keyboard.type("> ");
  }

  /**
   * Undo last action (Ctrl/Cmd+Z)
   */
  async undo(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+z");
  }

  /**
   * Redo last undone action (Ctrl/Cmd+Shift+Z)
   */
  async redo(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+Shift+z");
  }

  /**
   * Save (Ctrl/Cmd+S)
   */
  async save(): Promise<void> {
    await this.page.keyboard.press("ControlOrMeta+s");
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Assert a heading is visible
   */
  async expectHeading(text: string, level: 1 | 2 | 3 = 1): Promise<void> {
    await expect(
      this.page.locator(`h${level}`).filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert bold text is visible
   */
  async expectBold(text: string): Promise<void> {
    await expect(
      this.page.locator("strong, b").filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert italic text is visible
   */
  async expectItalic(text: string): Promise<void> {
    await expect(
      this.page.locator("em, i").filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert underlined text is visible
   * Lexical uses spans with 'underline' class, not <u> elements
   */
  async expectUnderline(text: string): Promise<void> {
    await expect(
      this.page
        .locator("u, .underline, [class*='underline']")
        .filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert inline code is visible
   */
  async expectCode(text: string): Promise<void> {
    await expect(
      this.page.locator("code").filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert blockquote is visible
   */
  async expectBlockquote(text: string): Promise<void> {
    await expect(
      this.page.locator("blockquote").filter({ hasText: text })
    ).toBeVisible();
  }

  /**
   * Assert bullet list items count (scoped to editor)
   */
  async expectBulletListItems(count: number): Promise<void> {
    await expect(this.editorContainer.locator("ul li")).toHaveCount(count);
  }

  /**
   * Assert numbered list items count (scoped to editor)
   */
  async expectNumberedListItems(count: number): Promise<void> {
    await expect(this.editorContainer.locator("ol li")).toHaveCount(count);
  }

  // ============================================================================
  // Status & Metrics
  // ============================================================================

  /**
   * Get the current word count from the status bar
   */
  async getWordCount(): Promise<number> {
    const wordCountText = this.page.getByText(/\d+ words?/);
    const text = await wordCountText.textContent();
    const match = text?.match(/(\d+) words?/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Wait for specific word count
   */
  async expectWordCount(count: number, timeout: number = 2000): Promise<void> {
    await expect(this.page.getByText(new RegExp(`${count} words?`))).toBeVisible(
      { timeout }
    );
  }

  /**
   * Wait for "Saved" status
   */
  async expectSaved(timeout: number = 5000): Promise<void> {
    await expect(this.page.getByText(/saved/i)).toBeVisible({ timeout });
  }

  /**
   * Wait for "Saving" status
   */
  async expectSaving(timeout: number = 3000): Promise<void> {
    await expect(this.page.getByText(/saving/i)).toBeVisible({ timeout });
  }

  /**
   * Get editor content as text
   */
  async getTextContent(): Promise<string> {
    return (await this.editor.textContent()) ?? "";
  }
}

/**
 * Create an editor helper instance
 */
export function createEditorHelper(page: Page): EditorHelper {
  return new EditorHelper(page);
}
