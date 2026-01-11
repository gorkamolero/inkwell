import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionIdFromCookie,
  claimSession,
} from "@/lib/session";
import { formatSessionResponse, type WritingSessionResponse } from "../../route";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Response for claiming a session
 */
export interface ClaimSessionResponse {
  success: boolean;
  session: WritingSessionResponse;
}

// ============================================================================
// POST /api/sessions/[id]/claim - Link anonymous session to authenticated user
// ============================================================================

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Verify user is authenticated
    const authSession = await auth();
    if (!authSession?.user?.id) {
      throw ApiError.unauthorized("You must be logged in to claim a session");
    }

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Verify session has no owner (is anonymous)
    if (session.ownerId) {
      if (session.ownerId === authSession.user.id) {
        // Already owned by this user
        return NextResponse.json({
          success: true,
          session: formatSessionResponse(session),
        });
      }
      throw ApiError.forbidden("This session is already owned by another user");
    }

    // Verify session cookie matches (user created this session)
    const cookieSessionId = await getSessionIdFromCookie();
    if (cookieSessionId !== id) {
      throw ApiError.forbidden("You can only claim sessions you created");
    }

    // Claim the session
    const claimed = await claimSession(id, authSession.user.id);
    if (!claimed) {
      throw ApiError.internal("Failed to claim session");
    }

    return NextResponse.json({
      success: true,
      session: formatSessionResponse(claimed),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error claiming session:", error);
    return ApiError.internal().toResponse();
  }
}
