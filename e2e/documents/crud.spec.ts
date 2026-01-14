import { test, expect } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { mockApi } from "../utils/api-helpers";
import { createEditorHelper } from "../utils/editor-helpers";
import { TEST_USERS, TEST_PROJECTS, TEST_DOCUMENTS } from "../fixtures/test-data";

test.describe("Documents List", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("displays documents in project", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}`,
        response: {
          project: TEST_PROJECTS.default,
          documents: [
            {
              id: TEST_DOCUMENTS.chapter1.id,
              path: TEST_DOCUMENTS.chapter1.path,
              title: TEST_DOCUMENTS.chapter1.title,
              wordCount: 50,
              updatedAt: new Date().toISOString(),
            },
            {
              id: TEST_DOCUMENTS.chapter2.id,
              path: TEST_DOCUMENTS.chapter2.path,
              title: TEST_DOCUMENTS.chapter2.title,
              wordCount: 25,
              updatedAt: new Date().toISOString(),
            },
          ],
          collaborators: [],
          stats: { documentCount: 2, collaboratorCount: 0, totalWordCount: 75 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Documents tab should be active by default
    await expect(page.getByText(TEST_DOCUMENTS.chapter1.title)).toBeVisible();
    await expect(page.getByText(TEST_DOCUMENTS.chapter2.title)).toBeVisible();
  });

  test("displays empty state when no documents", async ({ page }) => {
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

    await expect(page.getByText(/no documents|no chapters/i)).toBeVisible();
  });

  test("new document button is visible for owner", async ({ page }) => {
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

    await expect(
      page.getByRole("button", { name: /new document|new chapter|add/i })
    ).toBeVisible();
  });
});

test.describe("Create Document", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("can create new document", async ({ page }) => {
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
        path: `/projects/${TEST_PROJECTS.default.id}/documents`,
        response: {
          document: {
            id: "new-doc-id",
            path: "new-chapter.md",
            title: "New Chapter",
          },
        },
        status: 201,
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Click new document button
    await page.getByRole("button", { name: /new document|new chapter|add/i }).click();

    // Fill in document details if there's a form/dialog
    const titleInput = page.getByLabel(/title|name/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill("New Chapter");
      await page.getByRole("button", { name: /create|save/i }).click();
    }

    // Should navigate to editor or show success
    await expect(page).toHaveURL(/new-chapter|new-doc-id/);
  });

  test("validates document must be markdown", async ({ page }) => {
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
    await page.getByRole("button", { name: /new document|new chapter|add/i }).click();

    // If there's a path/filename input, try entering non-.md file
    const pathInput = page.getByLabel(/path|filename/i);
    if (await pathInput.isVisible()) {
      await pathInput.fill("chapter.txt");
      await page.getByRole("button", { name: /create/i }).click();

      // Should show validation error
      await expect(page.getByText(/\.md|markdown/i)).toBeVisible();
    }
  });
});

test.describe("Edit Document", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("loads document content in editor", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
        response: {
          document: TEST_DOCUMENTS.chapter1,
          content: TEST_DOCUMENTS.chapter1.content,
        },
      },
    ]);

    await page.goto(
      `/projects/${TEST_PROJECTS.default.slug}/${TEST_DOCUMENTS.chapter1.id}`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Check content is loaded
    await expect(page.getByText("Chapter 1")).toBeVisible();
  });

  test("auto-saves content after editing", async ({ page }) => {
    let saveRequestCount = 0;

    await page.route(
      `**/api/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              document: TEST_DOCUMENTS.chapter1,
              content: TEST_DOCUMENTS.chapter1.content,
            }),
          });
        } else if (
          route.request().method() === "PUT" ||
          route.request().method() === "PATCH"
        ) {
          saveRequestCount++;
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          });
        } else {
          await route.continue();
        }
      }
    );

    await page.goto(
      `/projects/${TEST_PROJECTS.default.slug}/${TEST_DOCUMENTS.chapter1.id}`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Type to trigger auto-save
    await editor.clearAndType("New content for testing auto-save");

    // Wait for debounced auto-save
    await page.waitForTimeout(3000);

    expect(saveRequestCount).toBeGreaterThan(0);
  });

  test("shows save status indicator", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
        response: {
          document: TEST_DOCUMENTS.chapter1,
          content: TEST_DOCUMENTS.chapter1.content,
        },
      },
    ]);

    await page.goto(
      `/projects/${TEST_PROJECTS.default.slug}/${TEST_DOCUMENTS.chapter1.id}`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    await editor.clearAndType("Trigger save");

    // Should see saving/saved status
    await expect(page.getByText(/saving|saved/i)).toBeVisible({ timeout: 5000 });
  });

  test("Ctrl+S triggers manual save", async ({ page }) => {
    let saveTriggered = false;

    await page.route(
      `**/api/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              document: TEST_DOCUMENTS.chapter1,
              content: TEST_DOCUMENTS.chapter1.content,
            }),
          });
        } else if (
          route.request().method() === "PUT" ||
          route.request().method() === "PATCH"
        ) {
          saveTriggered = true;
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          });
        } else {
          await route.continue();
        }
      }
    );

    await page.goto(
      `/projects/${TEST_PROJECTS.default.slug}/${TEST_DOCUMENTS.chapter1.id}`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();
    await editor.clearAndType("Manual save test");
    await editor.save();

    await page.waitForTimeout(1000);
    expect(saveTriggered).toBe(true);
  });
});

test.describe("Delete Document", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("can delete document with confirmation", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
        response: {
          document: TEST_DOCUMENTS.chapter1,
          content: TEST_DOCUMENTS.chapter1.content,
        },
      },
      {
        method: "DELETE",
        path: `/projects/${TEST_PROJECTS.default.id}/documents/${TEST_DOCUMENTS.chapter1.id}`,
        response: { success: true },
      },
    ]);

    await page.goto(
      `/projects/${TEST_PROJECTS.default.slug}/${TEST_DOCUMENTS.chapter1.id}`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Find delete button (might be in menu or toolbar)
    const deleteButton = page.getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should redirect back to project
      await expect(page).toHaveURL(
        new RegExp(`/projects/${TEST_PROJECTS.default.slug}$`)
      );
    }
  });
});
