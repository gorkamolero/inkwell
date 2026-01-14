/**
 * ePub CSS Theme Generator
 *
 * Converts FormatConfig to CSS for ePub styling.
 */

import type { FormatConfig } from "@/lib/format-schema";

/**
 * Generate CSS stylesheet from format config
 */
export function generateEpubCSS(config: FormatConfig): string {
  const typography = config.typography;
  const chapters = config.chapters;
  const dropCaps = config.dropCaps;
  const elements = config.elements;
  const sceneBreaks = config.sceneBreaks;

  // Font stacks (ePub readers have limited font support)
  const bodyFont = getFontStack(typography?.body?.font || "Georgia");
  const headingFont = getFontStack(typography?.headings?.font || "Georgia");

  const bodySize = typography?.body?.size || "1em";
  const lineHeight = typography?.body?.lineHeight || 1.5;
  const paragraphIndent = typography?.paragraph?.indent || "1.5em";

  return `
/* Base Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Body */
body {
  font-family: ${bodyFont};
  font-size: ${bodySize};
  line-height: ${lineHeight};
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
}

/* Paragraphs */
p {
  margin: 0;
  text-indent: ${paragraphIndent};
}

p.first-paragraph,
section > p:first-of-type {
  text-indent: 0;
}

/* Drop Caps */
.dropcap {
  float: left;
  font-size: ${(dropCaps?.lines || 3) * 1.5}em;
  line-height: 0.8;
  padding-right: 0.1em;
  font-family: ${headingFont};
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: ${headingFont};
  margin: 1em 0 0.5em;
  text-align: left;
}

/* Chapter Styling */
.chapter {
  page-break-before: always;
}

.chapter-number {
  font-family: ${headingFont};
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-align: center;
  margin-bottom: 0.5em;
  text-indent: 0;
}

.chapter-title {
  font-family: ${headingFont};
  font-size: ${chapters?.title?.size || "1.5em"};
  text-align: ${chapters?.title?.align || "center"};
  text-transform: ${chapters?.title?.transform || "none"};
  margin-bottom: 1em;
}

.chapter-subtitle {
  font-style: italic;
  text-align: center;
  margin-bottom: 1.5em;
  text-indent: 0;
}

.chapter-ornament {
  text-align: center;
  margin: 1em 0 2em;
}

/* Scene Breaks */
.scene-break {
  text-align: center;
  margin: ${sceneBreaks?.spacing || "2em"} 0;
  text-indent: 0;
}

/* Blockquotes */
blockquote {
  margin: 1em ${elements?.blockquote?.indent || "2em"};
  font-style: ${elements?.blockquote?.style || "italic"};
}

blockquote p {
  text-indent: 0;
}

/* Verse/Poetry */
.verse {
  margin: 1em 2em;
  font-style: ${elements?.verse?.style || "italic"};
  text-align: ${elements?.verse?.align || "left"};
}

.verse-line {
  text-indent: 0;
  margin-bottom: 0.25em;
}

/* Lists */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin-bottom: 0.5em;
}

/* Code */
code {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
  background-color: #f5f5f5;
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

/* Images */
.image {
  text-align: center;
  margin: 1.5em 0;
}

.image img {
  max-width: 100%;
  height: auto;
}

.image figcaption {
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5em;
  text-indent: 0;
}

/* Callouts */
.callout {
  margin: 1em 0;
  padding: 1em;
  background-color: #f9f9f9;
  border-left: 3px solid #ccc;
}

.callout-title {
  font-weight: bold;
  margin-bottom: 0.5em;
  text-indent: 0;
}

.callout p {
  text-indent: 0;
}

/* Front Matter */
.half-title,
.title-page,
.dedication,
.epigraph {
  page-break-before: always;
  text-align: center;
  padding-top: 30%;
}

.half-title-text {
  font-family: ${headingFont};
  font-size: 2em;
}

.series-name {
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 1.5em;
  text-indent: 0;
}

.main-title {
  font-family: ${headingFont};
  font-size: 2.5em;
  margin-bottom: 0.5em;
}

.subtitle {
  font-style: italic;
  font-size: 1.2em;
  margin-bottom: 2em;
  text-indent: 0;
}

.author {
  font-family: ${headingFont};
  font-size: 1.1em;
  text-indent: 0;
}

.dedication-text {
  font-style: italic;
  font-size: 1.1em;
  max-width: 70%;
  margin: 0 auto;
  text-indent: 0;
}

.epigraph-quote {
  font-style: italic;
  font-size: 1.1em;
  margin-bottom: 1em;
}

.epigraph-attribution {
  font-size: 0.95em;
  text-indent: 0;
}

/* Copyright */
.copyright {
  page-break-before: always;
  font-size: 0.85em;
  padding-top: 60%;
}

.copyright p {
  text-indent: 0;
  margin-bottom: 0.5em;
}

.isbn, .edition {
  color: #666;
  font-size: 0.9em;
}

/* Table of Contents */
.toc {
  page-break-before: always;
}

.toc-title {
  font-family: ${headingFont};
  font-size: 1.5em;
  text-align: center;
  margin-bottom: 1.5em;
}

.toc-entry {
  text-indent: 0;
  margin-bottom: 0.5em;
}

.toc-entry a {
  text-decoration: none;
  color: inherit;
}

/* Back Matter */
.section-title {
  font-family: ${headingFont};
  font-size: 1.5em;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1.5em;
}

.author-bio {
  text-align: center;
  text-indent: 0;
  margin-bottom: 1em;
}

.book-list {
  text-align: center;
}

.book-title {
  font-style: italic;
  margin-bottom: 0.5em;
  text-indent: 0;
}

.glossary-list {
  margin: 0;
}

.glossary-term {
  font-weight: bold;
  margin-top: 1em;
}

.glossary-definition {
  margin-left: 1.5em;
}
`.trim();
}

/**
 * Get font stack with fallbacks
 */
function getFontStack(fontName: string): string {
  const fontStacks: Record<string, string> = {
    "Cormorant Garamond": '"Cormorant Garamond", Garamond, "Times New Roman", serif',
    Cinzel: 'Cinzel, "Times New Roman", serif',
    "EB Garamond": '"EB Garamond", Garamond, "Times New Roman", serif',
    "Libre Baskerville": '"Libre Baskerville", Baskerville, "Times New Roman", serif',
    "Source Serif Pro": '"Source Serif Pro", Georgia, serif',
    "Crimson Pro": '"Crimson Pro", Georgia, serif',
    Lora: 'Lora, Georgia, serif',
    Merriweather: 'Merriweather, Georgia, serif',
    "Playfair Display": '"Playfair Display", Georgia, serif',
    Inter: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    Georgia: 'Georgia, "Times New Roman", serif',
  };

  return fontStacks[fontName] || `"${fontName}", Georgia, serif`;
}
