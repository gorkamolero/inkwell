/**
 * ePub Content Renderer
 *
 * Converts ParsedDocument content nodes to XHTML for ePub chapters.
 */

import type { FormatConfig } from "@/lib/format-schema";
import type {
  Chapter,
  ContentNode,
  ParagraphNode,
  TextNode,
  VerseNode,
  CalloutNode,
  InlineNode,
} from "@/lib/pdf/content-parser";
import { toRoman, toWord } from "@/lib/pdf/utils/number-format";

/**
 * Render a complete chapter to XHTML
 */
export function renderChapter(
  chapter: Chapter,
  config: FormatConfig
): string {
  const chapterConfig = config.chapters;
  const dropCaps = config.dropCaps;

  let html = '<section class="chapter">\n';

  // Chapter number
  if (chapterConfig?.numbering?.enabled) {
    const format = chapterConfig.numbering.format || "Chapter {n}";
    const numberText = format
      .replace("{n}", String(chapter.number))
      .replace("{roman}", toRoman(chapter.number))
      .replace("{word}", toWord(chapter.number));
    html += `  <p class="chapter-number">${escapeHtml(numberText)}</p>\n`;
  }

  // Chapter title
  html += `  <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>\n`;

  // Chapter subtitle
  if (chapter.subtitle && chapterConfig?.subtitle?.enabled) {
    html += `  <p class="chapter-subtitle">${escapeHtml(chapter.subtitle)}</p>\n`;
  }

  // Chapter ornament
  if (chapterConfig?.ornament?.enabled) {
    html += '  <div class="chapter-ornament"></div>\n';
  }

  // Content
  let isFirstParagraph = true;
  for (const node of chapter.content) {
    html += renderContentNode(node, config, isFirstParagraph, dropCaps?.enabled ?? false);
    if (node.type === "paragraph") {
      isFirstParagraph = false;
    }
    // Reset first paragraph after scene break
    if (node.type === "scene-break") {
      isFirstParagraph = true;
    }
  }

  html += "</section>\n";
  return html;
}

/**
 * Render a single content node to XHTML
 */
export function renderContentNode(
  node: ContentNode,
  config: FormatConfig,
  isFirstParagraph: boolean,
  enableDropCaps: boolean
): string {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node as ParagraphNode, isFirstParagraph, enableDropCaps);

    case "heading":
      return renderHeading(node);

    case "blockquote":
      return renderBlockquote(node, config);

    case "list":
      return renderList(node);

    case "scene-break":
      return renderSceneBreak(config);

    case "image":
      return renderImage(node);

    case "verse":
      return renderVerse(node as VerseNode, config);

    case "callout":
      return renderCallout(node as CalloutNode, config);

    default:
      return "";
  }
}

/**
 * Render paragraph with optional drop cap
 */
function renderParagraph(
  node: ParagraphNode,
  isFirst: boolean,
  enableDropCaps: boolean
): string {
  const shouldDropCap = enableDropCaps && (node.isFirstInChapter || node.isFirstAfterSceneBreak || isFirst);
  const className = isFirst || node.isFirstInChapter ? "first-paragraph" : "paragraph";

  const content = renderTextNodes(node.children);

  if (shouldDropCap && content.length > 0) {
    // Extract first letter for drop cap
    const firstChar = content.charAt(0);
    const rest = content.slice(1);
    return `  <p class="${className}"><span class="dropcap">${escapeHtml(firstChar)}</span>${rest}</p>\n`;
  }

  return `  <p class="${className}">${content}</p>\n`;
}

/**
 * Render heading (H2-H6)
 */
function renderHeading(node: ContentNode & { level: number; content: string }): string {
  const level = Math.min(Math.max(node.level, 2), 6);
  return `  <h${level} class="heading-${level}">${escapeHtml(node.content)}</h${level}>\n`;
}

/**
 * Render blockquote
 */
function renderBlockquote(
  node: ContentNode & { children: ParagraphNode[] },
  _config: FormatConfig
): string {
  let html = "  <blockquote>\n";
  for (const para of node.children) {
    html += `    <p>${renderTextNodes(para.children)}</p>\n`;
  }
  html += "  </blockquote>\n";
  return html;
}

/**
 * Render list (ordered or unordered)
 */
function renderList(
  node: ContentNode & { ordered: boolean; items: string[] }
): string {
  const tag = node.ordered ? "ol" : "ul";
  let html = `  <${tag}>\n`;
  for (const item of node.items) {
    html += `    <li>${escapeHtml(item)}</li>\n`;
  }
  html += `  </${tag}>\n`;
  return html;
}

/**
 * Render scene break
 */
function renderSceneBreak(config: FormatConfig): string {
  const ornament = config.sceneBreaks?.ornament || "three-asterisks";
  const symbols: Record<string, string> = {
    "three-asterisks": "* * *",
    "three-dots": "...",
    "em-dash": "—",
    "three-dashes": "— — —",
    asterism: "⁂",
    dinkus: "# # #",
    blank: "",
  };
  const symbol = symbols[ornament] || "* * *";
  return `  <div class="scene-break">${escapeHtml(symbol)}</div>\n`;
}

/**
 * Render image
 */
function renderImage(
  node: ContentNode & { src: string; caption?: string }
): string {
  let html = '  <figure class="image">\n';
  html += `    <img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.caption || "")}" />\n`;
  if (node.caption) {
    html += `    <figcaption>${escapeHtml(node.caption)}</figcaption>\n`;
  }
  html += "  </figure>\n";
  return html;
}

/**
 * Render verse/poetry
 */
function renderVerse(node: VerseNode, _config: FormatConfig): string {
  let html = '  <div class="verse">\n';
  for (const line of node.lines) {
    html += `    <p class="verse-line">${escapeHtml(line)}</p>\n`;
  }
  html += "  </div>\n";
  return html;
}

/**
 * Render callout/aside
 */
function renderCallout(node: CalloutNode, config: FormatConfig): string {
  if (config.elements?.callout?.enabled === false) {
    // Render as plain paragraphs
    let html = "";
    for (const para of node.children) {
      html += `  <p class="paragraph">${renderTextNodes(para.children)}</p>\n`;
    }
    return html;
  }

  let html = '  <aside class="callout">\n';
  if (node.title) {
    html += `    <p class="callout-title">${escapeHtml(node.title)}</p>\n`;
  }
  for (const para of node.children) {
    html += `    <p>${renderTextNodes(para.children)}</p>\n`;
  }
  html += "  </aside>\n";
  return html;
}

/**
 * Render inline nodes with formatting (text and footnote refs)
 */
function renderTextNodes(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      // Handle footnote references
      if (node.type === "footnote-ref") {
        return `<sup class="footnote-ref"><a href="#note-${node.number}" id="ref-${node.number}">${node.number}</a></sup>`;
      }

      // Handle text nodes
      const textNode = node as TextNode;
      let content = escapeHtml(textNode.content);
      if (textNode.bold && textNode.italic) {
        content = `<strong><em>${content}</em></strong>`;
      } else if (textNode.bold) {
        content = `<strong>${content}</strong>`;
      } else if (textNode.italic) {
        content = `<em>${content}</em>`;
      }
      if (textNode.code) {
        content = `<code>${content}</code>`;
      }
      return content;
    })
    .join("");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
