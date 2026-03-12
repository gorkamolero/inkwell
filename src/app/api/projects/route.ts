import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  type AuthContext,
  generateId,
  generateSlug,
  getGitHubAccessToken,
  validateBody,
  withAuth,
} from "@/lib/api-utils";
import { ensureUniqueProjectPublicSlug } from "@/lib/document-routing";
import { db, projectCollaborators, projects } from "@/lib/db";
import {
  createRepository,
  getInstallationId,
  getInstallationOctokit,
  getInstallUrl,
} from "@/lib/github-app";
import { canCreateProject } from "@/lib/subscription";

// ============================================================================
// Schemas
// ============================================================================

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().max(500).optional(),
  githubRepo: z
    .string()
    .regex(
      /^(__NEW__:.+:.+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/,
      "Invalid repository format",
    )
    .optional(),
  githubBranch: z.string().max(100).optional(),
  chaptersPath: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// ============================================================================
// GET /api/projects - List user's projects
// ============================================================================

async function listProjectsHandler(
  _request: NextRequest,
  { userId }: AuthContext,
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Get projects where user is owner
  const ownedProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.updatedAt)],
    with: {
      documents: {
        columns: {
          id: true,
        },
      },
      collaborators: {
        columns: {
          id: true,
        },
      },
    },
  });

  // Get projects where user is collaborator
  const collaborations = await db.query.projectCollaborators.findMany({
    where: eq(projectCollaborators.userId, userId),
    with: {
      project: {
        with: {
          documents: {
            columns: {
              id: true,
            },
          },
          collaborators: {
            columns: {
              id: true,
            },
          },
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  const collaboratedProjects = collaborations
    .filter((c) => c.project)
    .map((c) => ({
      ...c.project,
      role: c.role,
      isCollaborator: true,
    }));

  // Format owned projects
  const formattedOwned = ownedProjects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    publicSlug: p.publicSlug,
    description: p.description,
    githubRepo: p.githubRepo,
    githubBranch: p.githubBranch,
    chaptersPath: p.chaptersPath,
    isPublic: p.isPublic,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    documentCount: p.documents.length,
    collaboratorCount: p.collaborators.length,
    role: "owner" as const,
    isOwner: true,
  }));

  // Format collaborated projects
  const formattedCollaborated = collaboratedProjects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    publicSlug: p.publicSlug,
    description: p.description,
    githubRepo: p.githubRepo,
    githubBranch: p.githubBranch,
    chaptersPath: p.chaptersPath,
    isPublic: p.isPublic,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    documentCount: p.documents.length,
    collaboratorCount: p.collaborators.length,
    role: p.role,
    isOwner: false,
    owner: p.owner,
  }));

  return NextResponse.json({
    projects: [...formattedOwned, ...formattedCollaborated],
  });
}

export const GET = withAuth(listProjectsHandler);

// ============================================================================
// POST /api/projects - Create a new project
// ============================================================================

async function createProjectHandler(
  request: NextRequest,
  { userId }: AuthContext,
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Check subscription limits
  const canCreate = await canCreateProject(userId);
  if (!canCreate) {
    throw ApiError.limitExceeded(
      "You have reached your project limit. Please upgrade your plan to create more projects.",
    );
  }

  const body = await validateBody(request, createProjectSchema);

  // Generate slug from name
  let slug = generateSlug(body.name);

  // Check if slug already exists for this user
  const existingProject = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.userId, userId)),
  });

  if (existingProject) {
    // Append a random suffix if slug exists
    slug = `${slug}-${generateId().slice(0, 8)}`;
  }

  const publicSlug = await ensureUniqueProjectPublicSlug({ value: slug });

  const projectId = generateId();
  const now = new Date();

  // Handle __NEW__:reponame:visibility format - create the repo
  let githubRepo = body.githubRepo ?? null;
  let githubBranch = body.githubBranch ?? null;

  if (githubRepo?.startsWith("__NEW__:")) {
    const parts = githubRepo.split(":");
    const repoName = parts[1];
    const visibility = parts[2] || "private";
    const isPrivate = visibility === "private";

    // Get user's GitHub access token (still needed for repo creation)
    const accessToken = await getGitHubAccessToken(userId);
    if (!accessToken) {
      throw ApiError.forbidden(
        "GitHub account not connected. Please sign in with GitHub to create repositories.",
      );
    }

    const result = await createRepository(
      accessToken,
      repoName,
      isPrivate,
      body.description,
    );

    if (!result) {
      throw ApiError.badRequest(
        "Could not create repository. You may need to grant additional permissions or the repository name may already exist.",
      );
    }

    githubRepo = `${result.owner}/${result.repo}`;
    githubBranch = result.defaultBranch;

    // Note: After creating the repo, user needs to install the GitHub App on it
    // The frontend should guide them to do this
  } else if (githubRepo && !githubBranch) {
    // If connecting to an existing GitHub repo, fetch the actual default branch
    const [owner, repoName] = githubRepo.split("/");
    try {
      const installationId = await getInstallationId(owner);
      if (installationId) {
        const octokit = await getInstallationOctokit(installationId);
        const { data: repoData } = await octokit.repos.get({
          owner,
          repo: repoName,
        });
        githubBranch = repoData.default_branch;
      } else {
        // GitHub App not installed - throw error
        throw ApiError.forbidden(
          `GitHub App not installed. Please install the Hotpress app at ${getInstallUrl()} for the ${owner} account.`,
        );
      }
    } catch (error) {
      console.error("Failed to fetch default branch:", error);
      // Fall back to "main" if we can't fetch
      githubBranch = "main";
    }
  }

  const [newProject] = await db
    .insert(projects)
    .values({
      id: projectId,
      name: body.name,
      slug,
      publicSlug,
      description: body.description ?? null,
      githubRepo,
      githubBranch: githubBranch ?? "main",
      chaptersPath: body.chaptersPath ?? "",
      isPublic: body.isPublic ?? false,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ project: newProject }, { status: 201 });
}

export const POST = withAuth(createProjectHandler);
