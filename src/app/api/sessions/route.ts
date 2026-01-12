import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq, or, isNull } from "drizzle-orm";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, writingSessions } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  getSessionIdFromCookie,
  getSessionById,
  type ContentType,
} from "@/lib/session";

// ============================================================================
// Types
// ============================================================================

export type SessionContentType = "book" | "article" | "thread" | "newsletter" | "docs";

export interface WritingSessionResponse {
  id: string;
  shareSlug: string | null;
  title: string | null;
  type: SessionContentType;
  content: string | null;
  formatConfig: Record<string, unknown> | null;
  ownerId: string | null;
  githubRepo: string | null;
  githubPath: string | null;
  lastGithubSha: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Session input type for formatting
interface SessionInput {
  id: string;
  shareSlug: string | null;
  title: string | null;
  type: string | null;
  content: string | null;
  formatConfig: unknown;
  ownerId: string | null;
  githubRepo: string | null;
  githubPath: string | null;
  lastGithubSha: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Formats a database session object into an API response.
 */
export function formatSessionResponse(session: SessionInput): WritingSessionResponse {
  return {
    id: session.id,
    shareSlug: session.shareSlug,
    title: session.title,
    type: (session.type as SessionContentType) ?? "book",
    content: session.content,
    formatConfig: session.formatConfig as Record<string, unknown> | null,
    ownerId: session.ownerId,
    githubRepo: session.githubRepo,
    githubPath: session.githubPath,
    lastGithubSha: session.lastGithubSha,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * Request body for creating a new session
 */
export const CreateSessionSchema = z.object({
  title: z.string().optional(),
  type: z
    .enum(["book", "article", "thread", "newsletter", "docs"])
    .optional()
    .default("book"),
  content: z.string().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionSchema>;

/**
 * Response when creating a session
 */
export interface CreateSessionResponse {
  session: WritingSessionResponse;
}

// ============================================================================
// POST /api/sessions - Create a new writing session
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate request body (may be empty for anonymous sessions)
    let body: CreateSessionRequest = { type: "book" };
    try {
      body = await validateBody(request, CreateSessionSchema);
    } catch {
      // Empty body is fine for anonymous sessions
    }

    // Get current user (optional - can be anonymous)
    const authSession = await auth();
    const userId = authSession?.user?.id;

    // Create the writing session
    const session = await createSession({
      title: body.title,
      type: body.type as ContentType,
      content: body.content,
      ownerId: userId,
    });

    await setSessionCookie(session.id);

    return NextResponse.json(
      { session: formatSessionResponse(session) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error creating session:", error);
    return ApiError.internal().toResponse();
  }
}

// ============================================================================
// GET /api/sessions - List sessions or get current session
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get("current") === "true";

    // Get current session from cookie
    if (current) {
      const sessionId = await getSessionIdFromCookie();
      if (sessionId) {
        const session = await getSessionById(sessionId);
        if (session && (!session.expiresAt || session.expiresAt > new Date())) {
          return NextResponse.json({ session: formatSessionResponse(session) });
        }
      }
      // No valid current session
      return NextResponse.json({ session: null });
    }

    // List sessions for authenticated user or from cookie
    const authSession = await auth();
    const userId = authSession?.user?.id;
    const cookieSessionId = await getSessionIdFromCookie();

    if (!db) {
      return ApiError.internal("Database not available").toResponse();
    }

    // Get sessions owned by user OR the current cookie session
    const sessions = await db.query.writingSessions.findMany({
      where: userId
        ? or(
            eq(writingSessions.ownerId, userId),
            cookieSessionId ? eq(writingSessions.id, cookieSessionId) : undefined
          )
        : cookieSessionId
          ? eq(writingSessions.id, cookieSessionId)
          : isNull(writingSessions.id), // No sessions if no user and no cookie
      orderBy: [desc(writingSessions.updatedAt)],
      limit: 50,
    });

    return NextResponse.json({
      sessions: sessions.map(formatSessionResponse),
    });
  } catch (error) {
    console.error("Error listing sessions:", error);
    return ApiError.internal().toResponse();
  }
}
