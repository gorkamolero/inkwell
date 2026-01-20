import { test, expect } from "@playwright/test";
import { createEditorHelper } from "../utils/editor-helpers";

/**
 * Image Paste Tests
 *
 * Tests for pasting images from clipboard into the editor.
 * Images are uploaded to Vercel Blob (or converted to data URLs in dev).
 */

// Helper to create a simple PNG blob (1x1 red pixel)
async function createTestImageBlob(): Promise<Blob> {
  // 1x1 red PNG as base64
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  const binaryString = atob(pngBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}

test.describe("Image Paste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const editor = createEditorHelper(page);
    await editor.waitForEditor();
  });

  test("pasting an image inserts it into the editor", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.focus();

    // Get initial image count
    const initialCount = await editor.getImageCount();

    // Simulate pasting an image
    await page.evaluate(async () => {
      // Create a 1x1 red PNG
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const binaryString = atob(pngBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "test.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    // Wait for upload and insertion
    await page.waitForTimeout(2000);

    // Should have one more image than before
    const newCount = await editor.getImageCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test("pasted image has neobrutalist styling", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.focus();

    // Paste an image
    await page.evaluate(async () => {
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const binaryString = atob(pngBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "styled.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    await page.waitForTimeout(2000);

    // Image should have neobrutalist border styling
    const img = editor.editorContainer.locator("img").first();
    await expect(img).toBeVisible();

    // Check for brutal styling classes
    const className = await img.getAttribute("class");
    expect(className).toContain("border");
  });

  test("multiple images can be pasted sequentially", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.focus();

    // Paste first image
    await page.evaluate(async () => {
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const binaryString = atob(pngBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "first.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    await page.waitForTimeout(1500);

    // Paste second image
    await page.evaluate(async () => {
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const binaryString = atob(pngBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "second.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    await page.waitForTimeout(1500);

    // Should have two images
    const count = await editor.getImageCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("text can be typed after pasting an image", async ({ page }) => {
    const editor = createEditorHelper(page);

    await editor.clear();
    await editor.focus();

    // Paste an image
    await page.evaluate(async () => {
      const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
      const binaryString = atob(pngBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "test.png", { type: "image/png" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    await page.waitForTimeout(1500);

    // Type text after the image
    await editor.type("Caption for the image above");

    // Both image and text should be visible
    await expect(editor.editorContainer.locator("img")).toBeVisible();
    await expect(page.getByText("Caption for the image above")).toBeVisible();
  });
});

test.describe("Image Upload Validation", () => {
  test("pasting non-image file does not insert image", async ({ page }) => {
    const editor = createEditorHelper(page);

    await page.goto("/");
    await editor.waitForEditor();
    await editor.clear();
    await editor.focus();

    const initialCount = await editor.getImageCount();

    // Try to paste a text file (should be ignored by image plugin)
    await page.evaluate(async () => {
      const textBlob = new Blob(["Hello world"], { type: "text/plain" });
      const file = new File([textBlob], "test.txt", { type: "text/plain" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });

      document.activeElement?.dispatchEvent(event);
    });

    await page.waitForTimeout(1000);

    // Should NOT have added an image
    const newCount = await editor.getImageCount();
    expect(newCount).toBe(initialCount);
  });
});
