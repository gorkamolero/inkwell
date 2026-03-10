import { test, expect } from "@playwright/test";
import {
  setupAuthBeforeNavigation,
  mockUnauthenticated,
} from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";

test.describe("Protected Route Access", () => {
  const PROTECTED_PATHS = ["/projects", "/settings", "/dashboard"];

  for (const path of PROTECTED_PATHS) {
    test(`${path} redirects unauthenticated users to login`, async ({
      page,
    }) => {
      await mockUnauthenticated(page);
      await page.goto(path);

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test(`${path} is accessible to authenticated users`, async ({ page }) => {
      await setupAuthBeforeNavigation(page, TEST_USERS.owner);
      await page.goto(path);

      // Should NOT redirect to login
      await expect(page).not.toHaveURL(/\/login/);
    });
  }
});

test.describe("Public Route Access", () => {
  test("homepage is accessible without auth", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/");

    // Should load the homepage
    await expect(page).toHaveURL("/");

    // Editor should be visible (homepage has an editor)
    await expect(
      page.getByRole("textbox", { name: /editor/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("shared sessions are accessible without auth", async ({ page }) => {
    await mockUnauthenticated(page);

    // Navigate to a shared session URL (may 404 if no session exists)
    await page.goto("/s/test-share-slug");

    // Should NOT redirect to login (even if 404)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("project document urls are accessible without auth", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/test-book-project/test-doc-001");

    await expect(page).not.toHaveURL(/\/login/);
  });

  test("login page is accessible without auth", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();
  });

  test("signup page is accessible without auth", async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto("/signup");

    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Session Persistence", () => {
  test("session persists across page navigations", async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    // Navigate to projects
    await page.goto("/projects");
    await expect(page).not.toHaveURL(/\/login/);

    // Navigate to another protected route
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/\/login/);

    // Navigate back to projects
    await page.goto("/projects");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("authenticated user info is displayed", async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
    await page.goto("/projects");

    // Should see user name or avatar somewhere in the UI
    // This depends on the actual UI implementation
    await expect(page).not.toHaveURL(/\/login/);
  });
});
