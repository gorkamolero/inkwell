/**
 * ePub Generator
 *
 * Generates ePub files for use in workflows.
 */

import { lexicalToMarkdown } from "@/lib/editor-utils";
import { getDefaultConfig, type FormatConfig } from "@/lib/format-schema";
import { parseMarkdown } from "@/lib/pdf";
import { generateEpub as generateEpubCore } from "@/lib/epub";
import { getExportAccess } from "@/lib/subscription";
import type { SerializedEditorState } from "lexical";
import type { GenerationInput } from "./pdf-generator";

export interface EpubGenerationResult {
  buffer: Buffer;
  chapterCount: number;
  generationTimeMs: number;
  filename: string;
}

/**
 * Generate an ePub buffer from session data
 */
export async function generateEpubBuffer(
  input: GenerationInput
): Promise<EpubGenerationResult> {
  const { title, content, formatConfig, type, userId, sessionId } = input;

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

  // Check if we need to add "Made with Hotpress" footer
  const exportAccess = await getExportAccess(userId || null, sessionId);
  const shouldAddFooter = !exportAccess.hasCleanExports;

  // Generate ePub with optional footer
  const result = await generateEpubCore(parsedDoc, config, shouldAddFooter);

  return result;
}
