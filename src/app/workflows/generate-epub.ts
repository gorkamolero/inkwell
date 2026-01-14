/**
 * ePub Generation Workflow
 *
 * Durable workflow for background ePub generation using Vercel Workflow.
 */

import { getSessionById } from "@/lib/session";
import {
  generateEpubBuffer,
  uploadEpub,
  type GenerationInput,
} from "@/lib/generation";

export interface EpubWorkflowResult {
  url: string;
  filename: string;
  chapterCount: number;
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
 * Generate ePub buffer (step)
 */
async function generateEpub(
  input: GenerationInput
): Promise<{ buffer: Buffer; chapterCount: number; generationTimeMs: number; filename: string }> {
  "use step";

  const result = await generateEpubBuffer(input);
  return result;
}

/**
 * Upload ePub to Vercel Blob (step)
 */
async function uploadToBlob(
  jobId: string,
  buffer: Buffer,
  filename: string
): Promise<{ url: string; size: number; expiresAt: Date }> {
  "use step";

  const result = await uploadEpub(jobId, buffer, filename);
  return result;
}

/**
 * Main ePub generation workflow
 */
export async function generateEpubWorkflow(
  sessionId: string,
  jobId: string
): Promise<EpubWorkflowResult> {
  "use workflow";

  // Step 1: Fetch session data
  const input = await fetchSession(sessionId);

  // Step 2: Generate ePub
  const epubResult = await generateEpub(input);

  // Step 3: Upload to Vercel Blob
  const uploadResult = await uploadToBlob(jobId, epubResult.buffer, epubResult.filename);

  return {
    url: uploadResult.url,
    filename: epubResult.filename,
    chapterCount: epubResult.chapterCount,
    size: uploadResult.size,
    generationTimeMs: epubResult.generationTimeMs,
    expiresAt: uploadResult.expiresAt.toISOString(),
  };
}
