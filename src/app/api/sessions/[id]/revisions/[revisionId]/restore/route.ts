import { eq } from "drizzle-orm";
import { type SerializedEditorState } from "lexical";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, writingSessionRevisions } from "@/lib/db";
import { lexicalToMarkdown } from "@/lib/editor-utils";
import { resetLiveblocksRoomWithMarkdown } from "@/lib/liveblocks-server";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
  updateSession,
} from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string; revisionId: string }>;
};

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

function contentToMarkdown(content: string | null): string {
  if (!content) {
    return "";
  }

  try {
    return lexicalToMarkdown(JSON.parse(content) as SerializedEditorState);
  } catch {
    return content;
  }
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id, revisionId } = await params;

    if (!db) {
      throw ApiError.internal("Database not configured");
    }

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context, true)) {
      throw ApiError.forbidden(
        "You don't have permission to restore this session",
      );
    }

    const revision = await db.query.writingSessionRevisions.findFirst({
      where: eq(writingSessionRevisions.id, revisionId),
    });

    if (!revision || revision.sessionId !== id) {
      throw ApiError.notFound("Revision not found");
    }

    const restored = await updateSession(id, {
      content: revision.content,
      snapshotSource: "revision-restore",
      snapshotActorUserId: context.userId ?? null,
    });

    if (!restored) {
      throw ApiError.internal("Failed to restore session revision");
    }

    await resetLiveblocksRoomWithMarkdown(
      id,
      contentToMarkdown(revision.content),
    );

    return NextResponse.json({
      success: true,
      sessionId: id,
      revisionId,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }

    console.error("Error restoring session revision:", error);
    return ApiError.internal().toResponse();
  }
}
