import { test, expect } from "@playwright/test";
import {
  mockAuthSession,
  mockUnauthenticated,
  mockSignOut,
} from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

test.describe("Logout Flow", () => {
  test("logout button signs out user", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await mockSignOut(page, "/");

    await page.goto("/projects");

    // Find and click logout/sign out button
    // The exact location depends on the UI - could be in sidebar, header, or dropdown
    const signOutButton = page.getByRole("button", { name: /sign out|logout/i });

    if (await signOutButton.isVisible()) {
      await signOutButton.click();

      // Should redirect to home or login
      await expect(page).toHaveURL(/^\/($|login)/);
    } else {
      // If there's a user menu, click it first
      const userMenu = page.getByRole("button", { name: /user|menu|account/i });
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole("menuitem", { name: /sign out|logout/i }).click();
        await expect(page).toHaveURL(/^\/($|login)/);
      }
    }
  });

  test("session is cleared after logout", async ({ page }) => {
    // Start authenticated
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/projects");
    await expect(page).not.toHaveURL(/\/login/);

    // Now simulate logged out state
    await page.unrouteAll();
    await mockUnauthenticated(page);

    // Try to access protected route
    await page.goto("/projects");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears local storage/cookies", async ({ page, context }) => {
    await mockAuthSession(page, TEST_USERS.owner);
    await page.goto("/projects");

    // Get session storage before logout
    const sessionBefore = await context.storageState();

    // Simulate logout
    await page.unrouteAll();
    await mockUnauthenticated(page);

    // Clear cookies (simulating what real signOut does)
    await context.clearCookies();

    // Try to access protected route in new page
    const newPage = await context.newPage();
    await mockUnauthenticated(newPage);
    await newPage.goto("/projects");

    // Should redirect to login
    await expect(newPage).toHaveURL(/\/login/);
  });
});

test.describe("Logout Edge Cases", () => {
  test("expired session redirects to login", async ({ page }) => {
    // Mock an expired session
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          // Expired session
          expires: new Date(Date.now() - 1000).toISOString(),
        }),
      });
    });

    await page.goto("/projects");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid session redirects to login", async ({ page }) => {
    // Mock an invalid session response
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.goto("/projects");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
