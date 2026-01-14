/**
 * ePub Front Matter Templates
 *
 * XHTML templates for front matter pages in ePub format.
 */

import type { FormatConfig } from "@/lib/format-schema";
import type { Chapter } from "@/lib/pdf/content-parser";

interface FrontMatterItem {
  type: string;
  [key: string]: unknown;
}

export interface EpubChapter {
  title: string;
  content: string;
  excludeFromToc?: boolean;
  beforeToc?: boolean;
  filename?: string;
}

/**
 * Generate front matter chapters for ePub
 */
export function generateFrontMatter(
  items: FrontMatterItem[],
  config: FormatConfig,
  chapters: Chapter[]
): EpubChapter[] {
  const result: EpubChapter[] = [];

  for (const item of items) {
    const chapter = generateFrontMatterPage(item, config, chapters);
    if (chapter) {
      result.push(chapter);
    }
  }

  return result;
}

function generateFrontMatterPage(
  item: FrontMatterItem,
  config: FormatConfig,
  chapters: Chapter[]
): EpubChapter | null {
  switch (item.type) {
    case "halfTitle":
      return generateHalfTitle(config);
    case "title":
      return generateTitlePage(config, item);
    case "copyright":
      return generateCopyright(config, item);
    case "dedication":
      return generateDedication(item);
    case "epigraph":
      return generateEpigraph(item);
    case "toc":
      return generateTableOfContents(config, chapters);
    default:
      return null;
  }
}

function generateHalfTitle(config: FormatConfig): EpubChapter {
  const title = config.meta?.title || "Untitled";
  return {
    title: "Half Title",
    filename: "half-title.xhtml",
    excludeFromToc: true,
    beforeToc: true,
    content: `
<section class="half-title">
  <h1 class="half-title-text">${escapeHtml(title)}</h1>
</section>
    `.trim(),
  };
}

function generateTitlePage(config: FormatConfig, item: FrontMatterItem): EpubChapter {
  const meta = config.meta;
  const includeSubtitle = (item.includeSubtitle as boolean) ?? true;
  const includeAuthor = (item.includeAuthor as boolean) ?? true;

  let content = '<section class="title-page">\n';

  // Series info
  if (meta?.series?.name) {
    content += `  <p class="series-name">${escapeHtml(meta.series.name)}`;
    if (meta.series.number) {
      content += ` &middot; Book ${meta.series.number}`;
    }
    content += "</p>\n";
  }

  // Title
  content += `  <h1 class="main-title">${escapeHtml(meta?.title || "Untitled")}</h1>\n`;

  // Subtitle
  if (includeSubtitle && meta?.subtitle) {
    content += `  <p class="subtitle">${escapeHtml(meta.subtitle)}</p>\n`;
  }

  // Author
  if (includeAuthor && meta?.author) {
    content += `  <p class="author">${escapeHtml(meta.author)}</p>\n`;
  }

  content += "</section>";

  return {
    title: "Title Page",
    filename: "title.xhtml",
    excludeFromToc: true,
    beforeToc: true,
    content,
  };
}

function generateCopyright(config: FormatConfig, item: FrontMatterItem): EpubChapter {
  const meta = config.meta;
  const template = (item.template as string) || "fiction";
  const currentYear = new Date().getFullYear();
  const author = meta?.author || "Author";

  let copyrightText: string;

  if (template === "minimal") {
    copyrightText = `Copyright &copy; ${currentYear} ${escapeHtml(author)}<br/>All rights reserved.`;
  } else if (template === "nonfiction") {
    copyrightText = `
Copyright &copy; ${currentYear} ${escapeHtml(author)}<br/><br/>
All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.<br/><br/>
The information in this book is provided for educational purposes only. The author and publisher are not responsible for any outcomes resulting from the use of this information.
    `.trim();
  } else {
    copyrightText = `
Copyright &copy; ${currentYear} ${escapeHtml(author)}<br/><br/>
All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews.<br/><br/>
This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.
    `.trim();
  }

  let content = '<section class="copyright">\n';
  content += `  <p class="copyright-text">${copyrightText}</p>\n`;

  if (meta?.isbn) {
    content += `  <p class="isbn">ISBN: ${escapeHtml(meta.isbn)}</p>\n`;
  }

  content += '  <p class="edition">First Edition</p>\n';
  content += "</section>";

  return {
    title: "Copyright",
    filename: "copyright.xhtml",
    excludeFromToc: true,
    beforeToc: true,
    content,
  };
}

function generateDedication(item: FrontMatterItem): EpubChapter | null {
  const text = item.content as string;
  if (!text) return null;

  return {
    title: "Dedication",
    filename: "dedication.xhtml",
    excludeFromToc: true,
    beforeToc: true,
    content: `
<section class="dedication">
  <p class="dedication-text">${escapeHtml(text)}</p>
</section>
    `.trim(),
  };
}

function generateEpigraph(item: FrontMatterItem): EpubChapter | null {
  const quote = item.quote as string;
  if (!quote) return null;

  const attribution = item.attribution as string;

  let content = '<section class="epigraph">\n';
  content += `  <blockquote class="epigraph-quote">&ldquo;${escapeHtml(quote)}&rdquo;</blockquote>\n`;
  if (attribution) {
    content += `  <p class="epigraph-attribution">&mdash; ${escapeHtml(attribution)}</p>\n`;
  }
  content += "</section>";

  return {
    title: "Epigraph",
    filename: "epigraph.xhtml",
    excludeFromToc: true,
    beforeToc: true,
    content,
  };
}

function generateTableOfContents(
  config: FormatConfig,
  chapters: Chapter[]
): EpubChapter {
  const chapterConfig = config.chapters;

  let content = '<section class="toc">\n';
  content += '  <h1 class="toc-title">Contents</h1>\n';
  content += '  <nav class="toc-list">\n';

  for (const chapter of chapters) {
    const chapterNum = chapterConfig?.numbering?.enabled
      ? `${chapter.number}. `
      : "";
    content += `    <p class="toc-entry"><a href="chapter-${chapter.number}.xhtml">${chapterNum}${escapeHtml(chapter.title)}</a></p>\n`;
  }

  content += "  </nav>\n";
  content += "</section>";

  return {
    title: "Contents",
    filename: "toc.xhtml",
    beforeToc: true,
    content,
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
