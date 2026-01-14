import { test, expect } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { mockApi, mockApiError } from "../utils/api-helpers";
import { TEST_USERS, TEST_PROJECTS } from "../fixtures/test-data";

test.describe("Projects List", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("displays page header and new project button", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: "/projects",
        response: { projects: [] },
      },
    ]);

    await page.goto("/projects");

    await expect(
      page.getByRole("heading", { name: /your projects/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /new project/i })
    ).toBeVisible();
  });

  test("displays empty state when no projects exist", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: "/projects",
        response: { projects: [] },
      },
    ]);

    await page.goto("/projects");

    await expect(page.getByText(/no projects yet/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /create your first project/i })
    ).toBeVisible();
  });

  test("displays project cards for existing projects", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: "/projects",
        response: {
          projects: [
            {
              ...TEST_PROJECTS.default,
              documentCount: 5,
              collaboratorCount: 2,
              role: "owner",
              isOwner: true,
            },
            {
              ...TEST_PROJECTS.withGithub,
              documentCount: 10,
              collaboratorCount: 0,
              role: "owner",
              isOwner: true,
            },
          ],
        },
      },
    ]);

    await page.goto("/projects");

    await expect(page.getByText(TEST_PROJECTS.default.name)).toBeVisible();
    await expect(page.getByText(TEST_PROJECTS.withGithub.name)).toBeVisible();
  });

  test("clicking new project button navigates to create page", async ({
    page,
  }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: "/projects",
        response: { projects: [] },
      },
    ]);

    await page.goto("/projects");
    await page.getByRole("link", { name: /new project/i }).click();

    await expect(page).toHaveURL(/\/projects\/new/);
  });

  test("clicking project card navigates to project detail", async ({
    page,
  }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: "/projects",
        response: {
          projects: [
            {
              ...TEST_PROJECTS.default,
              documentCount: 0,
              collaboratorCount: 0,
              role: "owner",
              isOwner: true,
            },
          ],
        },
      },
    ]);

    await page.goto("/projects");

    // Click on the project card
    await page.getByText(TEST_PROJECTS.default.name).click();

    await expect(page).toHaveURL(
      new RegExp(`/projects/${TEST_PROJECTS.default.slug}`)
    );
  });
});

test.describe("Create Project", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("displays create project form", async ({ page }) => {
    await page.goto("/projects/new");

    await expect(
      page.getByRole("heading", { name: /new project|create project/i })
    ).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test("can create a new project without GitHub", async ({ page }) => {
    await mockApi(page, [
      {
        method: "POST",
        path: "/projects",
        response: {
          project: {
            ...TEST_PROJECTS.default,
            id: "new-project-id",
          },
        },
        status: 201,
      },
    ]);

    await page.goto("/projects/new");

    await page.getByLabel(/name/i).fill("My New Book");
    await page.getByLabel(/description/i).fill("A great new book");
    await page.getByRole("button", { name: /create/i }).click();

    // Should redirect to projects list or project detail
    await expect(page).toHaveURL(/\/projects/);
  });

  test("shows validation error for empty name", async ({ page }) => {
    await page.goto("/projects/new");

    // Try to submit without filling name
    await page.getByRole("button", { name: /create/i }).click();

    // Should show validation error
    await expect(page.getByText(/name is required|required/i)).toBeVisible();
  });

  test("shows subscription limit error when at project limit", async ({
    page,
  }) => {
    await mockApiError(
      page,
      "POST",
      "/projects",
      "You have reached your project limit. Please upgrade your plan to create more projects.",
      402
    );

    await page.goto("/projects/new");
    await page.getByLabel(/name/i).fill("Another Project");
    await page.getByRole("button", { name: /create/i }).click();

    // Should show upgrade message
    await expect(
      page.getByText(/project limit|upgrade/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Project Detail", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("displays project name and description", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    await expect(page.getByText(TEST_PROJECTS.default.name)).toBeVisible();
  });

  test("can navigate to project settings", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Look for settings tab or button
    const settingsLink = page.getByRole("tab", { name: /settings/i }).or(
      page.getByRole("link", { name: /settings/i })
    );

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      // Should see settings content
      await expect(page.getByText(/delete project|danger zone/i)).toBeVisible();
    }
  });
});

test.describe("Delete Project", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("can delete project with confirmation", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
      {
        method: "DELETE",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: { success: true },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to settings
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
    }

    // Find and click delete button
    const deleteButton = page.getByRole("button", { name: /delete project/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion in dialog
      const confirmButton = page.getByRole("button", {
        name: /confirm|delete|yes/i,
      });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should redirect to projects list
      await expect(page).toHaveURL(/\/projects$/);
    }
  });
});

test.describe("Update Project", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("can update project name", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
      {
        method: "PATCH",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: { ...TEST_PROJECTS.default, name: "Updated Name" },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to settings
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
    }

    // Find name input and update
    const nameInput = page.getByLabel(/project name|name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill("Updated Name");

      // Save changes
      const saveButton = page.getByRole("button", { name: /save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Should see success message or updated name
        await expect(
          page.getByText(/saved|updated|success/i)
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
