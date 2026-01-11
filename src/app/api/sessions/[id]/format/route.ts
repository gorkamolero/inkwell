import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionIdFromCookie,
  updateSession,
} from "@/lib/session";
// FormatConfig import removed - using local type

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Format configuration (MVP subset from HOTPRESS_ARCHITECTURE.md)
 */
export interface FormatConfig {
  meta?: {
    title?: string;
    subtitle?: string;
    author?: string;
    series?: { name: string; number: number };
  };
  typography?: {
    body?: {
      font?: string;
      size?: string;
      lineHeight?: number;
    };
    headings?: {
      font?: string;
      size?: string;
    };
  };
  chapters?: {
    numbering?: {
      enabled?: boolean;
      format?: string;
    };
    dropCaps?: {
      enabled?: boolean;
      lines?: number;
      font?: string;
    };
  };
  page?: {
    size?: string;
    width?: string;
    height?: string;
    margins?: {
      top?: string;
      bottom?: string;
      outer?: string;
      gutter?: string;
    };
  };
  output?: {
    formats?: ("pdf" | "epub")[];
  };
}

/**
 * Response for getting format config
 */
export interface GetFormatResponse {
  sessionId: string;
  formatConfig: FormatConfig;
}

/**
 * Schema for updating format config (partial updates allowed)
 */
export const UpdateFormatSchema = z.object({
  meta: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      author: z.string().optional(),
      series: z
        .object({
          name: z.string(),
          number: z.number(),
        })
        .optional(),
    })
    .optional(),
  typography: z
    .object({
      body: z
        .object({
          font: z.string().optional(),
          size: z.string().optional(),
          lineHeight: z.number().optional(),
        })
        .optional(),
      headings: z
        .object({
          font: z.string().optional(),
          size: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  chapters: z
    .object({
      numbering: z
        .object({
          enabled: z.boolean().optional(),
          format: z.string().optional(),
        })
        .optional(),
      dropCaps: z
        .object({
          enabled: z.boolean().optional(),
          lines: z.number().optional(),
          font: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  page: z
    .object({
      size: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      margins: z
        .object({
          top: z.string().optional(),
          bottom: z.string().optional(),
          outer: z.string().optional(),
          gutter: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  output: z
    .object({
      formats: z.array(z.enum(["pdf", "epub"])).optional(),
    })
    .optional(),
});

export type UpdateFormatRequest = z.infer<typeof UpdateFormatSchema>;

/**
 * Response for updating format config
 */
export interface UpdateFormatResponse {
  sessionId: string;
  formatConfig: FormatConfig;
}

// ============================================================================
// GET /api/sessions/[id]/format - Get format configuration for a session
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Verify access (owner, session cookie, or anonymous session)
    const authSession = await auth();
    const userId = authSession?.user?.id;
    const cookieSessionId = await getSessionIdFromCookie();

    const hasAccess =
      (userId && session.ownerId === userId) ||
      cookieSessionId === id ||
      !session.ownerId; // Anonymous sessions are accessible

    if (!hasAccess) {
      throw ApiError.forbidden("You don't have access to this session's format");
    }

    // Return the format config (or default if not set)
    const formatConfig = session.formatConfig as FormatConfig | null;

    // Use a simple default if no format config is set
    const defaultConfig: FormatConfig = {
      typography: {
        body: { font: "Cormorant Garamond", size: "11pt", lineHeight: 1.5 },
        headings: { font: "Cinzel", size: "18pt" },
      },
      chapters: {
        numbering: { enabled: true, format: "Chapter {n}" },
        dropCaps: { enabled: true, lines: 3, font: "Cinzel" },
      },
      page: { size: "6x9" },
    };

    const response: GetFormatResponse = {
      sessionId: id,
      formatConfig: formatConfig || defaultConfig,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error getting format config:", error);
    return ApiError.internal().toResponse();
  }
}

// ============================================================================
// PUT /api/sessions/[id]/format - Update format configuration for a session
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const updates = await validateBody(request, UpdateFormatSchema);

    // Find session by ID
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Verify write access (owner or session cookie matches)
    const authSession = await auth();
    const userId = authSession?.user?.id;
    const cookieSessionId = await getSessionIdFromCookie();

    const hasAccess =
      (userId && session.ownerId === userId) ||
      cookieSessionId === id ||
      !session.ownerId; // Anonymous sessions can be edited by anyone with access

    if (!hasAccess) {
      throw ApiError.forbidden("You don't have permission to update this session's format");
    }

    // Deep merge existing formatConfig with new values
    const existingConfig = (session.formatConfig as FormatConfig) || {};
    const mergedConfig: FormatConfig = {
      ...existingConfig,
      ...(updates.meta && {
        meta: { ...existingConfig.meta, ...updates.meta },
      }),
      ...(updates.typography && {
        typography: {
          ...existingConfig.typography,
          ...updates.typography,
          body: {
            ...existingConfig.typography?.body,
            ...updates.typography.body,
          },
          headings: {
            ...existingConfig.typography?.headings,
            ...updates.typography.headings,
          },
        },
      }),
      ...(updates.chapters && {
        chapters: {
          ...existingConfig.chapters,
          ...updates.chapters,
          numbering: {
            ...existingConfig.chapters?.numbering,
            ...updates.chapters.numbering,
          },
          dropCaps: {
            ...existingConfig.chapters?.dropCaps,
            ...updates.chapters.dropCaps,
          },
        },
      }),
      ...(updates.page && {
        page: {
          ...existingConfig.page,
          ...updates.page,
          margins: {
            ...existingConfig.page?.margins,
            ...updates.page.margins,
          },
        },
      }),
      ...(updates.output && {
        output: { ...existingConfig.output, ...updates.output },
      }),
    };

    // Update session record
    const updated = await updateSession(id, {
      formatConfig: mergedConfig as unknown as import("@/lib/format-schema").FormatConfig,
    });

    if (!updated) {
      throw ApiError.internal("Failed to update format config");
    }

    const response: UpdateFormatResponse = {
      sessionId: id,
      formatConfig: mergedConfig,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error updating format config:", error);
    return ApiError.internal().toResponse();
  }
}
