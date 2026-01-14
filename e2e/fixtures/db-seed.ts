/**
 * Database Seeding for E2E Tests
 *
 * Directly seeds PostgreSQL with test data.
 * All test IDs use 'test-' prefix for easy cleanup.
 */

import postgres from "postgres";
import {
  TEST_USERS,
  TEST_PROJECTS,
  TEST_DOCUMENTS,
  TEST_SESSION,
} from "./test-data";

const getDbUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Database URL not configured. Set TEST_DATABASE_URL or DATABASE_URL."
    );
  }
  return url;
};

/**
 * Seed the database with test data
 */
export async function seedTestDatabase(): Promise<void> {
  const sql = postgres(getDbUrl());

  try {
    console.log("[E2E] Seeding test database...");

    // Insert test users
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
    console.log("[E2E] Seeded users:", Object.keys(TEST_USERS).length);

    // Insert test projects
    for (const project of Object.values(TEST_PROJECTS)) {
      await sql`
        INSERT INTO projects (
          id, name, slug, description, github_repo, github_branch,
          chapters_path, is_public, user_id, created_at, updated_at
        )
        VALUES (
          ${project.id}, ${project.name}, ${project.slug}, ${project.description},
          ${project.githubRepo}, ${project.githubBranch}, ${project.chaptersPath},
          ${project.isPublic}, ${project.userId}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          updated_at = NOW()
      `;
    }
    console.log("[E2E] Seeded projects:", Object.keys(TEST_PROJECTS).length);

    // Insert test documents
    for (const doc of Object.values(TEST_DOCUMENTS)) {
      const wordCount = doc.content.split(/\s+/).filter(Boolean).length;
      await sql`
        INSERT INTO documents (
          id, project_id, path, title, draft_content, word_count,
          created_at, updated_at
        )
        VALUES (
          ${doc.id}, ${doc.projectId}, ${doc.path}, ${doc.title},
          ${doc.content}, ${wordCount}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          draft_content = EXCLUDED.draft_content,
          word_count = EXCLUDED.word_count,
          updated_at = NOW()
      `;
    }
    console.log("[E2E] Seeded documents:", Object.keys(TEST_DOCUMENTS).length);

    // Insert test writing session
    await sql`
      INSERT INTO writing_sessions (
        id, share_slug, title, type, content, owner_id, created_at, updated_at
      )
      VALUES (
        ${TEST_SESSION.id}, ${TEST_SESSION.shareSlug}, ${TEST_SESSION.title},
        ${TEST_SESSION.type}, ${TEST_SESSION.content}, ${TEST_USERS.owner.id},
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = NOW()
    `;
    console.log("[E2E] Seeded writing sessions: 1");

    // Insert collaborator relationship for testing
    await sql`
      INSERT INTO project_collaborators (id, project_id, user_id, role, invited_at, accepted_at)
      VALUES (
        'test-collab-rel-001',
        ${TEST_PROJECTS.default.id},
        ${TEST_USERS.collaborator.id},
        'editor',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role
    `;
    console.log("[E2E] Seeded collaborator relationships: 1");

    console.log("[E2E] Database seeding complete!");
  } finally {
    await sql.end();
  }
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestDatabase(): Promise<void> {
  const sql = postgres(getDbUrl());

  try {
    console.log("[E2E] Cleaning up test database...");

    // Delete in order respecting foreign keys
    await sql`DELETE FROM project_collaborators WHERE id LIKE 'test-%'`;
    await sql`DELETE FROM documents WHERE id LIKE 'test-%'`;
    await sql`DELETE FROM projects WHERE id LIKE 'test-%'`;
    await sql`DELETE FROM writing_sessions WHERE id LIKE 'test-%'`;
    await sql`DELETE FROM "user" WHERE id LIKE 'test-%'`;

    console.log("[E2E] Database cleanup complete!");
  } finally {
    await sql.end();
  }
}

/**
 * Reset database to clean state then reseed
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanupTestDatabase();
  await seedTestDatabase();
}
