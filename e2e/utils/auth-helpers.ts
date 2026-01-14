/**
 * Authentication Helpers for E2E Tests
 *
 * These utilities mock NextAuth.js session endpoints to simulate
 * authenticated and unauthenticated states without real OAuth.
 */

import { Page, BrowserContext, Route } from "@playwright/test";
import { TestUser, TEST_USERS } from "../fixtures/test-data";

/**
 * Mock an authenticated NextAuth.js session
 *
 * This intercepts the /api/auth/session endpoint to return
 * a mock session object, simulating a logged-in user.
 */
export async function mockAuthSession(
  page: Page,
  user: TestUser = TEST_USERS.owner
): Promise<void> {
  // Mock the session endpoint
  await page.route("**/api/auth/session", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          login: user.login,
        },
        accessToken: user.accessToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });

  // Mock providers endpoint
  await page.route("**/api/auth/providers", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        github: {
          id: "github",
          name: "GitHub",
          type: "oauth",
          signinUrl: "/api/auth/signin/github",
          callbackUrl: "/api/auth/callback/github",
        },
      }),
    });
  });

  // Mock CSRF token endpoint
  await page.route("**/api/auth/csrf", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        csrfToken: "mock-csrf-token-for-testing",
      }),
    });
  });
}

/**
 * Mock an unauthenticated state
 *
 * Returns an empty session to simulate a logged-out user.
 */
export async function mockUnauthenticated(page: Page): Promise<void> {
  await page.route("**/api/auth/session", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await page.route("**/api/auth/providers", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        github: {
          id: "github",
          name: "GitHub",
          type: "oauth",
          signinUrl: "/api/auth/signin/github",
          callbackUrl: "/api/auth/callback/github",
        },
      }),
    });
  });
}

/**
 * Mock OAuth callback success
 *
 * Simulates a successful GitHub OAuth callback redirect.
 */
export async function mockOAuthCallback(
  page: Page,
  redirectTo: string = "/projects"
): Promise<void> {
  await page.route("**/api/auth/callback/github*", async (route: Route) => {
    await route.fulfill({
      status: 302,
      headers: { location: redirectTo },
    });
  });
}

/**
 * Mock sign-in initiation
 *
 * Intercepts the sign-in request to track OAuth flow initiation.
 */
export async function mockSignIn(
  page: Page,
  callback?: () => void
): Promise<void> {
  await page.route("**/api/auth/signin/github*", async (route: Route) => {
    if (callback) callback();
    await route.fulfill({
      status: 302,
      headers: {
        location:
          "https://github.com/login/oauth/authorize?client_id=mock-client-id",
      },
    });
  });
}

/**
 * Mock sign-out
 *
 * Simulates the sign-out flow.
 */
export async function mockSignOut(
  page: Page,
  redirectTo: string = "/"
): Promise<void> {
  await page.route("**/api/auth/signout*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: redirectTo }),
    });
  });
}

/**
 * Setup authenticated context for all pages in a browser context
 *
 * Useful when you need to share auth state across multiple pages.
 */
export async function setupAuthenticatedContext(
  context: BrowserContext,
  user: TestUser = TEST_USERS.owner
): Promise<Page> {
  const page = await context.newPage();
  await mockAuthSession(page, user);
  return page;
}

/**
 * Clear all auth-related routes
 *
 * Removes any previously set up auth mocks.
 */
export async function clearAuthMocks(page: Page): Promise<void> {
  await page.unrouteAll();
}
