/**
 * Theme Styles for React-PDF
 *
 * Maps FormatConfig to React-PDF StyleSheet definitions.
 */

import { StyleSheet } from "@react-pdf/renderer";
import type { FormatConfig } from "@/lib/format-schema";
import { getFontWithFallback } from "./fonts";

/**
 * Parse dimension string to points
 * Supports: pt, in, cm, mm, px, em
 */
export function parseToPoints(value: string): number {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return 0;

  if (value.endsWith("in")) return num * 72;
  if (value.endsWith("cm")) return num * 28.35;
  if (value.endsWith("mm")) return num * 2.835;
  if (value.endsWith("pt")) return num;
  if (value.endsWith("px")) return num * 0.75;
  if (value.endsWith("em")) return num * 12; // Approximate
  if (value.endsWith("%")) return num; // Pass through for percentage

  // Default to points
  return num;
}

/**
 * Get page dimensions from size preset or custom values
 */
export function getPageDimensions(config: FormatConfig): {
  width: number;
  height: number;
} {
  const page = config.page;
  if (!page) {
    return { width: 432, height: 648 }; // 6x9 default
  }

  // Handle preset sizes
  const presets: Record<string, { width: number; height: number }> = {
    "6x9": { width: 432, height: 648 },
    "5.5x8.5": { width: 396, height: 612 },
    "5x8": { width: 360, height: 576 },
    A5: { width: 420, height: 595 },
    letter: { width: 612, height: 792 },
  };

  if (page.size && presets[page.size]) {
    return presets[page.size];
  }

  // Custom dimensions
  return {
    width: parseToPoints(page.width || "6in"),
    height: parseToPoints(page.height || "9in"),
  };
}

/**
 * Get margin values from config
 */
export function getMargins(config: FormatConfig): {
  top: number;
  bottom: number;
  outer: number;
  gutter: number;
} {
  const margins = config.page?.margins;
  if (!margins) {
    return {
      top: 54, // 0.75in
      bottom: 54,
      outer: 45, // 0.625in
      gutter: 63, // 0.875in
    };
  }

  return {
    top: parseToPoints(margins.top || "0.75in"),
    bottom: parseToPoints(margins.bottom || "0.75in"),
    outer: parseToPoints(margins.outer || "0.625in"),
    gutter: parseToPoints(margins.gutter || "0.875in"),
  };
}

/**
 * Create React-PDF styles from FormatConfig
 */
