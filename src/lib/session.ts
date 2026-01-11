/**
 * Session Management Library for Hotpress
 *
 * Handles ephemeral writing sessions that can be created anonymously
 * and later claimed by authenticated users.
 */

import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { db, writingSessions, type WritingSession, type NewWritingSession } from "./db";
import { getDefaultConfig, type FormatConfig, type ContentType } from "./format-schema";

// Re-export types for convenience
export type { ContentType, FormatConfig };

// ============================================================================
// Constants
// ============================================================================

/**
 * Cookie name for storing the current session ID.
 */
export const SESSION_COOKIE = "hp_session";

/**
 * Default session expiration time (30 days in milliseconds).
 */
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Share slug length for URL-friendly IDs.
 */
const SHARE_SLUG_LENGTH = 10;

// ============================================================================
// Session ID Generation
// ============================================================================

/**
 * Generates a new unique session ID using cuid2.
 */
export function generateSessionId(): string {
  return createId();
}

/**
 * Generates a unique share slug for session sharing.
 * Creates a URL-friendly alphanumeric string.
 */
export function generateShareSlug(): string {
  const id = createId();
  // Take first N characters and ensure URL-safe
  return id.slice(0, SHARE_SLUG_LENGTH).toLowerCase();
}

// ============================================================================
// Cookie Management
// ============================================================================

/**
 * Gets the current session ID from cookies.
 */
export async function getSessionIdFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Sets the session ID in cookies.
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: "/",
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ============================================================================
// Database Helper
// ============================================================================

function requireDb(): NonNullable<typeof db> {
  if (!db) {
    throw new Error("Database connection not available");
  }
  return db;
}

// ============================================================================
// Session CRUD Operations
// ============================================================================

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

/**
 * Gets a session by its ID.
 */
export async function getSessionById(id: string): Promise<WritingSession | null> {
  const database = requireDb();
  const session = await database.query.writingSessions.findFirst({
    where: eq(writingSessions.id, id),
  });
  return session ?? null;
}

/**
 * Gets a session by its share slug.
 */
export async function getSessionByShareSlug(slug: string): Promise<WritingSession | null> {
  const database = requireDb();
  const session = await database.query.writingSessions.findFirst({
    where: eq(writingSessions.shareSlug, slug),
  });
  return session ?? null;
}

/**
 * Gets or creates a session based on the cookie.
 * If a valid session exists in the cookie, returns it.
 * Otherwise, creates a new ephemeral session and sets the cookie.
 */
export async function getOrCreateSession(): Promise<WritingSession> {
  const existingId = await getSessionIdFromCookie();

  if (existingId) {
    const session = await getSessionById(existingId);
    if (session) {
      // Check if session hasn't expired
      if (!session.expiresAt || session.expiresAt > new Date()) {
        return session;
      }
    }
  }

  // Create new ephemeral session
  const newSession = await createSession();
  await setSessionCookie(newSession.id);

  return newSession;
}

/**
 * Updates a session with new data.
 */
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
  }
): Promise<WritingSession | null> {
  const database = requireDb();

  const updateData: Partial<NewWritingSession> = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.formatConfig !== undefined) {
    updateData.formatConfig = data.formatConfig as unknown as Record<string, unknown>;
  }
  if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
  if (data.githubRepo !== undefined) updateData.githubRepo = data.githubRepo;
  if (data.githubPath !== undefined) updateData.githubPath = data.githubPath;
  if (data.lastGithubSha !== undefined) updateData.lastGithubSha = data.lastGithubSha;

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
  userId: string
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
export async function createShareLink(sessionId: string): Promise<WritingSession | null> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (session.shareSlug) return session;

  // Generate unique share slug with retry logic
  let shareSlug = "";
  const maxAttempts = 5;

  for (let i = 0; i < maxAttempts; i++) {
    shareSlug = generateShareSlug();
    const existing = await getSessionByShareSlug(shareSlug);
    if (!existing) break;
    if (i === maxAttempts - 1) {
      throw new Error("Failed to generate unique share slug");
    }
  }

  const [updated] = await database
    .update(writingSessions)
    .set({ shareSlug, updatedAt: new Date() })
    .where(eq(writingSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

/**
 * Deletes a session by ID.
 * Only the owner can delete their session.
 */
export async function deleteSession(
  sessionId: string,
  userId?: string
): Promise<boolean> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return false;

  if (session.ownerId && session.ownerId !== userId) {
    throw new Error("Not authorized to delete this session");
  }

  await database.delete(writingSessions).where(eq(writingSessions.id, sessionId));
  return true;
}

/**
 * Gets all sessions owned by a user.
 */
export async function getUserSessions(userId: string): Promise<WritingSession[]> {
  const database = requireDb();
  return database.query.writingSessions.findMany({
    where: eq(writingSessions.ownerId, userId),
    orderBy: (sessions, { desc }) => [desc(sessions.updatedAt)],
  });
}

/**
 * Extends the expiration time of a session.
 */
export async function extendSessionExpiry(sessionId: string): Promise<WritingSession | null> {
  const database = requireDb();

  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (session.ownerId) return session; // Owned sessions don't expire

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
// Utility Functions
// ============================================================================

/**
 * Checks if a session is expired.
 */
export function isSessionExpired(session: WritingSession): boolean {
  if (!session.expiresAt) {
    return false; // Owned sessions don't expire
  }
  return session.expiresAt < new Date();
}

/**
 * Checks if a session is password protected.
 */
export function isPasswordProtected(session: WritingSession): boolean {
  return session.passwordHash !== null;
}

/**
 * Gets the format config from a session, with type safety.
 */
export function getSessionFormatConfig(session: WritingSession): FormatConfig {
  if (session.formatConfig) {
    return session.formatConfig as unknown as FormatConfig;
  }
  return getDefaultConfig((session.type as ContentType) ?? "book");
}

/**
 * Updates a session with GitHub repository information.
 * Convenience wrapper for updateSession that only updates GitHub-related fields.
 */
export async function updateSessionGitHub(
  sessionId: string,
  data: {
    githubRepo?: string;
    githubPath?: string;
    lastGithubSha?: string;
  }
): Promise<WritingSession | null> {
  return updateSession(sessionId, {
    githubRepo: data.githubRepo ?? null,
    githubPath: data.githubPath ?? null,
    lastGithubSha: data.lastGithubSha ?? null,
  });
}
