/**
 * PDF Generator
 *
 * Extracts PDF generation logic for use in workflows.
 * Supports optional print-ready post-processing for Pro users.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { lexicalToMarkdown } from "@/lib/editor-utils";
import { getDefaultConfig, type FormatConfig } from "@/lib/format-schema";
import { BookDocument, parseMarkdown, registerFonts, parseToPoints } from "@/lib/pdf";
import type { SerializedEditorState } from "lexical";
import { processForPrint, requiresPrintProcessing } from "./print-processor";
import {
  getPrintFeatureAccess,
  filterPrintConfig,
  hasPrintFeaturesEnabled,
} from "./print-features";

export interface GenerationInput {
  sessionId: string;
  title: string | null;
  content: string;
  formatConfig: unknown;
  type: string | null;
}

export interface PrintOptions {
  /** User ID for subscription tier checking */
  userId?: string;
  /** Force enable print features (bypasses tier check, for testing) */
  forceEnable?: boolean;
}

export interface GenerationResult {
  buffer: Buffer;
  pageCount: number;
  generationTimeMs: number;
  filename: string;
}

/**
 * Generate a PDF buffer from session data
 *
 * @param input - Session data including content and format config
 * @param printOptions - Optional print processing options (requires Pro tier)
 */
export async function generatePdfBuffer(
  input: GenerationInput,
  printOptions?: PrintOptions
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

  let finalBuffer = Buffer.from(pdfBuffer);

  // Apply print processing if enabled and user has access
  const pdfConfig = config.output?.pdf;
  if (pdfConfig && hasPrintFeaturesEnabled(pdfConfig)) {
    // Check user tier access
    const access = printOptions?.forceEnable
      ? { canUseBleed: true, canUseTrimMarks: true, canUseRegistrationMarks: true, canUseColorBars: true, canUsePdfX: true, canUseCMYK: true, tier: "pro" as const }
      : await getPrintFeatureAccess(printOptions?.userId);

    // Filter config to only include features user has access to
    const filteredConfig = filterPrintConfig(pdfConfig, access);

    // Build print processor options
    const bleedPoints = parseToPoints(filteredConfig.bleed);
    const processorOptions = {
      bleed: bleedPoints,
      addTrimMarks: filteredConfig.trimMarks,
      addRegistrationMarks: filteredConfig.registrationMarks,
      addColorBars: filteredConfig.colorBars,
      outputIntent: filteredConfig.outputIntent,
    };

    // Only process if there's something to do
    if (requiresPrintProcessing(processorOptions)) {
      finalBuffer = Buffer.from(await processForPrint(finalBuffer, processorOptions));
    }
  }

  const generationTimeMs = Date.now() - startTime;

  // Generate filename
  const filename = `${title || "document"}.pdf`.replace(/[^a-zA-Z0-9.-]/g, "_");

  return {
    buffer: finalBuffer,
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
