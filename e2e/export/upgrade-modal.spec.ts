import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

/**
 * Upgrade Modal Tests
 *
 * Tests the upgrade modal that appears when free users try to export.
 * Modal shows two options: Creator (per-book) and Pro (annual subscription).
 */

test.describe("Upgrade Modal", () => {
  test.describe("Modal Display", () => {
    test("shows upgrade modal with both pricing options", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      // Trigger the modal
      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Modal should be visible
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Should show title
      await expect(page.getByText("Unlock Professional Exports")).toBeVisible();

      // Should show both options
      await expect(page.getByText("Creator").first()).toBeVisible();
      await expect(page.getByText("Pro").first()).toBeVisible();
    });

    test("displays correct pricing for Creator option", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Check Creator pricing within modal
      await expect(page.getByRole("dialog").getByText("$12.99")).toBeVisible();

      // Check "one-time" label
      await expect(page.getByRole("dialog").getByText("one-time")).toBeVisible();

      // Check "This book only" feature
      await expect(page.getByRole("dialog").getByText("This book only")).toBeVisible();
    });

    test("displays correct pricing for Pro option", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Check Pro pricing within modal
      await expect(page.getByRole("dialog").getByText("$39.99")).toBeVisible();

      // Check "/year" label
      await expect(page.getByRole("dialog").getByText("/year")).toBeVisible();

      // Check "Best Value" badge
      await expect(page.getByRole("dialog").getByText("Best Value")).toBeVisible();

      // Check "Pays for itself after 3 books" text
      await expect(page.getByRole("dialog").getByText(/pays for itself after 3 books/i)).toBeVisible();
    });

    test("highlights Pro option with yellow background", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Pro card should have yellow background (brutal-yellow class)
      const proCard = page.locator(".bg-brutal-yellow").filter({ hasText: "Pro" });
      await expect(proCard).toBeVisible();
    });

    test("shows feature comparison correctly", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Creator features
      await expect(page.getByText("Clean exports (no watermark)").first()).toBeVisible();
      await expect(page.getByText("Print-ready CMYK with bleed").first()).toBeVisible();
      await expect(page.getByText("All premium templates").first()).toBeVisible();

      // Pro features
      await expect(page.getByText(/clean exports on.*all projects/i)).toBeVisible();
      await expect(page.getByText("CMYK print-ready on everything")).toBeVisible();
      await expect(page.getByText(/github sync/i)).toBeVisible();
      await expect(page.getByText("No per-book fees ever")).toBeVisible();
    });

    test("shows philosophy footer", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Philosophy text
      await expect(
        page.getByText(/free tier is genuinely useful/i)
      ).toBeVisible();
    });

    test("displays break-even information for Pro", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Should show "Pays for itself after ~3 books per year" within modal
      await expect(page.getByRole("dialog").getByText(/pays for itself after.*3 books/i).first()).toBeVisible();
    });
  });

  test.describe("Modal Interactions", () => {
    test("can close modal with X button", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Click close button
      const closeButton = page.getByRole("button", { name: /close dialog/i });
      await closeButton.click();

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    });

    test("can close modal with Escape key", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Press Escape
      await page.keyboard.press("Escape");

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    });

    test("can close modal by clicking overlay", async ({ page }) => {
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Click overlay (outside modal content)
      await page.locator(".fixed.inset-0.bg-black\\/50").click({ position: { x: 10, y: 10 } });

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe("Upgrade Flow - Creator", () => {
    test("disables Pro button while Creator checkout is loading", async ({ page }) => {
      await mockAuthSession(page, TEST_USERS.owner);
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Mock slow checkout API
      await page.route("**/api/billing/checkout", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: "https://checkout.stripe.com/test" }),
        });
      });

      // Click Creator button
      const creatorButton = page.getByRole("button", { name: /unlock this book/i });
      await creatorButton.click();

      // Pro button should also be disabled
      const proButton = page.getByRole("button", { name: /go pro now/i });
      await expect(proButton).toBeDisabled();
    });
  });

  test.describe("Upgrade Flow - Pro", () => {
    test("disables Creator button while Pro checkout is loading", async ({ page }) => {
      await mockAuthSession(page, TEST_USERS.owner);
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Mock slow checkout API
      await page.route("**/api/billing/checkout", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: "https://checkout.stripe.com/test" }),
        });
      });

      // Click Pro button
      const proButton = page.getByRole("button", { name: /go pro now/i });
      await proButton.click();

      // Creator button should also be disabled
      const creatorButton = page.getByRole("button", { name: /unlock this book/i });
      await expect(creatorButton).toBeDisabled();
    });
  });

  test.describe("Responsive Design", () => {
    test("displays side-by-side on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Both cards should be visible side by side (grid layout)
      const modal = page.getByRole("dialog");
      const grid = modal.locator(".grid.md\\:grid-cols-2");
      await expect(grid).toBeVisible();
    });

    test("stacks vertically on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Modal should still be visible and scrollable
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Both options should be visible (stacked)
      await expect(page.getByText("Creator").first()).toBeVisible();
      await expect(page.getByText("Pro").first()).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("handles checkout API error gracefully", async ({ page }) => {
      await mockAuthSession(page, TEST_USERS.owner);
      await page.goto("/test/upgrade-modal");

      const openButton = page.getByRole("button", { name: /open upgrade modal/i });
      await openButton.click();

      // Mock failed checkout API
      await page.route("**/api/billing/checkout", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Failed to create checkout session",
          }),
        });
      });

      // Click Pro button
      const proButton = page.getByRole("button", { name: /go pro now/i });
      await proButton.click();

      // Should show error message (implementation-specific)
      // Modal should remain open
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Buttons should be re-enabled
      await page.waitForTimeout(500);
      await expect(proButton).not.toBeDisabled();
    });
  });
});
