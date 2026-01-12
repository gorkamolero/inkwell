/**
 * Session Management Library for Hotpress
 *
 * Handles ephemeral writing sessions that can be created anonymously
 * and later claimed by authenticated users.
 */

import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  db,
  type NewWritingSession,
  type WritingSession,
  writingSessions,
} from "./db";
import {
  type ContentType,
  type FormatConfig,
  getDefaultConfig,
} from "./format-schema";

// Re-export types for convenience
export type { ContentType, FormatConfig };

export const SESSION_COOKIE = "hp_session";

const SESSION_EXPIRY_DAYS = 30;
const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_SECONDS * 1000;
const SHARE_SLUG_LENGTH = 10;

export function generateSessionId(): string {
  return createId();
}

export function generateShareSlug(): string {
  return createId().slice(0, SHARE_SLUG_LENGTH).toLowerCase();
}

export async function getSessionIdFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

function requireDb(): NonNullable<typeof db> {
  if (!db) {
    throw new Error("Database connection not available");
  }
  return db;
}

/**
 * Creates a new ephemeral writing session.
 * Session starts anonymous (no ownerId) with default format config.
 */
export async function createSession(options?: {
  title?: string;
  type?: ContentType;
  content?: string;
  ownerId?: string;
}): Promise<WritingSession> {
  const database = requireDb();

  const sessionId = generateSessionId();
  const contentType = options?.type ?? "book";
  const formatConfig = getDefaultConfig(contentType);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  const newSession: NewWritingSession = {
    id: sessionId,
    title: options?.title ?? null,
    type: contentType,
    content: options?.content ?? null,
    formatConfig: formatConfig as unknown as Record<string, unknown>,
    ownerId: options?.ownerId ?? null,
    expiresAt,
  };

  const [session] = await database
    .insert(writingSessions)
    .values(newSession)
    .returning();

  return session;
}

export async function getSessionById(
  id: string,
): Promise<WritingSession | null> {
  const database = requireDb();
  const session = await database.query.writingSessions.findFirst({
    where: eq(writingSessions.id, id),
  });
  return session ?? null;
}

export async function getSessionByShareSlug(
  slug: string,
): Promise<WritingSession | null> {
  const database = requireDb();
  const session = await database.query.writingSessions.findFirst({
    where: eq(writingSessions.shareSlug, slug),
  });
  return session ?? null;
}

/**
 * Gets or creates a session based on the cookie.
 * If a valid, non-expired session exists, returns it.
 * Otherwise creates a new ephemeral session and sets the cookie.
 */
export async function getOrCreateSession(): Promise<WritingSession> {
  const existingId = await getSessionIdFromCookie();

  if (existingId) {
    const session = await getSessionById(existingId);
    if (session && !isSessionExpired(session)) {
      return session;
    }
  }

  const newSession = await createSession();
  await setSessionCookie(newSession.id);

  return newSession;
}

