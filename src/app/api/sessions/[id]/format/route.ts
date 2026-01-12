import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
  updateSession,
} from "@/lib/session";

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
// Constants
// ============================================================================

const DEFAULT_FORMAT_CONFIG: FormatConfig = {
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

// ============================================================================
// Helper: Build access context
// ============================================================================

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

// ============================================================================
// GET /api/sessions/[id]/format - Get format configuration for a session
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context)) {
      throw ApiError.forbidden(
        "You don't have access to this session's format",
      );
    }

    const formatConfig =
      (session.formatConfig as FormatConfig | null) ?? DEFAULT_FORMAT_CONFIG;

    return NextResponse.json({ sessionId: id, formatConfig });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error getting format config:", error);
    return ApiError.internal().toResponse();
  }
}

// ============================================================================
// Helper: Deep merge format configs
// ============================================================================

function mergeFormatConfig(
  existing: FormatConfig,
  updates: UpdateFormatRequest,
): FormatConfig {
  return {
    ...existing,
    ...(updates.meta && {
      meta: { ...existing.meta, ...updates.meta },
    }),
    ...(updates.typography && {
      typography: {
        ...existing.typography,
        ...updates.typography,
        body: { ...existing.typography?.body, ...updates.typography.body },
        headings: {
          ...existing.typography?.headings,
          ...updates.typography.headings,
        },
      },
    }),
    ...(updates.chapters && {
      chapters: {
        ...existing.chapters,
        ...updates.chapters,
        numbering: {
          ...existing.chapters?.numbering,
          ...updates.chapters.numbering,
        },
        dropCaps: {
          ...existing.chapters?.dropCaps,
          ...updates.chapters.dropCaps,
        },
      },
    }),
    ...(updates.page && {
      page: {
        ...existing.page,
        ...updates.page,
        margins: { ...existing.page?.margins, ...updates.page.margins },
      },
    }),
    ...(updates.output && {
      output: { ...existing.output, ...updates.output },
    }),
  };
}

// ============================================================================
// PUT /api/sessions/[id]/format - Update format configuration for a session
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const updates = await validateBody(request, UpdateFormatSchema);

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const context = await getAccessContext();
    if (!canAccessSession(session, context, true)) {
      throw ApiError.forbidden(
        "You don't have permission to update this session's format",
      );
    }

    const existingConfig = (session.formatConfig as FormatConfig) || {};
    const mergedConfig = mergeFormatConfig(existingConfig, updates);

    const updated = await updateSession(id, {
      formatConfig:
        mergedConfig as unknown as import("@/lib/format-schema").FormatConfig,
    });

    if (!updated) {
      throw ApiError.internal("Failed to update format config");
    }

    return NextResponse.json({ sessionId: id, formatConfig: mergedConfig });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error updating format config:", error);
    return ApiError.internal().toResponse();
  }
}
