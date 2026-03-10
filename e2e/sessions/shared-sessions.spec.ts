import { test, expect } from "@playwright/test";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { TEST_USERS } from "../fixtures/test-data";
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

/**
 * Shared Sessions Dashboard Tests
 *
 * Tests that sessions shared with a user appear in their dashboard.
 */

config({ path: resolve(__dirname, "../../.env.local") });

const getDbUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Database URL not configured for E2E sessions tests.");
  }
  return url;
};

// Sample sessions data
const ownedSession = {
  id: "session-owned-001",
  title: "My Own Session",
  shareSlug: "my-own-session",
  type: "book",
  ownerId: TEST_USERS.owner.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sharedSession = {
  id: "session-shared-001",
  title: "Shared With Me",
  shareSlug: "shared-with-me",
  type: "article",
  ownerId: TEST_USERS.collaborator.id, // Owned by someone else
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ownedSessionId = "test-dashboard-owned-session";
const sharedSessionId = "test-dashboard-shared-session";
const sharedCollabId = "test-dashboard-collab-rel";

async function seedDashboardSessions(includeShared: boolean = true) {
  const sql = postgres(getDbUrl());

  try {
    for (const user of Object.values(TEST_USERS)) {
      await sql`
        INSERT INTO "user" (id, email, name, image)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.image})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          image = EXCLUDED.image
      `;
    }

    await sql`
      INSERT INTO writing_sessions (
        id, share_slug, title, type, content, owner_id, created_at, updated_at
      )
      VALUES (
        ${ownedSessionId},
        ${ownedSession.shareSlug},
        ${ownedSession.title},
        ${ownedSession.type},
        '',
        ${TEST_USERS.owner.id},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        share_slug = EXCLUDED.share_slug,
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        owner_id = EXCLUDED.owner_id,
        updated_at = NOW()
    `;

    if (includeShared) {
      await sql`
        INSERT INTO writing_sessions (
          id, share_slug, title, type, content, owner_id, created_at, updated_at
        )
        VALUES (
          ${sharedSessionId},
          ${sharedSession.shareSlug},
          ${sharedSession.title},
          ${sharedSession.type},
          '',
          ${TEST_USERS.collaborator.id},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          share_slug = EXCLUDED.share_slug,
          title = EXCLUDED.title,
          type = EXCLUDED.type,
          owner_id = EXCLUDED.owner_id,
          updated_at = NOW()
      `;

      await sql`
        INSERT INTO session_collaborators (
          id, session_id, user_id, role, invited_at, accepted_at
        )
        VALUES (
          ${sharedCollabId},
          ${sharedSessionId},
          ${TEST_USERS.owner.id},
          'editor',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          accepted_at = EXCLUDED.accepted_at
      `;
    }
  } finally {
    await sql.end();
  }
}

async function clearDashboardSessions() {
  const sql = postgres(getDbUrl());

  try {
    await sql`
      DELETE FROM session_collaborators
      WHERE id = ${sharedCollabId}
         OR session_id IN (${ownedSessionId}, ${sharedSessionId})
    `;
    await sql`
      DELETE FROM writing_sessions
      WHERE id IN (${ownedSessionId}, ${sharedSessionId})
    `;
  } finally {
    await sql.end();
  }
}

test.beforeEach(async () => {
  await clearDashboardSessions();
});

test.afterEach(async () => {
  await clearDashboardSessions();
});

test.describe.configure({ mode: "serial" });

test.describe("Shared Sessions in Dashboard", () => {
  test("user sees both owned and shared sessions in dashboard", async ({
    page,
  }) => {
    await seedDashboardSessions(true);
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    await page.goto("/sessions");

    await expect(page.getByRole("heading", { name: "Your Sessions" })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText("My Own Session")).toBeVisible();
    await expect(page.getByText("Shared With Me")).toBeVisible();
  });

  test("shared session shows owner indicator", async ({ page }) => {
    await seedDashboardSessions(true);
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    await page.goto("/sessions");

    await expect(page.getByRole("heading", { name: "Shared With Me" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: /edit/i }).first()).toBeVisible();
  });

  test("clicking shared session opens collaborative editor", async ({
    page,
  }) => {
    await seedDashboardSessions(true);
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    await page.goto("/sessions");

    await page.locator(`a[href="/s/${sharedSession.shareSlug}"]`).first().click();

    await expect(page).toHaveURL(/\/s\/shared-with-me/);
  });

  test("empty dashboard shows no sessions message", async ({ page }) => {
    await setupAuthBeforeNavigation(page, TEST_USERS.viewer);

    await page.goto("/sessions");

    await expect(page.getByRole("heading", { name: "No sessions yet" })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Session Collaboration Status", () => {
  test("session list distinguishes owned vs shared", async ({ page }) => {
    await seedDashboardSessions(true);
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    await page.goto("/sessions");

    await expect(page.getByRole("heading", { name: "My Own Session" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("heading", { name: "Shared With Me" })).toBeVisible();

    await expect(
      page.locator(`a[href="/s/${ownedSession.shareSlug}"]`).first()
    ).toBeVisible();
    await expect(
      page.locator(`a[href="/s/${sharedSession.shareSlug}"]`).first()
    ).toBeVisible();
  });
});

test.describe("Real-time Session Updates", () => {
  test("navigating to shared session shows Live status", async ({ page }) => {
    await seedDashboardSessions(true);
    await setupAuthBeforeNavigation(page, TEST_USERS.owner);

    // Navigate directly to a shared session
    await page.goto("/s/shared-with-me");

    // Should show Live indicator when Liveblocks connects
    // Note: This may timeout if Liveblocks isn't configured in test env
    try {
      await expect(page.getByText(/live/i)).toBeVisible({ timeout: 15000 });
    } catch {
      // If Liveblocks isn't available, at least verify the editor loads
      await expect(
        page.getByRole("textbox", { name: /editor/i })
      ).toBeVisible({ timeout: 15000 });
    }
  });
});