export async function updateSession(
  id: string,
  data: {
    title?: string | null;
    type?: ContentType;
    content?: string | null;
    formatConfig?: FormatConfig;
    passwordHash?: string | null;
    githubRepo?: string | null;
    githubPath?: string | null;
    lastGithubSha?: string | null;
  },
): Promise<WritingSession | null> {
  const database = requireDb();

  const updateData: Partial<NewWritingSession> = {
    updatedAt: new Date(),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.type !== undefined && { type: data.type }),
    ...(data.content !== undefined && { content: data.content }),
    ...(data.formatConfig !== undefined && {
      formatConfig: data.formatConfig as unknown as Record<string, unknown>,
    }),
    ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
    ...(data.githubRepo !== undefined && { githubRepo: data.githubRepo }),
    ...(data.githubPath !== undefined && { githubPath: data.githubPath }),
    ...(data.lastGithubSha !== undefined && {
      lastGithubSha: data.lastGithubSha,
    }),
  };

  const [updated] = await database
    .update(writingSessions)
    .set(updateData)
    .where(eq(writingSessions.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Claims an anonymous session for an authenticated user.
 * Links the session to the user's account.
 */
export async function claimSession(
  sessionId: string,
  userId: string,
): Promise<WritingSession | null> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (session.ownerId === userId) return session;
  if (session.ownerId !== null) {
    throw new Error("Session is already claimed by another user");
  }

  const [claimed] = await database
    .update(writingSessions)
    .set({
      ownerId: userId,
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(writingSessions.id, sessionId))
    .returning();

  return claimed ?? null;
}

/**
 * Generates and sets a share slug for a session.
 * Returns the updated session with the share slug.
 */
export async function createShareLink(
  sessionId: string,
): Promise<WritingSession | null> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (session.shareSlug) return session;

  const shareSlug = await generateUniqueShareSlug();

  const [updated] = await database
    .update(writingSessions)
    .set({ shareSlug, updatedAt: new Date() })
    .where(eq(writingSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

async function generateUniqueShareSlug(maxAttempts = 5): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = generateShareSlug();
    const existing = await getSessionByShareSlug(slug);
    if (!existing) return slug;
  }
  throw new Error("Failed to generate unique share slug");
}

/**
 * Deletes a session by ID. Only the owner can delete their session.
 */
export async function deleteSession(
  sessionId: string,
  userId?: string,
): Promise<boolean> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return false;

  if (session.ownerId && session.ownerId !== userId) {
    throw new Error("Not authorized to delete this session");
  }

  await database
    .delete(writingSessions)
    .where(eq(writingSessions.id, sessionId));
  return true;
}

export async function getUserSessions(
  userId: string,
): Promise<WritingSession[]> {
  const database = requireDb();
  return database.query.writingSessions.findMany({
    where: eq(writingSessions.ownerId, userId),
    orderBy: (sessions, { desc }) => [desc(sessions.updatedAt)],
  });
}

/**
 * Extends the expiration time of an ephemeral session.
 * Owned sessions do not expire and are returned unchanged.
 */
export async function extendSessionExpiry(
  sessionId: string,
): Promise<WritingSession | null> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (session.ownerId) return session;

  const [updated] = await database
    .update(writingSessions)
    .set({
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      updatedAt: new Date(),
    })
    .where(eq(writingSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

// ============================================================================
// Access Control Functions
// ============================================================================

export interface SessionAccessContext {
  userId?: string;
  cookieSessionId?: string;
}

/**
 * Determines if a user can access a session for reading or writing.
 */
export function canAccessSession(
  session: WritingSession,
  context: SessionAccessContext,
  requireWrite: boolean = false,
): boolean {
  const { userId, cookieSessionId } = context;

  // Owner always has access
  if (userId && session.ownerId === userId) {
    return true;
  }

  // Cookie matches session ID (creator of anonymous session)
  if (cookieSessionId === session.id) {
    return true;
  }

  // Shared sessions are accessible to everyone for read/write
  if (session.shareSlug) {
    return true;
  }

  // Anonymous sessions without owner are readable
  if (!requireWrite && !session.ownerId) {
    return true;
  }

  return false;
}

/**
 * Determines if a user can delete a session.
 * More restrictive than general access - requires ownership.
 */
export function canDeleteSession(
  session: WritingSession,
  context: SessionAccessContext,
): boolean {
  const { userId, cookieSessionId } = context;

  // Owner can always delete
  if (userId && session.ownerId === userId) {
    return true;
  }

  // Cookie matches AND session has no owner (original creator of anonymous session)
  if (cookieSessionId === session.id && !session.ownerId) {
    return true;
  }

  return false;
}

export function isSessionExpired(session: WritingSession): boolean {
  if (!session.expiresAt) return false;
  return session.expiresAt < new Date();
}

export function isPasswordProtected(session: WritingSession): boolean {
  return session.passwordHash !== null;
}

export function getSessionFormatConfig(session: WritingSession): FormatConfig {
  if (session.formatConfig) {
    return session.formatConfig as unknown as FormatConfig;
  }
  return getDefaultConfig((session.type as ContentType) ?? "book");
}

export async function updateSessionGitHub(
  sessionId: string,
  data: {
    githubRepo?: string;
    githubPath?: string;
    lastGithubSha?: string;
  },
): Promise<WritingSession | null> {
  return updateSession(sessionId, {
    githubRepo: data.githubRepo ?? null,
    githubPath: data.githubPath ?? null,
    lastGithubSha: data.lastGithubSha ?? null,
  });
}
