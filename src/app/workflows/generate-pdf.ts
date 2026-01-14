/**
 * PDF Generation Workflow
 *
 * Durable workflow for background PDF generation using Vercel Workflow.
 */

import { getSessionById } from "@/lib/session";
import {
  generatePdfBuffer,
  uploadPdf,
  type GenerationInput,
} from "@/lib/generation";

export interface WorkflowResult {
  url: string;
  filename: string;
  pageCount: number;
  size: number;
  generationTimeMs: number;
  expiresAt: string;
}

/**
 * Fetch session data (step)
 */
async function fetchSession(sessionId: string): Promise<GenerationInput> {
  "use step";

  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (!session.content) {
    throw new Error(`Session has no content: ${sessionId}`);
  }

  return {
    sessionId: session.id,
    title: session.title,
    content: session.content,
    formatConfig: session.formatConfig,
    type: session.type,
  };
}

/**
 * Generate PDF buffer (step - this is the long-running part)
 */
async function generatePdf(
  input: GenerationInput
): Promise<{ buffer: Buffer; pageCount: number; generationTimeMs: number; filename: string }> {
  "use step";

  const result = await generatePdfBuffer(input);
  return result;
}

/**
 * Upload PDF to Vercel Blob (step)
 */
async function uploadToBlob(
  jobId: string,
  buffer: Buffer,
  filename: string
): Promise<{ url: string; size: number; expiresAt: Date }> {
  "use step";

  const result = await uploadPdf(jobId, buffer, filename);
  return result;
}

/**
 * Main PDF generation workflow
 */
export async function generatePdfWorkflow(
  sessionId: string,
  jobId: string
): Promise<WorkflowResult> {
  "use workflow";

  // Step 1: Fetch session data
  const input = await fetchSession(sessionId);

  // Step 2: Generate PDF (long-running)
  const pdfResult = await generatePdf(input);

  // Step 3: Upload to Vercel Blob
  const uploadResult = await uploadToBlob(jobId, pdfResult.buffer, pdfResult.filename);

  return {
    url: uploadResult.url,
    filename: pdfResult.filename,
    pageCount: pdfResult.pageCount,
    size: uploadResult.size,
    generationTimeMs: pdfResult.generationTimeMs,
    expiresAt: uploadResult.expiresAt.toISOString(),
  };
}
