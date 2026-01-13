/**
 * Content Parser for PDF Generation
 *
 * Parses markdown content into a structured document format
 * suitable for PDF rendering with chapters, scenes, and formatting.
 */

export interface TextNode {
  type: "text";
  content: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export interface ParagraphNode {
  type: "paragraph";
  children: TextNode[];
  isFirstInChapter?: boolean;
  isFirstAfterSceneBreak?: boolean;
}

export interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
}

export interface BlockquoteNode {
  type: "blockquote";
  children: ParagraphNode[];
}

export interface ListNode {
  type: "list";
  ordered: boolean;
  items: string[];
}

export interface SceneBreakNode {
  type: "scene-break";
}

export interface ImageNode {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface VerseNode {
  type: "verse";
  lines: string[];
}

export interface CalloutNode {
  type: "callout";
  kind: "note" | "warning" | "tip" | "important";
  title?: string;
  children: ParagraphNode[];
}

export type ContentNode =
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | ListNode
  | SceneBreakNode
  | ImageNode
  | VerseNode
  | CalloutNode;

export interface Chapter {
  number: number;
  title: string;
  subtitle?: string;
  content: ContentNode[];
}

export interface ParsedDocument {
  title?: string;
  chapters: Chapter[];
  wordCount: number;
}

/**
 * Parse markdown into structured document
 */
export function parseMarkdown(markdown: string): ParsedDocument {
  const lines = markdown.split("\n");
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let documentTitle: string | undefined;
  let wordCount = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Check for scene breaks (---, ***, ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      if (currentChapter) {
        currentChapter.content.push({ type: "scene-break" });
      }
      i++;
      continue;
    }

    // Check for headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const headingText = headingMatch[2].trim();

      // H1 = document title or chapter
      if (level === 1) {
        if (!documentTitle) {
          documentTitle = headingText;
        }
        // Start a new chapter
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          number: chapters.length + 1,
          title: headingText,
          content: [],
        };
      }
      // H2 = chapter (if no H1 chapters) or section within chapter
      else if (level === 2) {
        // Treat H2 as chapter start if we don't have a chapter yet
        if (!currentChapter) {
          currentChapter = {
            number: chapters.length + 1,
            title: headingText,
            content: [],
          };
        } else {
          // Add as subheading within chapter
          currentChapter.content.push({
            type: "heading",
            level,
            content: headingText,
          });
        }
      } else {
        // Other headings go into current chapter
        if (!currentChapter) {
          currentChapter = {
            number: 1,
            title: "Chapter 1",
            content: [],
          };
        }
        currentChapter.content.push({
          type: "heading",
          level,
          content: headingText,
        });
      }

      wordCount += countWordsInText(headingText);
      i++;
      continue;
    }

    // Check for blockquotes
    if (trimmed.startsWith(">")) {
      const blockquoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        blockquoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }

      if (!currentChapter) {
        currentChapter = {
          number: 1,
          title: "Chapter 1",
          content: [],
        };
      }

      const blockquoteText = blockquoteLines.join("\n");
      currentChapter.content.push({
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: parseInlineFormatting(blockquoteText),
          },
        ],
      });
      wordCount += countWordsInText(blockquoteText);
      continue;
    }

    // Check for lists
    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+/);
    if (listMatch) {
      const ordered = /^\d+\./.test(trimmed);
      const items: string[] = [];

      while (i < lines.length) {
        const listLine = lines[i].trim();
        const itemMatch = listLine.match(/^([-*+]|\d+\.)\s+(.+)$/);
        if (!itemMatch) break;
        items.push(itemMatch[2]);
        wordCount += countWordsInText(itemMatch[2]);
        i++;
      }

      if (!currentChapter) {
        currentChapter = {
          number: 1,
          title: "Chapter 1",
          content: [],
        };
      }

      currentChapter.content.push({
        type: "list",
        ordered,
        items,
      });
      continue;
    }

    // Check for images
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      if (!currentChapter) {
        currentChapter = {
          number: 1,
          title: "Chapter 1",
          content: [],
        };
      }

      currentChapter.content.push({
        type: "image",
        alt: imageMatch[1],
        src: imageMatch[2],
      });
      i++;
      continue;
    }

    // Regular paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*_]{3,}$/.test(lines[i].trim()) &&
      !/^([-*+]|\d+\.)\s+/.test(lines[i].trim()) &&
      !/^!\[/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }

    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join(" ");

      if (!currentChapter) {
        currentChapter = {
          number: 1,
          title: "Chapter 1",
          content: [],
        };
      }

      const isFirstInChapter = currentChapter.content.length === 0;
      const lastNode = currentChapter.content[currentChapter.content.length - 1];
      const isFirstAfterSceneBreak = lastNode?.type === "scene-break";

      currentChapter.content.push({
        type: "paragraph",
        children: parseInlineFormatting(paragraphText),
        isFirstInChapter,
        isFirstAfterSceneBreak,
      });

      wordCount += countWordsInText(paragraphText);
    }
  }

  // Push the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // If no chapters were created, create a default one
  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: "Chapter 1",
      content: [],
    });
  }

  return {
    title: documentTitle,
    chapters,
    wordCount,
  };
}

/**
 * Parse inline formatting (bold, italic, code)
 */
function parseInlineFormatting(text: string): TextNode[] {
  const nodes: TextNode[] = [];

  // Simple regex-based parser for inline formatting
  // Matches: **bold**, *italic*, `code`
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;

  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      nodes.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the formatted text
    if (match[2]) {
      // Bold
      nodes.push({
        type: "text",
        content: match[2],
        bold: true,
      });
    } else if (match[3]) {
      // Italic
      nodes.push({
        type: "text",
        content: match[3],
        italic: true,
      });
    } else if (match[4]) {
      // Code
      nodes.push({
        type: "text",
        content: match[4],
        code: true,
      });
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  // If no nodes were created, return the whole text as a single node
  if (nodes.length === 0) {
    return [{ type: "text", content: text }];
  }

  return nodes;
}

/**
 * Count words in plain text
 */
function countWordsInText(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Get the first letter of a paragraph for drop cap
 */
export function getDropCapLetter(paragraph: ParagraphNode): string | null {
  const firstChild = paragraph.children[0];
  if (firstChild && firstChild.content.length > 0) {
    return firstChild.content[0].toUpperCase();
  }
  return null;
}

/**
 * Get paragraph text without the first letter (for drop cap)
 */
export function getTextAfterDropCap(paragraph: ParagraphNode): TextNode[] {
  const result = [...paragraph.children];
  if (result.length > 0 && result[0].content.length > 0) {
    result[0] = {
      ...result[0],
      content: result[0].content.slice(1),
    };
  }
  return result;
}