export function createStyles(config: FormatConfig) {
  const typography = config.typography;
  const chapters = config.chapters;
  const dropCaps = config.dropCaps;
  const margins = getMargins(config);
  const { width, height } = getPageDimensions(config);

  const bodyFont = getFontWithFallback(typography?.body?.font || "Cormorant Garamond");
  const headingFont = getFontWithFallback(typography?.headings?.font || "Cinzel");
  const bodySize = parseToPoints(typography?.body?.size || "11pt");
  const lineHeight = typography?.body?.lineHeight || 1.5;

  const chapterTitleSize = parseToPoints(chapters?.title?.size || "24pt");
  const chapterTitleAlign = chapters?.title?.align || "center";
  const chapterTitleTransform = chapters?.title?.transform || "uppercase";

  return StyleSheet.create({
    // Page styles
    page: {
      width,
      height,
      fontFamily: bodyFont,
      fontSize: bodySize,
      lineHeight,
    },

    // Left page (even) - gutter on right
    pageLeft: {
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.outer,
      paddingRight: margins.gutter,
    },

    // Right page (odd) - gutter on left
    pageRight: {
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.gutter,
      paddingRight: margins.outer,
    },

    // Chapter title page
    chapterTitlePage: {
      justifyContent: "center",
      alignItems: chapterTitleAlign === "center" ? "center" : "flex-start",
      paddingTop: height * 0.3, // Start 30% down the page
    },

    // Chapter numbering
    chapterNumber: {
      fontFamily: headingFont,
      fontSize: bodySize,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 12,
      textAlign: chapterTitleAlign,
    },

    // Chapter title
    chapterTitle: {
      fontFamily: headingFont,
      fontSize: chapterTitleSize,
      textTransform: chapterTitleTransform,
      textAlign: chapterTitleAlign,
      marginBottom: 8,
    },

    // Chapter subtitle
    chapterSubtitle: {
      fontFamily: bodyFont,
      fontSize: bodySize * 1.1,
      fontStyle: chapters?.subtitle?.style === "italic" ? "italic" : "normal",
      textAlign: chapterTitleAlign,
      marginBottom: 24,
    },

    // Chapter ornament
    chapterOrnament: {
      width: 40,
      height: 20,
      marginTop: 16,
      marginBottom: 24,
    },

    // Body content container
    content: {
      flex: 1,
    },

    // Paragraph
    paragraph: {
      textIndent: parseToPoints(typography?.paragraph?.indent || "1.5em"),
      marginBottom: parseToPoints(typography?.paragraph?.spacing || "0"),
      textAlign: "justify",
    },

    // First paragraph (no indent)
    paragraphFirst: {
      textIndent: typography?.paragraph?.firstParagraphIndent
        ? parseToPoints(typography?.paragraph?.indent || "1.5em")
        : 0,
      marginBottom: parseToPoints(typography?.paragraph?.spacing || "0"),
      textAlign: "justify",
    },

    // Drop cap container
    dropCapContainer: {
      flexDirection: "row",
      marginBottom: 4,
    },

    // Drop cap letter
    dropCap: {
      fontFamily: getFontWithFallback(dropCaps?.font || headingFont),
      fontSize: bodySize * (dropCaps?.lines || 3) * 1.2,
      lineHeight: 1,
      marginRight: 4,
      marginTop: -2,
    },

    // Drop cap text (text after the drop cap)
    dropCapText: {
      flex: 1,
      textAlign: "justify",
    },

    // Scene break
    sceneBreak: {
      textAlign: "center",
      marginVertical: parseToPoints(config.sceneBreaks?.spacing || "2em"),
      fontSize: bodySize,
    },

    // Blockquote
    blockquote: {
      marginLeft: parseToPoints(config.elements?.blockquote?.indent || "2em"),
      marginRight: parseToPoints(config.elements?.blockquote?.indent || "2em"),
      fontStyle:
        config.elements?.blockquote?.style === "italic" ? "italic" : "normal",
      marginVertical: 12,
    },

    // Headings within chapters
    heading2: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.4,
      marginTop: 24,
      marginBottom: 12,
    },

    heading3: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.2,
      marginTop: 18,
      marginBottom: 8,
    },

    heading4: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.1,
      fontWeight: "bold",
      marginTop: 12,
      marginBottom: 6,
    },

    // List
    list: {
      marginLeft: 24,
      marginVertical: 8,
    },

    listItem: {
      flexDirection: "row",
      marginBottom: 4,
    },

    listBullet: {
      width: 16,
    },

    listContent: {
      flex: 1,
    },

    // Inline text styles
    bold: {
      fontWeight: "bold",
    },

    italic: {
      fontStyle: "italic",
    },

    code: {
      fontFamily: "Courier",
      backgroundColor: "#f5f5f5",
      paddingHorizontal: 2,
    },

    // Header (running head)
    header: {
      position: "absolute",
      top: margins.top / 2,
      left: margins.outer,
      right: margins.outer,
      fontSize: parseToPoints(config.headers?.size || "9pt"),
      fontFamily: bodyFont,
      textTransform: config.headers?.transform || "uppercase",
      flexDirection: "row",
      justifyContent: "space-between",
    },

    headerLeft: {
      textAlign: "left",
    },

    headerRight: {
      textAlign: "right",
    },

    // Footer (page number)
    footer: {
      position: "absolute",
      bottom: margins.bottom / 2,
      left: 0,
      right: 0,
      fontSize: bodySize * 0.9,
      textAlign: config.footers?.pageNumber?.position || "center",
    },

    // Image
    image: {
      maxWidth: "80%",
      marginVertical: 12,
      alignSelf: "center",
    },

    imageCaption: {
      fontSize: parseToPoints(config.images?.caption?.size || "9pt"),
      fontStyle:
        config.images?.caption?.style === "italic" ? "italic" : "normal",
      textAlign: "center",
      marginTop: 4,
    },

    // Verse/Poetry
    verse: {
      marginVertical: 16,
      marginHorizontal: 24,
      fontStyle: config.elements?.verse?.style === "italic" ? "italic" : "normal",
      textAlign: config.elements?.verse?.align || "left",
    },

    // Callout boxes
    callout: {
      marginVertical: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: "#000",
      borderStyle: "solid",
      backgroundColor: config.elements?.callout?.background || "#f5f5f5",
    },

    calloutTitle: {
      fontWeight: "bold",
      fontSize: bodySize,
      marginBottom: 6,
      textTransform: "uppercase",
    },

    // Footnote reference (superscript number)
    footnoteRef: {
      fontSize: bodySize * 0.65,
      verticalAlign: "super",
      lineHeight: 0,
    },
  });
}

export type BookStyles = ReturnType<typeof createStyles>;
