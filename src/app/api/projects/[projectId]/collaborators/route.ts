import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  withProject,
  validateBody,
  ApiError,
  generateId,
  type ProjectContext,
} from "@/lib/api-utils";
import { db, projectCollaborators, users } from "@/lib/db";
import { canAddCollaborator } from "@/lib/subscription";
import type { CollaboratorRole } from "@/lib/db/schema";

// ============================================================================
// Schemas
// ============================================================================

const inviteCollaboratorSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["viewer", "editor", "admin"], {
    message: "Role must be viewer, editor, or admin",
  }),
});

const removeCollaboratorSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// ============================================================================
// GET /api/projects/[projectId]/collaborators - List collaborators
// ============================================================================

async function listCollaboratorsHandler(
  request: NextRequest,
  { project, isOwner, role }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owner and admins can view full collaborator list
  if (!isOwner && role !== "admin") {
    throw ApiError.forbidden(
      "Only the project owner or admins can view collaborators"
    );
  }

  const collaborators = await db.query.projectCollaborators.findMany({
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

  // Also get the owner information
  const owner = await db.query.users.findFirst({
    where: eq(users.id, project.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  return NextResponse.json({
    owner,
    collaborators: collaborators.map((c) => ({
      id: c.id,
      userId: c.userId,
      role: c.role,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
      user: c.user,
    })),
  });
}

export const GET = withProject(listCollaboratorsHandler);

// ============================================================================
// POST /api/projects/[projectId]/collaborators - Invite collaborator
// ============================================================================

async function inviteCollaboratorHandler(
  request: NextRequest,
  { project, isOwner, role }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owner and admins can invite collaborators
  if (!isOwner && role !== "admin") {
    throw ApiError.forbidden(
      "Only the project owner or admins can invite collaborators"
    );
  }

  // Check subscription limits
  const canAdd = await canAddCollaborator(project.id);
  if (!canAdd) {
    throw ApiError.limitExceeded(
      "You have reached your collaborator limit for this project. Please upgrade your plan."
    );
  }

  const body = await validateBody(request, inviteCollaboratorSchema);

  // Find the user by email
  const invitedUser = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });

  if (!invitedUser) {
    throw ApiError.notFound(
      "User not found. They must have a Hotpress account first."
    );
  }

  // Can't invite the owner
  if (invitedUser.id === project.userId) {
    throw ApiError.badRequest("Cannot invite the project owner as a collaborator");
  }

  // Check if already a collaborator
  const existingCollaboration = await db.query.projectCollaborators.findFirst({
    where: and(
      eq(projectCollaborators.projectId, project.id),
      eq(projectCollaborators.userId, invitedUser.id)
    ),
  });

  if (existingCollaboration) {
    throw ApiError.conflict("This user is already a collaborator on this project");
  }

  // Create collaboration
  const collaborationId = generateId();
  const now = new Date();

  const [newCollaboration] = await db
    .insert(projectCollaborators)
    .values({
      id: collaborationId,
      projectId: project.id,
      userId: invitedUser.id,
      role: body.role as CollaboratorRole,
      invitedAt: now,
      acceptedAt: now, // Auto-accept for now (no invitation flow)
    })
    .returning();

  return NextResponse.json(
    {
      collaborator: {
        id: newCollaboration.id,
        userId: invitedUser.id,
        role: newCollaboration.role,
        invitedAt: newCollaboration.invitedAt,
        acceptedAt: newCollaboration.acceptedAt,
        user: {
          id: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          image: invitedUser.image,
        },
      },
    },
    { status: 201 }
  );
}

export const POST = withProject(inviteCollaboratorHandler);

// ============================================================================
// DELETE /api/projects/[projectId]/collaborators - Remove collaborator
// ============================================================================

async function removeCollaboratorHandler(
  request: NextRequest,
  { project, isOwner, role, userId }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const body = await validateBody(request, removeCollaboratorSchema);

  // Find the collaboration
  const collaboration = await db.query.projectCollaborators.findFirst({
    where: and(
      eq(projectCollaborators.projectId, project.id),
      eq(projectCollaborators.userId, body.userId)
    ),
  });

  if (!collaboration) {
    throw ApiError.notFound("Collaborator not found");
  }

  // Allow: owner can remove anyone, admin can remove non-admins, user can remove themselves
  const isSelf = body.userId === userId;
  const targetIsAdmin = collaboration.role === "admin";

  if (!isOwner && !isSelf) {
    // Non-owners can only remove themselves or (if admin) non-admins
    if (role !== "admin") {
      throw ApiError.forbidden("You can only remove yourself from this project");
    }
    if (targetIsAdmin) {
      throw ApiError.forbidden("Admins cannot remove other admins");
    }
  }

  // Remove collaboration
  await db
    .delete(projectCollaborators)
    .where(eq(projectCollaborators.id, collaboration.id));

  return NextResponse.json({
    success: true,
    message: isSelf
      ? "You have left the project"
      : "Collaborator removed successfully",
  });
}

export const DELETE = withProject(removeCollaboratorHandler);

// ============================================================================
// PATCH /api/projects/[projectId]/collaborators - Update collaborator role
// ============================================================================

const updateCollaboratorSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["viewer", "editor", "admin"], {
    message: "Role must be viewer, editor, or admin",
  }),
});

async function updateCollaboratorHandler(
  request: NextRequest,
  { project, isOwner, role }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owner and admins can update roles
  if (!isOwner && role !== "admin") {
    throw ApiError.forbidden(
      "Only the project owner or admins can update collaborator roles"
    );
  }

  const body = await validateBody(request, updateCollaboratorSchema);

  // Find the collaboration
  const collaboration = await db.query.projectCollaborators.findFirst({
    where: and(
      eq(projectCollaborators.projectId, project.id),
      eq(projectCollaborators.userId, body.userId)
    ),
  });

  if (!collaboration) {
    throw ApiError.notFound("Collaborator not found");
  }

  // Non-owner admins can't promote to admin or change admin roles
  if (!isOwner) {
    if (body.role === "admin" || collaboration.role === "admin") {
      throw ApiError.forbidden("Only the owner can manage admin roles");
    }
  }

  // Update the role
  const [updatedCollaboration] = await db
    .update(projectCollaborators)
    .set({ role: body.role as CollaboratorRole })
    .where(eq(projectCollaborators.id, collaboration.id))
    .returning();

  return NextResponse.json({
    collaborator: {
      id: updatedCollaboration.id,
      userId: updatedCollaboration.userId,
      role: updatedCollaboration.role,
    },
  });
}

export const PATCH = withProject(updateCollaboratorHandler);
