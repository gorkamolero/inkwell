/**
 * API Helpers for E2E Tests
 *
 * Utilities for mocking and intercepting API requests in tests.
 */

import { Page, Route, Request } from "@playwright/test";

export interface ApiMock {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string | RegExp;
  response: unknown;
  status?: number;
  contentType?: string;
}

/**
 * Mock multiple API endpoints
 *
 * @example
 * await mockApi(page, [
 *   { method: "GET", path: "/projects", response: { projects: [] } },
 *   { method: "POST", path: "/projects", response: { project: {...} }, status: 201 },
 * ]);
 */
export async function mockApi(page: Page, mocks: ApiMock[]): Promise<void> {
  for (const mock of mocks) {
    const pattern =
      typeof mock.path === "string" ? `**/api${mock.path}` : mock.path;

    await page.route(pattern, async (route: Route) => {
      if (route.request().method() === mock.method) {
        await route.fulfill({
          status: mock.status ?? 200,
          contentType: mock.contentType ?? "application/json",
          body: JSON.stringify(mock.response),
        });
      } else {
        await route.continue();
      }
    });
  }
}

/**
 * Mock a single API endpoint
 */
export async function mockApiEndpoint(
  page: Page,
  method: ApiMock["method"],
  path: string,
  response: unknown,
  status: number = 200
): Promise<void> {
  await mockApi(page, [{ method, path, response, status }]);
}

/**
 * Mock an API error response
 */
export async function mockApiError(
  page: Page,
  method: ApiMock["method"],
  path: string,
  errorMessage: string,
  status: number = 400
): Promise<void> {
  await mockApi(page, [
    {
      method,
      path,
      response: { error: errorMessage },
      status,
    },
  ]);
}

/**
 * Track API requests to a specific path
 *
 * @returns Array that will be populated with requests
 */
export async function interceptApiCalls(
  page: Page,
  path: string | RegExp
): Promise<Request[]> {
  const requests: Request[] = [];
  const pattern = typeof path === "string" ? `**/api${path}` : path;

  await page.route(pattern, async (route: Route) => {
    requests.push(route.request());
    await route.continue();
  });

  return requests;
}

/**
 * Wait for a specific API call
 */
export async function waitForApiCall(
  page: Page,
  path: string,
  method: string = "GET",
  timeout: number = 10000
): Promise<Request> {
  return page.waitForRequest(
    (req) => req.url().includes(path) && req.method() === method,
    { timeout }
  );
}

/**
 * Wait for an API response
 */
export async function waitForApiResponse(
  page: Page,
  path: string,
  status?: number,
  timeout: number = 10000
): Promise<unknown> {
  const response = await page.waitForResponse(
    (res) => {
      const urlMatch = res.url().includes(path);
      const statusMatch = status === undefined || res.status() === status;
      return urlMatch && statusMatch;
    },
    { timeout }
  );

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Count API calls to a specific endpoint
 */
export function createApiCounter(
  page: Page,
  path: string,
  method?: string
): { getCount: () => number; reset: () => void } {
  let count = 0;

  page.on("request", (request) => {
    if (
      request.url().includes(path) &&
      (method === undefined || request.method() === method)
    ) {
      count++;
    }
  });

  return {
    getCount: () => count,
    reset: () => {
      count = 0;
    },
  };
}

/**
 * Mock GitHub API endpoints (for GitHub-connected projects)
 */
export async function mockGitHubApi(
  page: Page,
  mocks: {
    repos?: unknown[];
    contents?: Record<string, unknown>;
  }
): Promise<void> {
  if (mocks.repos !== undefined) {
    await page.route("**/api/github/repos*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ repos: mocks.repos }),
      });
    });
  }

  if (mocks.contents !== undefined) {
    await page.route("**/api/github/contents*", async (route: Route) => {
      const url = new URL(route.request().url());
      const path = url.searchParams.get("path") ?? "";
      const content = mocks.contents[path];

      if (content) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(content),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Not found" }),
        });
      }
    });
  }
}

/**
 * Allow all API calls to pass through (remove mocks)
 */
export async function clearApiMocks(page: Page): Promise<void> {
  await page.unrouteAll();
}
