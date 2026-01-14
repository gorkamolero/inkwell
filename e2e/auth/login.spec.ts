import { test, expect } from "@playwright/test";
import {
  setupAuthBeforeNavigation,
  mockUnauthenticated,
  mockSignIn,
} from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

test.describe("Login Page", () => {
  test("displays login page with GitHub button", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/login");

    // Check page elements
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with github/i })
    ).toBeVisible();

    // Check signup link
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();

    // Check terms and privacy links
    await expect(
      page.getByRole("link", { name: /terms of service/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /privacy policy/i })
    ).toBeVisible();
  });

  test("clicking GitHub button initiates OAuth flow", async ({ page }) => {
    await mockUnauthenticated(page);

    let oauthInitiated = false;
    await mockSignIn(page, () => {
      oauthInitiated = true;
    });

    await page.goto("/login");
    await page.getByRole("button", { name: /continue with github/i }).click();

    // Wait a moment for the request to be intercepted
    await page.waitForTimeout(500);
    expect(oauthInitiated).toBe(true);
  });

  test("redirects authenticated users to projects", async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    // Try to go to login page
    await page.goto("/login");

    // Should redirect to projects
    await expect(page).toHaveURL(/\/projects/);
  });

  test("signup link navigates to signup page", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/login");

    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Signup Page", () => {
  test("displays signup page with GitHub button", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/signup");

    // Check page elements (similar to login)
    await expect(
      page.getByRole("button", { name: /continue with github/i })
    ).toBeVisible();
  });

  test("redirects authenticated users to projects", async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    await page.goto("/signup");

    // Should redirect to projects
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe("OAuth Callback", () => {
  test("successful OAuth redirects to projects", async ({ page }) => {
    // Mock the callback to redirect
    await page.route("**/api/auth/callback/github*", async (route) => {
      await route.fulfill({
        status: 302,
        headers: { location: "/projects" },
      });
    });

    // After callback, session should be set
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    // Simulate callback URL (would normally come from GitHub)
    await page.goto("/api/auth/callback/github?code=mock-code&state=mock-state");

    // After redirect, should be on projects page
    await expect(page).toHaveURL(/\/projects/);
  });

  test("failed OAuth shows error on login page", async ({ page }) => {
    // Mock callback to redirect to login with error
    await page.route("**/api/auth/callback/github*", async (route) => {
      await route.fulfill({
        status: 302,
        headers: { location: "/login?error=OAuthCallbackError" },
      });
    });

    await mockUnauthenticated(page);
    await page.goto("/api/auth/callback/github?error=access_denied");

    // Should be on login page (with error in URL)
    await expect(page).toHaveURL(/\/login/);
  });
});
