import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  type ContentType,
  canAccessSession,
  canDeleteSession,
  deleteSession,
  getSessionById,
  getSessionIdFromCookie,
  updateSession,
} from "@/lib/session";
import { formatSessionResponse, type WritingSessionResponse } from "../route";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

export interface GetSessionResponse {
  session: WritingSessionResponse;
}

export const UpdateSessionSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["book", "article", "thread", "newsletter", "docs"]).optional(),
  content: z.string().optional(),
});

export type UpdateSessionRequest = z.infer<typeof UpdateSessionSchema>;

export interface UpdateSessionResponse {
  session: WritingSessionResponse;
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Helper: Build access context
// ============================================================================

async function getAccessContext(): Promise<{
  userId?: string;
  cookieSessionId?: string;
}> {
  const [authSession, cookieSessionId] = await Promise.all([
    auth(),
    getSessionIdFromCookie(),
  ]);
  return {
    userId: authSession?.user?.id,
    cookieSessionId,
  };
}

// ============================================================================
// GET /api/sessions/[id] - Get a specific session
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context)) {
      throw ApiError.forbidden("You don't have access to this session");
    }

    return NextResponse.json({ session: formatSessionResponse(session) });
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
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await validateBody(request, UpdateSessionSchema);

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context, true)) {
      throw ApiError.forbidden(
        "You don't have permission to update this session",
      );
    }

    const updated = await updateSession(id, {
      title: body.title,
      type: body.type as ContentType | undefined,
      content: body.content,
    });

    if (!updated) {
      throw ApiError.internal("Failed to update session");
    }

    return NextResponse.json({ session: formatSessionResponse(updated) });
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
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canDeleteSession(session, context)) {
      throw ApiError.forbidden(
        "You don't have permission to delete this session",
      );
    }

    const deleted = await deleteSession(id, context.userId);
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
