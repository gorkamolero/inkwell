/**
 * Generate API Endpoint
 *
 * Triggers background PDF/ePub generation using Vercel Workflow.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { start } from "workflow/api";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import {
  canAccessSession,
  getSessionById,
  getSessionIdFromCookie,
} from "@/lib/session";
import { generatePdfWorkflow } from "@/app/workflows/generate-pdf";
import { generateEpubWorkflow } from "@/app/workflows/generate-epub";
import { estimateGenerationTime } from "@/lib/generation";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Supported output formats
 */
export type OutputFormat = "pdf" | "epub";

/**
 * Generation job status
 */
export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

/**
 * Request body for triggering generation
 */
export const GenerateRequestSchema = z.object({
  format: z.enum(["pdf", "epub"]).default("pdf"),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/**
 * Response for triggering generation
 */
export interface GenerateResponse {
  runId: string;
  sessionId: string;
  format: OutputFormat;
  status: GenerationStatus;
  estimatedTimeSeconds?: number;
  message: string;
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

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// POST /api/sessions/[id]/generate - Trigger output generation (PDF, ePub)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Parse and validate request body
    const body = await validateBody(request, GenerateRequestSchema);
    const format = body.format;

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
      throw ApiError.badRequest("Session has no content to generate");
    }

    // Generate job ID
    const jobId = generateJobId();

    // Estimate generation time
    const estimatedTimeSeconds = estimateGenerationTime(session.content.length);

    console.log(
      `Starting ${format} generation for session ${id}, job ${jobId}`
    );

    // For PDF format, start the workflow
    if (format === "pdf") {
      // Start the workflow (runs in background, returns immediately)
      await start(generatePdfWorkflow, [id, jobId, context.userId]);

      console.log(`PDF workflow started for job: ${jobId}`);

      const response: GenerateResponse = {
        runId: jobId,
        sessionId: id,
        format,
        status: "queued",
        estimatedTimeSeconds,
        message: "PDF generation started. Check workflow status for progress.",
      };

      return NextResponse.json(response, { status: 202 });
    }

    // For ePub format, start the ePub workflow
    if (format === "epub") {
      await start(generateEpubWorkflow, [id, jobId, context.userId]);

      console.log(`ePub workflow started for job: ${jobId}`);

      const response: GenerateResponse = {
        runId: jobId,
        sessionId: id,
        format,
        status: "queued",
        estimatedTimeSeconds,
        message: "ePub generation started. Check workflow status for progress.",
      };

      return NextResponse.json(response, { status: 202 });
    }

    throw ApiError.badRequest(`Unsupported format: ${format}`);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error triggering generation:", error);
    return ApiError.internal("Failed to trigger generation").toResponse();
  }
}
