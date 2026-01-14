/**
 * ePub Document Builder
 *
 * Converts ParsedDocument to ePub using epub-gen-memory.
 */

import epub, { type Chapter as EpubContentType, type Options as EpubOptionsType } from "epub-gen-memory";
import type { FormatConfig } from "@/lib/format-schema";
import type { ParsedDocument } from "@/lib/pdf/content-parser";
import { renderChapter } from "./content-renderer";
import { generateFrontMatter, type EpubChapter } from "./front-matter";
import { generateBackMatter } from "./back-matter";
import { generateEpubCSS } from "./styles/theme";

export interface GenerateEpubResult {
  buffer: Buffer;
  chapterCount: number;
  generationTimeMs: number;
  filename: string;
}

/**
 * Generate an ePub buffer from parsed document and config
 */
export async function generateEpub(
  content: ParsedDocument,
  config: FormatConfig
): Promise<GenerateEpubResult> {
  const startTime = Date.now();

  // Build ePub options
  const options: EpubOptionsType = {
    title: content.title || config.meta?.title || "Untitled",
    author: config.meta?.author || "Unknown Author",
    description: config.meta?.description,
    lang: config.meta?.language || "en",
    tocTitle: "Contents",
    prependChapterTitles: false,
    version: 3,
    verbose: false,
    css: generateEpubCSS(config),
  };

  // Add cover image if specified
  const epubConfig = config.output?.epub;
  if (epubConfig?.coverImage) {
    options.cover = epubConfig.coverImage;
  }

  // Build chapters array
  const chapters: EpubContentType[] = [];

  // Front matter
  const frontMatterItems = (config.frontMatter as Array<{ type: string; [key: string]: unknown }>) || [];
  const frontMatterChapters = generateFrontMatter(frontMatterItems, config, content.chapters);
  for (const fm of frontMatterChapters) {
    chapters.push(epubChapterToContent(fm));
  }

  // Main content chapters
  for (const chapter of content.chapters) {
    const chapterHtml = renderChapter(chapter, config);
    chapters.push({
      title: chapter.title,
      content: chapterHtml,
      filename: `chapter-${chapter.number}.xhtml`,
    });
  }

  // Back matter
  const backMatterItems = (config.backMatter as Array<{ type: string; [key: string]: unknown }>) || [];
  const backMatterChapters = generateBackMatter(backMatterItems, config);
  for (const bm of backMatterChapters) {
    chapters.push({
      title: bm.title,
      content: bm.content,
      filename: bm.filename,
    });
  }

  // Generate ePub using the default export function
  const buffer = await epub(options, chapters);

  const generationTimeMs = Date.now() - startTime;

  // Generate filename
  const title = content.title || config.meta?.title || "document";
  const filename = `${title}.epub`.replace(/[^a-zA-Z0-9.-]/g, "_");

  return {
    buffer: Buffer.from(buffer),
    chapterCount: content.chapters.length,
    generationTimeMs,
    filename,
  };
}

/**
 * Convert EpubChapter to EpubContent format
 */
function epubChapterToContent(chapter: EpubChapter): EpubContentType {
  return {
    title: chapter.title,
    content: chapter.content,
    excludeFromToc: chapter.excludeFromToc,
    beforeToc: chapter.beforeToc,
    filename: chapter.filename,
  };
}
