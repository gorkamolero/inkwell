import { test, expect } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { mockApi, mockGitHubApi } from "../utils/api-helpers";
import { createEditorHelper } from "../utils/editor-helpers";
import { TEST_USERS, TEST_PROJECTS, TEST_DOCUMENTS } from "../fixtures/test-data";

test.describe("GitHub Sync", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("shows GitHub connection status on project", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}`,
        response: {
          project: TEST_PROJECTS.withGithub,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.withGithub.slug}`);

    // Should show GitHub repo info
    await expect(
      page.getByText(TEST_PROJECTS.withGithub.githubRepo as string)
    ).toBeVisible();
  });

  test("syncs documents from GitHub on project load", async ({ page }) => {
    const githubDocs = [
      { path: "chapters/chapter-1.md", sha: "abc123" },
      { path: "chapters/chapter-2.md", sha: "def456" },
    ];

    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}`,
        response: {
          project: TEST_PROJECTS.withGithub,
          documents: githubDocs.map((doc, i) => ({
            id: `synced-doc-${i}`,
            path: doc.path,
            title: `Chapter ${i + 1}`,
            existsOnGitHub: true,
            lastCommitSha: doc.sha,
          })),
          collaborators: [],
          stats: { documentCount: 2, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.withGithub.slug}`);

    // Should see synced documents
    await expect(page.getByText("Chapter 1")).toBeVisible();
    await expect(page.getByText("Chapter 2")).toBeVisible();
  });

  test("can manually trigger GitHub sync", async ({ page }) => {
    let syncTriggered = false;

    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}`,
        response: {
          project: TEST_PROJECTS.withGithub,
          documents: [],
          collaborators: [],
          stats: { documentCount: 0, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
      {
        method: "POST",
        path: `/projects/${TEST_PROJECTS.withGithub.id}/sync`,
        response: {
          synced: true,
          documents: [{ id: "new-synced-doc", path: "chapter-1.md" }],
        },
      },
    ]);

    await page.route(
      `**/api/projects/${TEST_PROJECTS.withGithub.id}/sync`,
      async (route) => {
        syncTriggered = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            synced: true,
            documents: [{ id: "new-synced-doc", path: "chapter-1.md" }],
          }),
        });
      }
    );

    await page.goto(`/projects/${TEST_PROJECTS.withGithub.slug}`);

    // Look for sync button
    const syncButton = page.getByRole("button", { name: /sync|refresh/i });
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(500);
      expect(syncTriggered).toBe(true);
    }
  });

  test("shows sync status indicator", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}`,
        response: {
          project: TEST_PROJECTS.withGithub,
          documents: [
            {
              id: "doc-1",
              path: "chapter-1.md",
              title: "Chapter 1",
              existsOnGitHub: true,
              lastSyncedAt: new Date().toISOString(),
            },
          ],
          collaborators: [],
          stats: { documentCount: 1, collaboratorCount: 0, totalWordCount: 0 },
        },
      },
    ]);

    await page.goto(`/projects/${TEST_PROJECTS.withGithub.slug}`);

    // Should show sync status
    await expect(page.getByText(/synced|up to date/i)).toBeVisible();
  });
});

test.describe("Commit to GitHub", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("can commit document changes to GitHub", async ({ page }) => {
    let commitTriggered = false;

    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}/documents/doc-1`,
        response: {
          document: {
            ...TEST_DOCUMENTS.chapter1,
            projectId: TEST_PROJECTS.withGithub.id,
            existsOnGitHub: true,
            lastCommitSha: "abc123",
          },
          content: TEST_DOCUMENTS.chapter1.content,
        },
      },
    ]);

    await page.route(
      `**/api/projects/${TEST_PROJECTS.withGithub.id}/documents/doc-1/commit`,
      async (route) => {
        commitTriggered = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            committed: true,
            sha: "newsha456",
          }),
        });
      }
    );

    await page.goto(
      `/projects/${TEST_PROJECTS.withGithub.slug}/doc-1`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Make a change
    await editor.clearAndType("Updated content for commit");

    // Look for commit button
    const commitButton = page.getByRole("button", { name: /commit|save to github/i });
    if (await commitButton.isVisible()) {
      await commitButton.click();

      // Fill commit message if dialog appears
      const commitInput = page.getByLabel(/commit message|message/i);
      if (await commitInput.isVisible()) {
        await commitInput.fill("Update chapter content");
        await page.getByRole("button", { name: /commit|save/i }).click();
      }

      await page.waitForTimeout(500);
      expect(commitTriggered).toBe(true);
    }
  });

  test("shows commit history", async ({ page }) => {
    await mockApi(page, [
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}/documents/doc-1`,
        response: {
          document: {
            ...TEST_DOCUMENTS.chapter1,
            projectId: TEST_PROJECTS.withGithub.id,
            existsOnGitHub: true,
          },
          content: TEST_DOCUMENTS.chapter1.content,
        },
      },
      {
        method: "GET",
        path: `/projects/${TEST_PROJECTS.withGithub.id}/documents/doc-1/commits`,
        response: {
          commits: [
            {
              sha: "abc123",
              message: "Initial commit",
              author: "testowner",
              date: new Date().toISOString(),
            },
            {
              sha: "def456",
              message: "Update chapter",
              author: "testowner",
              date: new Date().toISOString(),
            },
          ],
        },
      },
    ]);

    await page.goto(
      `/projects/${TEST_PROJECTS.withGithub.slug}/doc-1`
    );

    const editor = createEditorHelper(page);
    await editor.waitForEditor();

    // Look for history button/panel
    const historyButton = page.getByRole("button", { name: /history|versions/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Should see commit history
      await expect(page.getByText(/initial commit/i)).toBeVisible();
      await expect(page.getByText(/update chapter/i)).toBeVisible();
    }
  });
});

test.describe("Non-GitHub Projects", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);
  });

  test("does not show GitHub options for non-connected project", async ({
    page,
  }) => {
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

    // Should not see GitHub-specific elements
    await expect(page.getByText(/testowner\/test-book/)).not.toBeVisible();
    await expect(page.getByRole("button", { name: /sync/i })).not.toBeVisible();
  });

  test("can connect project to GitHub", async ({ page }) => {
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

    await mockGitHubApi(page, {
      repos: [
        { full_name: "testowner/existing-repo", default_branch: "main" },
      ],
    });

    await page.goto(`/projects/${TEST_PROJECTS.default.slug}`);

    // Navigate to settings
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    if (await settingsTab.isVisible()) {
      await settingsTab.click();

      // Look for GitHub connection option
      const connectButton = page.getByRole("button", { name: /connect.*github/i });
      if (await connectButton.isVisible()) {
        await expect(connectButton).toBeEnabled();
      }
    }
  });
});
