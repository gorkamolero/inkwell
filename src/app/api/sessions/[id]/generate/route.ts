import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";

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
  jobId: string;
  sessionId: string;
  format: OutputFormat;
  status: GenerationStatus;
  estimatedTimeSeconds?: number;
}

// ============================================================================
// POST /api/sessions/[id]/generate - Trigger output generation (PDF, ePub)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await validateBody(request, GenerateRequestSchema);

    // TODO: Implement output generation
    // 1. Find session by ID
    // 2. Verify access (owner or session cookie matches)
    // 3. Check if session has content to generate
    // 4. Create generation job record
    // 5. If session is saved to GitHub:
    //    - Trigger GitHub Action workflow
    //    - Return job ID for status polling
    // 6. If session is not on GitHub:
    //    - Queue local generation job
    //    - Use server-side PDF generation
    // 7. Return job status

    console.log("Triggering generation for session:", id);

    return NextResponse.json(
      { message: "Not implemented yet" },
      { status: 501 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error triggering generation:", error);
    return ApiError.internal().toResponse();
  }
}
