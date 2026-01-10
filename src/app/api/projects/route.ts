import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import {
  withAuth,
  validateBody,
  ApiError,
  generateId,
  generateSlug,
  type AuthContext,
} from "@/lib/api-utils";
import { db, projects, projectCollaborators } from "@/lib/db";
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
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Invalid repository format")
    .optional(),
  githubBranch: z.string().max(100).optional(),
  chaptersPath: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// ============================================================================
// GET /api/projects - List user's projects
// ============================================================================

async function listProjectsHandler(
  request: NextRequest,
  { userId }: AuthContext
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
  { userId }: AuthContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Check subscription limits
  const canCreate = await canCreateProject(userId);
  if (!canCreate) {
    throw ApiError.limitExceeded(
      "You have reached your project limit. Please upgrade your plan to create more projects."
    );
  }

  const body = await validateBody(request, createProjectSchema);

  // Generate slug from name
  let slug = generateSlug(body.name);

  // Check if slug already exists for this user
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (existingProject && existingProject.userId === userId) {
    // Append a random suffix if slug exists
    slug = `${slug}-${generateId().slice(0, 8)}`;
  }

  const projectId = generateId();
  const now = new Date();

  const [newProject] = await db
    .insert(projects)
    .values({
      id: projectId,
      name: body.name,
      slug,
      description: body.description ?? null,
      githubRepo: body.githubRepo ?? null,
      githubBranch: body.githubBranch ?? "main",
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
