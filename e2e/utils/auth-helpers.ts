/**
 * Authentication Helpers for E2E Tests
 *
 * Creates properly signed JWT cookies to authenticate with NextAuth v5.
 * The middleware checks JWT cookies on the server, so we need real tokens.
 */

import { Page, BrowserContext, Route } from "@playwright/test";
import { encode } from "@auth/core/jwt";
import { TestUser, TEST_USERS } from "../fixtures/test-data";

// Load AUTH_SECRET from environment
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  console.warn(
    "AUTH_SECRET not found in environment. Auth mocking may not work."
  );
}

/**
 * Create an authenticated session by setting a valid JWT cookie
 *
 * This creates a properly signed JWT that the NextAuth middleware will accept.
 */
export async function mockAuthSession(
  page: Page,
  user: TestUser = TEST_USERS.owner
): Promise<void> {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for auth mocking");
  }

  // Create the JWT token with the same structure NextAuth expects
  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      login: user.login,
      accessToken: user.accessToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    secret: AUTH_SECRET,
    salt: "authjs.session-token",
  });

  // Set the session cookie for localhost
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: "Lax",
    },
  ]);

  // Also mock the session endpoint for client-side fetching
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
 * Set up authentication before navigating to a page
 *
 * Use this when you need to be authenticated before the first navigation.
 */
export async function setupAuthBeforeNavigation(
  page: Page,
  user: TestUser = TEST_USERS.owner
): Promise<void> {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for auth mocking");
  }

  // Create the JWT token
  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      login: user.login,
      accessToken: user.accessToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    secret: AUTH_SECRET,
    salt: "authjs.session-token",
  });

  // Set cookies before any navigation
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Set up API mocks
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
}

/**
 * Mock an unauthenticated state
 *
 * Clears auth cookies and returns empty session.
 */
export async function mockUnauthenticated(page: Page): Promise<void> {
  // Clear any existing auth cookies
  await page.context().clearCookies();

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
 * Simulates the sign-out flow and clears cookies.
 */
export async function mockSignOut(
  page: Page,
  redirectTo: string = "/"
): Promise<void> {
  await page.route("**/api/auth/signout*", async (route: Route) => {
    // Clear auth cookies
    await page.context().clearCookies();

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
  await setupAuthBeforeNavigation(page, user);
  return page;
}

/**
 * Clear all auth-related routes and cookies
 *
 * Removes any previously set up auth mocks.
 */
export async function clearAuthMocks(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.unrouteAll();
}
