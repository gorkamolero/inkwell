/**
 * ePub Back Matter Templates
 *
 * XHTML templates for back matter pages in ePub format.
 */

import type { FormatConfig } from "@/lib/format-schema";

interface BackMatterItem {
  type: string;
  [key: string]: unknown;
}

interface BookReference {
  title: string;
  link?: string;
}

export interface EpubChapter {
  title: string;
  content: string;
  filename?: string;
}

/**
 * Generate back matter chapters for ePub
 */
export function generateBackMatter(
  items: BackMatterItem[],
  config: FormatConfig
): EpubChapter[] {
  const result: EpubChapter[] = [];

  for (const item of items) {
    const chapter = generateBackMatterPage(item, config);
    if (chapter) {
      result.push(chapter);
    }
  }

  return result;
}

function generateBackMatterPage(
  item: BackMatterItem,
  config: FormatConfig
): EpubChapter | null {
  switch (item.type) {
    case "epilogue":
      return generateEpilogue(item);
    case "acknowledgements":
      return generateAcknowledgements(item);
    case "aboutAuthor":
      return generateAboutAuthor(item, config);
    case "alsoBy":
      return generateAlsoBy(item, config);
    case "glossary":
      return generateGlossary(item);
    case "appendix":
      return generateAppendix(item);
    default:
      return null;
  }
}

function generateEpilogue(item: BackMatterItem): EpubChapter | null {
  const content = item.content as string;
  if (!content) return null;

  const paragraphs = content.split("\n\n").filter(Boolean);

  let html = '<section class="epilogue">\n';
  html += '  <h1 class="section-title">Epilogue</h1>\n';
  for (const para of paragraphs) {
    html += `  <p>${escapeHtml(para)}</p>\n`;
  }
  html += "</section>";

  return {
    title: "Epilogue",
    filename: "epilogue.xhtml",
    content: html,
  };
}

function generateAcknowledgements(item: BackMatterItem): EpubChapter {
  const content = (item.content as string) || "";
  const paragraphs = content.split("\n\n").filter(Boolean);

  let html = '<section class="acknowledgements">\n';
  html += '  <h1 class="section-title">Acknowledgements</h1>\n';

  if (paragraphs.length > 0) {
    for (const para of paragraphs) {
      html += `  <p>${escapeHtml(para)}</p>\n`;
    }
  } else {
    html += "  <p>The author would like to thank everyone who made this book possible.</p>\n";
  }

  html += "</section>";

  return {
    title: "Acknowledgements",
    filename: "acknowledgements.xhtml",
    content: html,
  };
}

function generateAboutAuthor(item: BackMatterItem, config: FormatConfig): EpubChapter {
  const content = (item.content as string) || "";
  const authorName = config.meta?.author || "The Author";
  const paragraphs = content.split("\n\n").filter(Boolean);

  let html = '<section class="about-author">\n';
  html += '  <h1 class="section-title">About the Author</h1>\n';

  if (paragraphs.length > 0) {
    for (const para of paragraphs) {
      html += `  <p class="author-bio">${escapeHtml(para)}</p>\n`;
    }
  } else {
    html += `  <p class="author-bio">${escapeHtml(authorName)} is the author of this book.</p>\n`;
  }

  html += "</section>";

  return {
    title: "About the Author",
    filename: "about-author.xhtml",
    content: html,
  };
}

function generateAlsoBy(item: BackMatterItem, config: FormatConfig): EpubChapter {
  const books = (item.books as BookReference[]) || [];
  const authorName = config.meta?.author || "This Author";

  let html = '<section class="also-by">\n';
  html += `  <h1 class="section-title">Also By ${escapeHtml(authorName)}</h1>\n`;
  html += '  <div class="book-list">\n';

  if (books.length > 0) {
    for (const book of books) {
      if (book.link) {
        html += `    <p class="book-title"><a href="${escapeHtml(book.link)}">${escapeHtml(book.title)}</a></p>\n`;
      } else {
        html += `    <p class="book-title">${escapeHtml(book.title)}</p>\n`;
      }
    }
  } else {
    html += "    <p>More books coming soon.</p>\n";
  }

  html += "  </div>\n";
  html += "</section>";

  return {
    title: `Also By ${authorName}`,
    filename: "also-by.xhtml",
    content: html,
  };
}

function generateGlossary(item: BackMatterItem): EpubChapter {
  const content = (item.content as string) || "";

  // Parse glossary entries (format: "Term: Definition" per line)
  const entries = content
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        return {
          term: line.substring(0, colonIndex).trim(),
          definition: line.substring(colonIndex + 1).trim(),
        };
      }
      return { term: line, definition: "" };
    });

  let html = '<section class="glossary">\n';
  html += '  <h1 class="section-title">Glossary</h1>\n';
  html += '  <dl class="glossary-list">\n';

  for (const entry of entries) {
    html += `    <dt class="glossary-term">${escapeHtml(entry.term)}</dt>\n`;
    if (entry.definition) {
      html += `    <dd class="glossary-definition">${escapeHtml(entry.definition)}</dd>\n`;
    }
  }

  html += "  </dl>\n";
  html += "</section>";

  return {
    title: "Glossary",
    filename: "glossary.xhtml",
    content: html,
  };
}

function generateAppendix(item: BackMatterItem): EpubChapter {
  const title = (item.title as string) || "Appendix";
  const content = (item.content as string) || "";
  const paragraphs = content.split("\n\n").filter(Boolean);

  let html = '<section class="appendix">\n';
  html += `  <h1 class="section-title">${escapeHtml(title)}</h1>\n`;

  for (const para of paragraphs) {
    html += `  <p>${escapeHtml(para)}</p>\n`;
  }

  html += "</section>";

  return {
    title,
    filename: "appendix.xhtml",
    content: html,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
