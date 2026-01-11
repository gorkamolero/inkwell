import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionIdFromCookie,
  updateSession,
  deleteSession,
  type ContentType,
} from "@/lib/session";
import { formatSessionResponse, type WritingSessionResponse } from "../route";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Response for getting a session
 */
export interface GetSessionResponse {
  session: WritingSessionResponse;
}

/**
 * Request body for updating a session
 */
export const UpdateSessionSchema = z.object({
  title: z.string().optional(),
  type: z
    .enum(["book", "article", "thread", "newsletter", "docs"])
    .optional(),
  content: z.string().optional(),
});

export type UpdateSessionRequest = z.infer<typeof UpdateSessionSchema>;

/**
 * Response for updating a session
 */
export interface UpdateSessionResponse {
  session: WritingSessionResponse;
}

/**
 * Response for deleting a session
 */
export interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Helper: Check session access
// ============================================================================

async function canAccessSession(
  sessionId: string,
  sessionOwnerId: string | null,
  requireWrite: boolean = false
): Promise<boolean> {
  // Get current auth session
  const authSession = await auth();
  const userId = authSession?.user?.id;

  // If user is the owner, they have access
  if (userId && sessionOwnerId === userId) {
    return true;
  }

  // Check if the session cookie matches (for anonymous sessions)
  const cookieSessionId = await getSessionIdFromCookie();
  if (cookieSessionId === sessionId) {
    return true;
  }

  // For read-only access, anonymous sessions without owner are accessible
  // (This allows collaborators to view via share links)
  if (!requireWrite && !sessionOwnerId) {
    return true;
  }

  return false;
}

// ============================================================================
// GET /api/sessions/[id] - Get a specific session
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Check access
    const hasAccess = await canAccessSession(id, session.ownerId, false);
    if (!hasAccess) {
      throw ApiError.forbidden("You don't have access to this session");
    }

    return NextResponse.json({
      session: formatSessionResponse(session),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error getting session:", error);
    return ApiError.internal().toResponse();
  }
}

// ============================================================================
// PATCH /api/sessions/[id] - Update a session
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await validateBody(request, UpdateSessionSchema);

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Check write access
    const hasAccess = await canAccessSession(id, session.ownerId, true);
    if (!hasAccess) {
      throw ApiError.forbidden("You don't have permission to update this session");
    }

    // Update the session
    const updated = await updateSession(id, {
      title: body.title,
      type: body.type as ContentType | undefined,
      content: body.content,
    });

    if (!updated) {
      throw ApiError.internal("Failed to update session");
    }

    return NextResponse.json({
      session: formatSessionResponse(updated),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error updating session:", error);
    return ApiError.internal().toResponse();
  }
}

// ============================================================================
// DELETE /api/sessions/[id] - Delete a session
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Get current user
    const authSession = await auth();
    const userId = authSession?.user?.id;

    // Check if user can delete
    // Must be owner, or the cookie must match for anonymous sessions
    const cookieSessionId = await getSessionIdFromCookie();
    const canDelete =
      (userId && session.ownerId === userId) ||
      (cookieSessionId === id && !session.ownerId);

    if (!canDelete) {
      throw ApiError.forbidden("You don't have permission to delete this session");
    }

    // Delete the session
    const deleted = await deleteSession(id, userId);
    if (!deleted) {
      throw ApiError.internal("Failed to delete session");
    }

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error deleting session:", error);
    return ApiError.internal().toResponse();
  }
}
