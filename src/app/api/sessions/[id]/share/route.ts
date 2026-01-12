import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionIdFromCookie,
  createShareLink,
  canAccessSession,
} from "@/lib/session";
import { headers } from "next/headers";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

export const CreateShareLinkSchema = z.object({
  password: z.string().optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkSchema>;

export interface CreateShareLinkResponse {
  shareUrl: string;
  shareSlug: string;
  passwordProtected: boolean;
  expiresAt: string | null;
}

// ============================================================================
// Helper: Build share URL
// ============================================================================

async function buildShareUrl(shareSlug: string): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}/s/${shareSlug}`;
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

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Get access context
    const [authSession, cookieSessionId] = await Promise.all([
      auth(),
      getSessionIdFromCookie(),
    ]);
    const context = { userId: authSession?.user?.id, cookieSessionId };

    if (!canAccessSession(session, context, true)) {
      throw ApiError.forbidden("You don't have permission to share this session");
    }

    const updated = await createShareLink(id);
    if (!updated?.shareSlug) {
      throw ApiError.internal("Failed to create share link");
    }

    const shareUrl = await buildShareUrl(updated.shareSlug);

    return NextResponse.json({
      shareUrl,
      shareSlug: updated.shareSlug,
      passwordProtected: !!body.password,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error creating share link:", error);
    return ApiError.internal().toResponse();
  }
}
