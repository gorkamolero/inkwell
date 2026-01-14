/**
 * Test Data Constants
 *
 * All test IDs use 'test-' prefix for easy cleanup.
 * These constants match the database seeding in db-seed.ts
 */

export interface TestUser {
  id: string;
  name: string;
  email: string;
  image: string;
  login: string; // GitHub username
  accessToken: string;
}

export interface TestProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  githubRepo: string | null;
  githubBranch: string;
  chaptersPath: string;
  isPublic: boolean;
  userId: string;
}

export interface TestDocument {
  id: string;
  projectId: string;
  path: string;
  title: string;
  content: string;
}

// Test users with realistic data
export const TEST_USERS = {
  owner: {
    id: "test-user-owner-001",
    name: "Test Owner",
    email: "owner@test.hotpress.dev",
    image: "https://avatars.githubusercontent.com/u/1?v=4",
    login: "testowner",
    accessToken: "mock-github-token-owner",
  },
  collaborator: {
    id: "test-user-collab-001",
    name: "Test Collaborator",
    email: "collab@test.hotpress.dev",
    image: "https://avatars.githubusercontent.com/u/2?v=4",
    login: "testcollab",
    accessToken: "mock-github-token-collab",
  },
  viewer: {
    id: "test-user-viewer-001",
    name: "Test Viewer",
    email: "viewer@test.hotpress.dev",
    image: "https://avatars.githubusercontent.com/u/3?v=4",
    login: "testviewer",
    accessToken: "mock-github-token-viewer",
  },
} as const satisfies Record<string, TestUser>;

// Test projects
export const TEST_PROJECTS = {
  default: {
    id: "test-project-001",
    name: "Test Book Project",
    slug: "test-book-project",
    description: "A test project for E2E testing",
    githubRepo: null,
    githubBranch: "main",
    chaptersPath: "",
    isPublic: false,
    userId: TEST_USERS.owner.id,
  },
  withGithub: {
    id: "test-project-002",
    name: "GitHub Connected Project",
    slug: "github-connected-project",
    description: "Project connected to GitHub",
    githubRepo: "testowner/test-book",
    githubBranch: "main",
    chaptersPath: "chapters",
    isPublic: false,
    userId: TEST_USERS.owner.id,
  },
  public: {
    id: "test-project-003",
    name: "Public Project",
    slug: "public-project",
    description: "A public test project",
    githubRepo: null,
    githubBranch: "main",
    chaptersPath: "",
    isPublic: true,
    userId: TEST_USERS.owner.id,
  },
} as const satisfies Record<string, TestProject>;

// Test documents
export const TEST_DOCUMENTS = {
  chapter1: {
    id: "test-doc-001",
    projectId: TEST_PROJECTS.default.id,
    path: "chapter-1.md",
    title: "Chapter 1: The Beginning",
    content: `# Chapter 1: The Beginning

This is the first chapter of our test book. It contains multiple paragraphs to test the editor functionality.

## The Journey Starts

Here we begin our journey through the testing landscape. Every good story needs a solid foundation.

---

The scene break above separates our introduction from the main content.`,
  },
  chapter2: {
    id: "test-doc-002",
    projectId: TEST_PROJECTS.default.id,
    path: "chapter-2.md",
    title: "Chapter 2: The Middle",
    content: `# Chapter 2: The Middle

The story continues with more content for testing purposes.`,
  },
} as const satisfies Record<string, TestDocument>;

// Test session (for anonymous writing)
export const TEST_SESSION = {
  id: "test-session-001",
  shareSlug: "test-share-slug",
  title: "Test Writing Session",
  type: "book" as const,
  content: "# Test Content\n\nSome initial content for testing.",
};

// Helper to get user by role
export function getTestUser(
  role: keyof typeof TEST_USERS = "owner"
): TestUser {
  return TEST_USERS[role];
}
