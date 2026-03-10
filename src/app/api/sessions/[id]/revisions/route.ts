import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, writingSessionRevisions } from "@/lib/db";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
} from "@/lib/session";

type RouteParams = { params: Promise<{ id: string }> };

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

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!db) {
      throw ApiError.internal("Database not configured");
    }

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context)) {
      throw ApiError.forbidden(
        "You don't have access to this session's revisions",
      );
    }

    const revisions = await db.query.writingSessionRevisions.findMany({
      where: eq(writingSessionRevisions.sessionId, id),
      orderBy: [desc(writingSessionRevisions.createdAt)],
      limit: 50,
      with: {
        actorUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      revisions: revisions.map((revision) => ({
        id: revision.id,
        sessionId: revision.sessionId,
        source: revision.source,
        actorUserId: revision.actorUserId,
        actorUser: revision.actorUser,
        hasContent: !!revision.content,
        createdAt: revision.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }

    console.error("Error loading session revisions:", error);
    return ApiError.internal().toResponse();
  }
}
