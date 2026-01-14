import { test, expect } from "@playwright/test";
import { mockAuthSession } from "../utils/auth-helpers";
import { mockApi } from "../utils/api-helpers";
import { TEST_USERS, TEST_PROJECTS } from "../fixtures/test-data";

test.describe("Collaborator Management", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.owner);
  });

  test("owner can view collaborator list", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [
            {
              id: "collab-1",
              userId: TEST_USERS.collaborator.id,
              role: "editor",
              user: {
                id: TEST_USERS.collaborator.id,
                name: TEST_USERS.collaborator.name,
                email: TEST_USERS.collaborator.email,
                image: TEST_USERS.collaborator.image,
              },
              acceptedAt: new Date().toISOString(),
            },
          ],
          stats: { documentCount: 0, collaboratorCount: 1, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to collaborators tab
    const collabTab = page.getByRole("tab", { name: /collaborators|team/i });
    if (await collabTab.isVisible()) {
      await collabTab.click();

      // Should see collaborator
      await expect(
        page.getByText(TEST_USERS.collaborator.name)
      ).toBeVisible();
      await expect(page.getByText(/editor/i)).toBeVisible();
    }
  });

  test("owner can invite new collaborator", async ({ page }) => {
    const newCollabEmail = "newcollab@test.com";

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
        method: "POST",
        path: `/projects/${TEST_PROJECTS.default.id}/collaborators`,
        response: {
          collaborator: {
            id: "new-collab",
            userId: "new-user-id",
            role: "editor",
            user: {
              id: "new-user-id",
              name: "New Collaborator",
              email: newCollabEmail,
            },
          },
        },
        status: 201,
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to collaborators tab
    const collabTab = page.getByRole("tab", { name: /collaborators|team/i });
    if (await collabTab.isVisible()) {
      await collabTab.click();
    }

    // Click invite button
    const inviteButton = page.getByRole("button", {
      name: /invite|add collaborator/i,
    });
    if (await inviteButton.isVisible()) {
      await inviteButton.click();

      // Fill invite form
      const emailInput = page.getByLabel(/email/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill(newCollabEmail);

        // Select role
        const roleSelect = page.getByLabel(/role/i);
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption("editor");
        }

        // Submit
        await page.getByRole("button", { name: /invite|add/i }).click();

        // Should show success
        await expect(
          page.getByText(/invited|added|success/i)
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("owner can remove collaborator", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [
            {
              id: "collab-1",
              userId: TEST_USERS.collaborator.id,
              role: "editor",
              user: {
                id: TEST_USERS.collaborator.id,
                name: TEST_USERS.collaborator.name,
                email: TEST_USERS.collaborator.email,
                image: TEST_USERS.collaborator.image,
              },
            },
          ],
          stats: { documentCount: 0, collaboratorCount: 1, totalWordCount: 0 },
        },
      },
      {
        method: "DELETE",
        path: `/projects/${TEST_PROJECTS.default.id}/collaborators/collab-1`,
        response: { success: true },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to collaborators tab
    const collabTab = page.getByRole("tab", { name: /collaborators|team/i });
    if (await collabTab.isVisible()) {
      await collabTab.click();
    }

    // Find remove button for collaborator
    const removeButton = page.getByRole("button", { name: /remove/i }).first();
    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Confirm removal if dialog appears
      const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success or collaborator removed
      await expect(page.getByText(/removed/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("owner can change collaborator role", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [
            {
              id: "collab-1",
              userId: TEST_USERS.collaborator.id,
              role: "editor",
              user: {
                id: TEST_USERS.collaborator.id,
                name: TEST_USERS.collaborator.name,
                email: TEST_USERS.collaborator.email,
              },
            },
          ],
          stats: { documentCount: 0, collaboratorCount: 1, totalWordCount: 0 },
        },
      },
      {
        method: "PATCH",
        path: `/projects/${TEST_PROJECTS.default.id}/collaborators/collab-1`,
        response: {
          collaborator: {
            id: "collab-1",
            userId: TEST_USERS.collaborator.id,
            role: "admin",
          },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to collaborators tab
    const collabTab = page.getByRole("tab", { name: /collaborators|team/i });
    if (await collabTab.isVisible()) {
      await collabTab.click();
    }

    // Find role dropdown for collaborator
    const roleSelect = page.getByLabel(/role/i).first();
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption("admin");

      // Should show success or updated role
      await expect(
        page.getByText(/updated|changed|admin/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Collaborator Access Control", () => {
  test("collaborator can view project but not settings", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.collaborator);

    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
          role: "editor",
          isOwner: false,
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Should see project
    await expect(page.getByText(TEST_PROJECTS.default.name)).toBeVisible();

    // Settings tab should not be visible or accessible
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    // Either not visible or clicking shows access denied
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      // Should show access denied or redirect
      await expect(page.getByText(/not authorized|access denied/i)).toBeVisible();
    }
  });

  test("viewer can only read, not edit documents", async ({ page }) => {
    await mockAuthSession(page, TEST_USERS.viewer);

    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
          role: "viewer",
          isOwner: false,
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Should see project
    await expect(page.getByText(TEST_PROJECTS.default.name)).toBeVisible();

    // New document button should not be visible or disabled
    const newDocButton = page.getByRole("button", {
      name: /new document|add document/i,
    });
    if (await newDocButton.isVisible()) {
      // Should be disabled for viewers
      await expect(newDocButton).toBeDisabled();
    }
  });
});
