import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  withProject,
  validateBody,
  ApiError,
  generateSlug,
  type ProjectContext,
} from "@/lib/api-utils";
import { db, projects, documents, projectCollaborators } from "@/lib/db";

// ============================================================================
// Schemas
// ============================================================================

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  description: z.string().max(500).nullable().optional(),
  githubRepo: z
    .string()
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Invalid repository format")
    .nullable()
    .optional(),
  githubBranch: z.string().max(100).optional(),
  chaptersPath: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// ============================================================================
// GET /api/projects/[projectId] - Get project details
// ============================================================================

async function getProjectHandler(
  request: NextRequest,
  { project, role, isOwner }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Get document count
  const projectDocuments = await db.query.documents.findMany({
    where: eq(documents.projectId, project.id),
    columns: {
      id: true,
      path: true,
      title: true,
      wordCount: true,
      updatedAt: true,
    },
  });

  // Get collaborators if owner or admin
  let collaborators: Array<{
    id: string;
    userId: string;
    role: string;
    invitedAt: Date;
    acceptedAt: Date | null;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }> = [];

  if (isOwner || role === "admin") {
    const collabs = await db.query.projectCollaborators.findMany({
      where: eq(projectCollaborators.projectId, project.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    collaborators = collabs;
  }

  // Calculate total word count
  const totalWordCount = projectDocuments.reduce(
    (sum, doc) => sum + (doc.wordCount ?? 0),
    0
  );

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      githubRepo: project.githubRepo,
      githubBranch: project.githubBranch,
      chaptersPath: project.chaptersPath,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role,
      isOwner,
    },
    documents: projectDocuments,
    collaborators,
    stats: {
      documentCount: projectDocuments.length,
      collaboratorCount: collaborators.length,
      totalWordCount,
    },
  });
}

export const GET = withProject(getProjectHandler);

// ============================================================================
// PATCH /api/projects/[projectId] - Update project
// ============================================================================

async function updateProjectHandler(
  request: NextRequest,
  { project, isOwner }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owners can update projects
  if (!isOwner) {
    throw ApiError.forbidden("Only the project owner can update this project");
  }

  const body = await validateBody(request, updateProjectSchema);

  // Build update object
  const updateData: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    updateData.name = body.name;
    // Regenerate slug if name changed
    updateData.slug = generateSlug(body.name);
  }

  if (body.description !== undefined) {
    updateData.description = body.description;
  }

  if (body.githubRepo !== undefined) {
    updateData.githubRepo = body.githubRepo;
  }

  if (body.githubBranch !== undefined) {
    updateData.githubBranch = body.githubBranch;
  }

  if (body.chaptersPath !== undefined) {
    updateData.chaptersPath = body.chaptersPath;
  }

  if (body.isPublic !== undefined) {
    updateData.isPublic = body.isPublic;
  }

  const [updatedProject] = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, project.id))
    .returning();

  return NextResponse.json({ project: updatedProject });
}

export const PATCH = withProject(updateProjectHandler, { requireOwner: true });

// ============================================================================
// DELETE /api/projects/[projectId] - Delete project
// ============================================================================

async function deleteProjectHandler(
  request: NextRequest,
  { project, isOwner }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owners can delete projects
  if (!isOwner) {
    throw ApiError.forbidden("Only the project owner can delete this project");
  }

  // Delete project (cascade will handle documents and collaborators)
  await db.delete(projects).where(eq(projects.id, project.id));

  return NextResponse.json({ success: true, message: "Project deleted" });
}

export const DELETE = withProject(deleteProjectHandler, { requireOwner: true });
