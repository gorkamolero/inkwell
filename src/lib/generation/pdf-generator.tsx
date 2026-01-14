/**
 * PDF Generator
 *
 * Extracts PDF generation logic for use in workflows.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { lexicalToMarkdown } from "@/lib/editor-utils";
import { getDefaultConfig, type FormatConfig } from "@/lib/format-schema";
import { BookDocument, parseMarkdown, registerFonts } from "@/lib/pdf";
import type { SerializedEditorState } from "lexical";

export interface GenerationInput {
  sessionId: string;
  title: string | null;
  content: string;
  formatConfig: unknown;
  type: string | null;
}

export interface GenerationResult {
  buffer: Buffer;
  pageCount: number;
  generationTimeMs: number;
  filename: string;
}

/**
 * Generate a PDF buffer from session data
 */
export async function generatePdfBuffer(
  input: GenerationInput
): Promise<GenerationResult> {
  const { title, content, formatConfig, type } = input;

  // Parse Lexical content to markdown
  const editorState = JSON.parse(content) as SerializedEditorState;
  const markdown = lexicalToMarkdown(editorState);

  // Parse markdown to structured document
  const parsedDoc = parseMarkdown(markdown);

  // Get format config (with defaults)
  const contentType = (type || "book") as "book" | "article" | "thread";
  const config: FormatConfig =
    (formatConfig as FormatConfig) || getDefaultConfig(contentType);

  // Update metadata from session
  if (!config.meta) {
    config.meta = { language: "en", tags: [], title: title || undefined };
  }
  if (title && !config.meta.title) {
    config.meta.title = title;
  }

  // Register fonts before rendering
  registerFonts();

  // Generate PDF
  const startTime = Date.now();
  const pdfBuffer = await renderToBuffer(
    <BookDocument content={parsedDoc} config={config} />
  );
  const generationTimeMs = Date.now() - startTime;

  // Generate filename
  const filename = `${title || "document"}.pdf`.replace(/[^a-zA-Z0-9.-]/g, "_");

  return {
    buffer: Buffer.from(pdfBuffer),
    pageCount: parsedDoc.chapters.length + 1, // Approximate
    generationTimeMs,
    filename,
  };
}

/**
 * Estimate generation time based on content size
 */
export function estimateGenerationTime(contentLength: number): number {
  // Rough estimate: ~1 second per 5000 characters
  const baseTime = 2; // Base overhead in seconds
  const perCharTime = contentLength / 5000;
  return Math.ceil(baseTime + perCharTime);
}
