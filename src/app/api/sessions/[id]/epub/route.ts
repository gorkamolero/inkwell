/**
 * ePub API Endpoint
 *
 * Generates an ePub file for a writing session.
 */

import { type NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
} from "@/lib/session";
import { lexicalToMarkdown } from "@/lib/editor-utils";
import { getDefaultConfig, type FormatConfig } from "@/lib/format-schema";
import { parseMarkdown } from "@/lib/pdf";
import { generateEpub } from "@/lib/epub";
import type { SerializedEditorState } from "lexical";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

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
// GET /api/sessions/[id]/epub - Download ePub file
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
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
      throw ApiError.badRequest("Session has no content to export");
    }

    // Parse Lexical content to markdown
    let markdown: string;
    try {
      const editorState = JSON.parse(session.content) as SerializedEditorState;
      markdown = lexicalToMarkdown(editorState);
    } catch (error) {
      console.error("Failed to parse editor content:", error);
      throw ApiError.badRequest("Invalid editor content format");
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

    // Generate ePub
    const startTime = Date.now();
    const result = await generateEpub(parsedDoc, formatConfig);
    const generationTime = Date.now() - startTime;

    console.log(
      `ePub generated in ${generationTime}ms for session ${id} (${result.chapterCount} chapters)`
    );

    // Return as downloadable file
    const uint8Array = new Uint8Array(result.buffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error generating ePub:", error);
    return ApiError.internal("Failed to generate ePub").toResponse();
  }
}
