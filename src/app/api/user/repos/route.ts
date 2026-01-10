import { NextRequest, NextResponse } from "next/server";
import { withAuth, ApiError, type AuthContext } from "@/lib/api-utils";
import { listUserRepos, createRepo } from "@/lib/github";
import { z } from "zod";
import { validateBody } from "@/lib/api-utils";

// ============================================================================
// Schemas
// ============================================================================

const createRepoSchema = z.object({
  name: z
    .string()
    .min(1, "Repository name is required")
    .max(100, "Repository name must be 100 characters or less")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Repository name can only contain letters, numbers, hyphens, underscores, and dots"
    ),
  isPrivate: z.boolean().optional().default(true),
});

// ============================================================================
// GET /api/user/repos - List user's GitHub repositories
// ============================================================================

async function listReposHandler(
  request: NextRequest,
  { accessToken }: AuthContext
) {
  if (!accessToken) {
    throw ApiError.forbidden(
      "GitHub account not connected. Please connect your GitHub account to view repositories."
    );
  }

  try {
    const repos = await listUserRepos(accessToken);

    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        private: repo.private,
        defaultBranch: repo.defaultBranch,
      })),
    });
  } catch (error) {
    console.error("Error listing repos:", error);

    // Check for specific GitHub errors
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        throw ApiError.unauthorized(
          "GitHub authentication failed. Please reconnect your GitHub account."
        );
      }
      if (error.message.includes("rate limit")) {
        throw new ApiError(
          "GitHub API rate limit exceeded. Please try again later.",
          429,
          "RATE_LIMITED"
        );
      }
    }

    throw ApiError.internal("Failed to fetch repositories from GitHub");
  }
}

export const GET = withAuth(listReposHandler);

// ============================================================================
// POST /api/user/repos - Create a new GitHub repository
// ============================================================================

async function createRepoHandler(
  request: NextRequest,
  { accessToken }: AuthContext
) {
  if (!accessToken) {
    throw ApiError.forbidden(
      "GitHub account not connected. Please connect your GitHub account to create repositories."
    );
  }

  const body = await validateBody(request, createRepoSchema);

  try {
    const repo = await createRepo(accessToken, body.name, body.isPrivate);

    return NextResponse.json(
      {
        repo: {
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating repo:", error);

    // Check for specific GitHub errors
    if (error instanceof Error) {
      if (error.message.includes("name already exists")) {
        throw ApiError.conflict(
          "A repository with this name already exists. Please choose a different name."
        );
      }
      if (error.message.includes("Unauthorized")) {
        throw ApiError.unauthorized(
          "GitHub authentication failed. Please reconnect your GitHub account."
        );
      }
      if (error.message.includes("rate limit")) {
        throw new ApiError(
          "GitHub API rate limit exceeded. Please try again later.",
          429,
          "RATE_LIMITED"
        );
      }
    }

    throw ApiError.internal("Failed to create repository on GitHub");
  }
}

export const POST = withAuth(createRepoHandler);
