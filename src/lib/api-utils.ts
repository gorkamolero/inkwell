import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import { auth } from "@/lib/auth";
import { db, projects, projectCollaborators, accounts } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import type { Project, CollaboratorRole } from "@/lib/db/schema";

// ============================================================================
// ApiError Class
// ============================================================================

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || this.getCodeFromStatus(status);
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "VALIDATION_ERROR";
      case 429:
        return "RATE_LIMITED";
      case 500:
        return "INTERNAL_ERROR";
      default:
        return "UNKNOWN";
    }
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
      },
      { status: this.status }
    );
  }

  static badRequest(message: string) {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(message, 403);
  }

  static notFound(message: string = "Not found") {
    return new ApiError(message, 404);
  }

  static conflict(message: string) {
    return new ApiError(message, 409);
  }

  static validationError(message: string) {
    return new ApiError(message, 422, "VALIDATION_ERROR");
  }

  static limitExceeded(message: string) {
    return new ApiError(message, 403, "LIMIT_EXCEEDED");
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(message, 500);
  }
}

// ============================================================================
// Types
// ============================================================================

export interface AuthContext {
  userId: string;
  userEmail: string;
  accessToken?: string;
}

export interface ProjectContext extends AuthContext {
  project: Project;
  role: "owner" | CollaboratorRole;
  isOwner: boolean;
}

export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse<T>>;

export type ProjectHandler = (
  request: NextRequest,
  context: ProjectContext
) => Promise<NextResponse>;

// ============================================================================
// withAuth Wrapper
// ============================================================================

/**
 * Wraps an API route handler with authentication.
 * Ensures the user is logged in and provides their session info.
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedHandler<T>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const session = await auth();

      if (!session?.user?.id || !session?.user?.email) {
        throw ApiError.unauthorized();
      }

      if (!db) {
        throw ApiError.internal("Database not configured");
      }

      // Get GitHub access token if available
      const userAccount = await db
        .select({ accessToken: accounts.access_token })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, session.user.id),
            eq(accounts.provider, "github")
          )
        )
        .limit(1);

      const context: AuthContext = {
        userId: session.user.id,
        userEmail: session.user.email,
        accessToken: userAccount[0]?.accessToken ?? undefined,
      };

      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return error.toResponse();
      }

      console.error("API Error:", error);
      return ApiError.internal().toResponse();
    }
  };
}

// ============================================================================
// withProject Wrapper
// ============================================================================

interface WithProjectOptions {
  /** Require user to be the owner (not just collaborator) */
  requireOwner?: boolean;
  /** Minimum role required for collaborators */
  minRole?: CollaboratorRole;
  /** Require GitHub to be connected */
  requireGitHub?: boolean;
}

/**
 * Wraps an API route handler with authentication and project access checks.
 * Verifies the user has access to the specified project (owner or collaborator).
 */
export function withProject(
  handler: ProjectHandler,
  options: WithProjectOptions = {}
): (
  request: NextRequest,
  routeContext: { params: Promise<{ projectId: string }> }
) => Promise<NextResponse> {
  const { requireOwner = false, minRole, requireGitHub = false } = options;

  return async (request, routeContext) => {
    try {
      const { projectId } = await routeContext.params;
      const session = await auth();

      if (!session?.user?.id || !session?.user?.email) {
        throw ApiError.unauthorized();
      }

      if (!db) {
        throw ApiError.internal("Database not configured");
      }

      // Fetch the project by ID or slug
      const project = await db.query.projects.findFirst({
        where: or(eq(projects.id, projectId), eq(projects.slug, projectId)),
      });

      if (!project) {
        throw ApiError.notFound("Project not found");
      }

      // Check access
      const isOwner = project.userId === session.user.id;
      let role: "owner" | CollaboratorRole = isOwner ? "owner" : "viewer";

      if (!isOwner) {
        // Check if user is a collaborator
        const collaboration = await db.query.projectCollaborators.findFirst({
          where: and(
            eq(projectCollaborators.projectId, projectId),
            eq(projectCollaborators.userId, session.user.id)
          ),
        });

        if (!collaboration) {
          // Check if project is public (read-only access)
          if (project.isPublic) {
            role = "viewer";
          } else {
            throw ApiError.forbidden("You don't have access to this project");
          }
        } else {
          role = collaboration.role as CollaboratorRole;
        }
      }

      // Check owner requirement
      if (requireOwner && !isOwner) {
        throw ApiError.forbidden("Only the project owner can perform this action");
      }

      // Check minimum role requirement
      if (minRole && !isOwner) {
        const roleHierarchy: Record<CollaboratorRole, number> = {
          viewer: 1,
          editor: 2,
          admin: 3,
        };

        if (roleHierarchy[role as CollaboratorRole] < roleHierarchy[minRole]) {
          throw ApiError.forbidden(
            `You need at least ${minRole} permissions for this action`
          );
        }
      }

      // Get GitHub access token
      const userAccount = await db
        .select({ accessToken: accounts.access_token })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, session.user.id),
            eq(accounts.provider, "github")
          )
        )
        .limit(1);

      const accessToken = userAccount[0]?.accessToken ?? undefined;

      // Check GitHub requirement
      if (requireGitHub && !accessToken) {
        throw ApiError.forbidden("GitHub account not connected");
      }

      const context: ProjectContext = {
        userId: session.user.id,
        userEmail: session.user.email,
        accessToken,
        project,
        role,
        isOwner,
      };

      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return error.toResponse();
      }

      console.error("API Error:", error);
      return ApiError.internal().toResponse();
    }
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates request body against a Zod schema.
 * Throws ApiError on validation failure.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      throw ApiError.validationError(message);
    }
    throw ApiError.badRequest("Invalid request body");
  }
}

/**
 * Validates query parameters against a Zod schema.
 * Throws ApiError on validation failure.
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      throw ApiError.validationError(message);
    }
    throw ApiError.badRequest("Invalid query parameters");
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

export function jsonResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function successResponse(
  message: string = "Success"
): NextResponse<{ success: boolean; message: string }> {
  return NextResponse.json({ success: true, message });
}

// ============================================================================
// GitHub Access Token Helper
// ============================================================================

/**
 * Fetches the GitHub access token for a user.
 * Returns null if not connected to GitHub.
 */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  if (!db) return null;

  const userAccount = await db
    .select({ accessToken: accounts.access_token })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "github")))
    .limit(1);

  return userAccount[0]?.accessToken ?? null;
}

/**
 * Fetches the GitHub access token for a user, throwing if not connected.
 */
export async function requireGitHubAccessToken(userId: string): Promise<string> {
  const token = await getGitHubAccessToken(userId);
  if (!token) {
    throw ApiError.forbidden("GitHub not connected");
  }
  return token;
}

// ============================================================================
// Database Helper
// ============================================================================

/**
 * Ensures database is configured, throwing if not.
 */
export function requireDatabase(): NonNullable<typeof db> {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }
  return db;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generates a CUID-like ID for database records.
 * Uses crypto.randomUUID() as a simple alternative.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generates a URL-safe slug from a string.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
