/**
 * Preview API Endpoint
 *
 * Generates a PDF preview for a writing session.
 * Uses React-PDF for fast, server-side generation.
 */

import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
} from "@/lib/session";
import { lexicalToMarkdown } from "@/lib/editor-utils";
import { getDefaultConfig, type FormatConfig } from "@/lib/format-schema";
import { BookDocument, parseMarkdown, registerFonts } from "@/lib/pdf";
import { getExportAccess } from "@/lib/subscription";
import type { SerializedEditorState } from "lexical";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Request body for preview generation
 */
export const PreviewRequestSchema = z.object({
  quality: z.enum(["draft", "preview"]).optional().default("preview"),
});

export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;

/**
 * Response for preview generation
 */
export interface PreviewResponse {
  previewUrl: string;
  pageCount: number;
  generatedAt: string;
  quality: "draft" | "preview";
  expiresAt: string;
}

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
// POST /api/sessions/[id]/preview - Generate PDF preview
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Parse request body (optional)
    let quality: "draft" | "preview" = "preview";
    try {
      const body = await validateBody(request, PreviewRequestSchema);
      quality = body.quality || "preview";
    } catch {
      // Use defaults if body is empty or invalid
    }

    // Get session
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Check access
    const context = await getAccessContext();
    if (!canAccessSession(session, context)) {
      throw ApiError.forbidden("You don't have access to this session");
    }

    // Check if session has content
    if (!session.content) {
      throw ApiError.badRequest("Session has no content to preview");
    }

    // Parse Lexical content to markdown
    let markdown: string;
    try {
      const editorState = JSON.parse(session.content) as SerializedEditorState;
      markdown = lexicalToMarkdown(editorState);
    } catch (error) {
      // If JSON parsing fails, check if it's already markdown
      if (session.content.trim().startsWith("#")) {
        markdown = session.content;
      } else {
        console.error("Failed to parse editor content:", error);
        throw ApiError.badRequest("Invalid editor content format");
      }
    }

    // Parse markdown to structured document
    const parsedDoc = parseMarkdown(markdown);

    // Get format config (with defaults)
    const formatConfig: FormatConfig =
      (session.formatConfig as FormatConfig) ||
      getDefaultConfig(session.type as "book" | "article" | "thread");

    // Update metadata from session
    if (!formatConfig.meta) {
      formatConfig.meta = { language: "en", tags: [], title: session.title || undefined };
    }
    if (session.title && !formatConfig.meta.title) {
      formatConfig.meta.title = session.title;
    }

    // Check export access for Hotpress colophon
    const exportAccess = await getExportAccess(context.userId || null, id);
    const showHotpressColophon = !exportAccess.hasCleanExports;

    // Register fonts before rendering
    registerFonts();

    // Generate PDF
    const startTime = Date.now();
    const pdfBuffer = await renderToBuffer(
      <BookDocument
        content={parsedDoc}
        config={formatConfig}
        showHotpressColophon={showHotpressColophon}
      />,
    );
    const generationTime = Date.now() - startTime;

    console.log(
      `PDF preview generated in ${generationTime}ms for session ${id}`,
    );

    // Convert to base64 data URL
    const base64 = Buffer.from(pdfBuffer).toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    // Calculate expiry (5 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    const response: PreviewResponse = {
      previewUrl: dataUrl,
      pageCount: parsedDoc.chapters.length + 1, // Approximate
      generatedAt: now.toISOString(),
      quality,
      expiresAt: expiresAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error generating preview:", error);
    return ApiError.internal("Failed to generate preview").toResponse();
  }
}

// ============================================================================
// GET /api/sessions/[id]/preview - Get preview as PDF file
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get session
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    // Check access
    const context = await getAccessContext();
    if (!canAccessSession(session, context)) {
      throw ApiError.forbidden("You don't have access to this session");
    }

    // Check if session has content
    if (!session.content) {
      throw ApiError.badRequest("Session has no content to preview");
    }

    // Parse Lexical content to markdown
    let markdown: string;
    try {
      const editorState = JSON.parse(session.content) as SerializedEditorState;
      markdown = lexicalToMarkdown(editorState);
    } catch (error) {
      // If JSON parsing fails, check if it's already markdown
      if (session.content.trim().startsWith("#")) {
        markdown = session.content;
      } else {
        console.error("Failed to parse editor content:", error);
        throw ApiError.badRequest("Invalid editor content format");
      }
    }

    // Parse markdown to structured document
    const parsedDoc = parseMarkdown(markdown);

    // Get format config (with defaults)
    const formatConfig: FormatConfig =
      (session.formatConfig as FormatConfig) ||
      getDefaultConfig(session.type as "book" | "article" | "thread");

    // Update metadata from session
    if (!formatConfig.meta) {
      formatConfig.meta = { language: "en", tags: [], title: session.title || undefined };
    }
    if (session.title && !formatConfig.meta.title) {
      formatConfig.meta.title = session.title;
    }

    // Check export access for Hotpress colophon
    const exportAccess = await getExportAccess(context.userId || null, id);
    const showHotpressColophon = !exportAccess.hasCleanExports;

    // Register fonts before rendering
    registerFonts();

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <BookDocument
        content={parsedDoc}
        config={formatConfig}
        showHotpressColophon={showHotpressColophon}
      />,
    );

    // Return as PDF file
    const filename = `${session.title || "preview"}.pdf`.replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300", // 5 minutes
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error generating preview:", error);
    return ApiError.internal("Failed to generate preview").toResponse();
  }
}
