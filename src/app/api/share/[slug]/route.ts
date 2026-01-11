import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { getSessionByShareSlug, isSessionExpired, isPasswordProtected } from "@/lib/session";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * Public session data (excludes sensitive fields)
 */
export interface PublicSession {
  id: string;
  title: string | null;
  type: string;
  content: string | null;
  formatConfig: Record<string, unknown> | null;
  passwordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for getting a shared session
 */
export interface GetSharedSessionResponse {
  session: PublicSession | null;
  requiresPassword: boolean;
}

// ============================================================================
// GET /api/share/[slug] - Get a shared session by its share slug
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Find session by shareSlug
    const session = await getSessionByShareSlug(slug);
    if (!session) {
      throw ApiError.notFound("Shared session not found");
    }

    // Check if session is expired
    if (isSessionExpired(session)) {
      throw ApiError.notFound("This shared link has expired");
    }

    // Check if session is password protected
    const requiresPassword = isPasswordProtected(session);

    // If password protected, don't return content
    if (requiresPassword) {
      return NextResponse.json({
        session: {
          id: session.id,
          title: session.title,
          type: session.type ?? "book",
          content: null, // Don't expose content until password verified
          formatConfig: null,
          passwordProtected: true,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        },
        requiresPassword: true,
      });
    }

    // Return full session data (without sensitive fields)
    const response: GetSharedSessionResponse = {
      session: {
        id: session.id,
        title: session.title,
        type: session.type ?? "book",
        content: session.content,
        formatConfig: session.formatConfig as Record<string, unknown> | null,
        passwordProtected: false,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
      requiresPassword: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error getting shared session:", error);
    return ApiError.internal().toResponse();
  }
}
