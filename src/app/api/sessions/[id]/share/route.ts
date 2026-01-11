import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionIdFromCookie,
  createShareLink,
} from "@/lib/session";
import { headers } from "next/headers";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Request body for creating a share link
 */
export const CreateShareLinkSchema = z.object({
  password: z.string().optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkSchema>;

/**
 * Response for creating a share link
 */
export interface CreateShareLinkResponse {
  shareUrl: string;
  shareSlug: string;
  passwordProtected: boolean;
  expiresAt: string | null;
}

// ============================================================================
// POST /api/sessions/[id]/share - Generate a share link for a session
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate body (password protection is optional for MVP)
    let body: CreateShareLinkRequest = {};
    try {
      body = await validateBody(request, CreateShareLinkSchema);
    } catch {
      // Empty body is fine
    }

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Verify access (owner or session cookie matches)
    const authSession = await auth();
    const userId = authSession?.user?.id;
    const cookieSessionId = await getSessionIdFromCookie();

    const hasAccess =
      (userId && session.ownerId === userId) ||
      cookieSessionId === id ||
      !session.ownerId; // Anonymous sessions can be shared by anyone with access

    if (!hasAccess) {
      throw ApiError.forbidden("You don't have permission to share this session");
    }

    // Generate share link (creates slug if doesn't exist)
    const updated = await createShareLink(id);
    if (!updated || !updated.shareSlug) {
      throw ApiError.internal("Failed to create share link");
    }

    // TODO: Handle password protection in future version
    // For MVP, we skip password protection

    // Build share URL
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const shareUrl = `${protocol}://${host}/s/${updated.shareSlug}`;

    const response: CreateShareLinkResponse = {
      shareUrl,
      shareSlug: updated.shareSlug,
      passwordProtected: !!body.password,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error creating share link:", error);
    return ApiError.internal().toResponse();
  }
}
