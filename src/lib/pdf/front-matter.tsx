/**
 * Front Matter PDF Components
 *
 * React-PDF components for rendering front matter pages:
 * - Half title page
 * - Title page
 * - Copyright page
 * - Dedication page
 * - Epigraph page
 * - Table of contents
 */

import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FormatConfig } from "@/lib/format-schema";
import type { Chapter } from "./content-parser";
import { getFontWithFallback } from "./styles/fonts";
import { getPageDimensions, getMargins, parseToPoints } from "./styles/theme";

// =============================================================================
// Types
// =============================================================================

interface FrontMatterItem {
  type: string;
  [key: string]: unknown;
}

interface FrontMatterProps {
  items: FrontMatterItem[];
  config: FormatConfig;
  chapters: Chapter[];
}

interface PageProps {
  config: FormatConfig;
  item?: FrontMatterItem;
  chapters?: Chapter[];
}

// =============================================================================
// Styles
// =============================================================================

function createFrontMatterStyles(config: FormatConfig) {
  const typography = config.typography;
  const margins = getMargins(config);
  const { width, height } = getPageDimensions(config);

  const bodyFont = getFontWithFallback(typography?.body?.font || "Cormorant Garamond");
  const headingFont = getFontWithFallback(typography?.headings?.font || "Cinzel");
  const bodySize = parseToPoints(typography?.body?.size || "11pt");

  return StyleSheet.create({
    page: {
      width,
      height,
      fontFamily: bodyFont,
      fontSize: bodySize,
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.gutter,
      paddingRight: margins.outer,
    },

    // Centered page (for half title, dedication, epigraph)
    centeredPage: {
      width,
      height,
      fontFamily: bodyFont,
      fontSize: bodySize,
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.gutter,
      paddingRight: margins.outer,
      justifyContent: "center",
      alignItems: "center",
    },

    // Half title
    halfTitle: {
      fontFamily: headingFont,
      fontSize: bodySize * 2,
      textAlign: "center",
    },

    // Title page
    titleContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    titleSeriesName: {
      fontFamily: bodyFont,
      fontSize: bodySize * 0.9,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 24,
      textAlign: "center",
    },

    titleMain: {
      fontFamily: headingFont,
      fontSize: bodySize * 2.5,
      textAlign: "center",
      marginBottom: 12,
    },

    titleSubtitle: {
      fontFamily: bodyFont,
      fontSize: bodySize * 1.2,
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: 48,
    },

    titleAuthor: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.1,
      textAlign: "center",
      marginTop: 36,
    },

    // Copyright page
    copyrightContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingBottom: 48,
    },

    copyrightText: {
      fontSize: bodySize * 0.85,
      lineHeight: 1.6,
      marginBottom: 8,
    },

    copyrightSmall: {
      fontSize: bodySize * 0.75,
      lineHeight: 1.5,
      color: "#444",
    },

    // Dedication
    dedicationText: {
      fontFamily: bodyFont,
      fontSize: bodySize * 1.1,
      fontStyle: "italic",
      textAlign: "center",
      maxWidth: "70%",
    },

    // Epigraph
    epigraphContainer: {
      maxWidth: "70%",
      alignItems: "center",
    },

    epigraphQuote: {
      fontFamily: bodyFont,
      fontSize: bodySize * 1.1,
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: 16,
    },

    epigraphAttribution: {
      fontFamily: bodyFont,
      fontSize: bodySize * 0.95,
      textAlign: "center",
    },

    // Table of Contents
    tocTitle: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.5,
      textAlign: "center",
      marginBottom: 36,
      marginTop: 48,
    },

    tocEntry: {
      flexDirection: "row",
      marginBottom: 8,
      alignItems: "baseline",
    },

    tocChapterNumber: {
      width: 60,
      fontSize: bodySize * 0.9,
    },

    tocChapterTitle: {
      flex: 1,
      fontSize: bodySize,
    },

    tocPageNumber: {
      width: 30,
      fontSize: bodySize * 0.9,
      textAlign: "right",
    },

    tocDots: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomStyle: "dotted",
      borderBottomColor: "#ccc",
      marginHorizontal: 8,
      marginBottom: 4,
    },
  });
}

// =============================================================================
// Components
// =============================================================================

/**
 * Half Title Page - Book title only, centered
 */
function HalfTitlePage({ config }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const title = config.meta?.title || "Untitled";

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.centeredPage}>
      <Text style={styles.halfTitle}>{title}</Text>
    </Page>
  );
}

/**
 * Title Page - Full title, subtitle, author
 */
function TitlePage({ config, item }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const meta = config.meta;
  const includeSubtitle = (item?.includeSubtitle as boolean) ?? true;
  const includeAuthor = (item?.includeAuthor as boolean) ?? true;

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.page}>
      <View style={styles.titleContainer}>
        {/* Series name */}
        {meta?.series?.name && (
          <Text style={styles.titleSeriesName}>
            {meta.series.name}
            {meta.series.number ? ` · Book ${meta.series.number}` : ""}
          </Text>
        )}

        {/* Title */}
        <Text style={styles.titleMain}>{meta?.title || "Untitled"}</Text>

        {/* Subtitle */}
        {includeSubtitle && meta?.subtitle && (
          <Text style={styles.titleSubtitle}>{meta.subtitle}</Text>
        )}

        {/* Author */}
        {includeAuthor && meta?.author && (
          <Text style={styles.titleAuthor}>{meta.author}</Text>
        )}
      </View>
    </Page>
  );
}

/**
 * Copyright Page - Copyright notice, ISBN, edition info
 */
function CopyrightPage({ config, item }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const meta = config.meta;
  const template = (item?.template as string) || "fiction";
  const currentYear = new Date().getFullYear();

  // Generate copyright text based on template
  const getCopyrightText = () => {
    const author = meta?.author || "Author";

    if (template === "minimal") {
      return `Copyright © ${currentYear} ${author}\nAll rights reserved.`;
    }

    if (template === "nonfiction") {
      return `Copyright © ${currentYear} ${author}

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

The information in this book is provided for educational purposes only. The author and publisher are not responsible for any outcomes resulting from the use of this information.`;
    }

    // Fiction template (default)
    return `Copyright © ${currentYear} ${author}

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews.

This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.`;
  };

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.page}>
      <View style={styles.copyrightContainer}>
        <Text style={styles.copyrightText}>{getCopyrightText()}</Text>

        {meta?.isbn && (
          <Text style={styles.copyrightSmall}>ISBN: {meta.isbn}</Text>
        )}

        <Text style={styles.copyrightSmall}>
          First Edition
        </Text>
      </View>
    </Page>
  );
}

/**
 * Dedication Page - Centered dedication text
 */
function DedicationPage({ config, item }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const content = (item?.content as string) || "";

  if (!content) return null;

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.centeredPage}>
      <Text style={styles.dedicationText}>{content}</Text>
    </Page>
  );
}

/**
 * Epigraph Page - Opening quote with attribution
 */
function EpigraphPage({ config, item }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const quote = (item?.quote as string) || "";
  const attribution = (item?.attribution as string) || "";

  if (!quote) return null;

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.centeredPage}>
      <View style={styles.epigraphContainer}>
        <Text style={styles.epigraphQuote}>&ldquo;{quote}&rdquo;</Text>
        {attribution && (
          <Text style={styles.epigraphAttribution}>— {attribution}</Text>
        )}
      </View>
    </Page>
  );
}

/**
 * Table of Contents Page - Auto-generated from chapters
 */
function TableOfContentsPage({ config, chapters }: PageProps) {
  const styles = createFrontMatterStyles(config);
  const chapterConfig = config.chapters;

  if (!chapters || chapters.length === 0) return null;

  return (
    <Page size={{ width: styles.page.width, height: styles.page.height }} style={styles.page}>
      <Text style={styles.tocTitle}>Contents</Text>

      {chapters.map((chapter, index) => (
        <View key={index} style={styles.tocEntry}>
          {chapterConfig?.numbering?.enabled && (
            <Text style={styles.tocChapterNumber}>
              {formatTocNumber(chapter.number, chapterConfig.numbering.format)}
            </Text>
          )}
          <Text style={styles.tocChapterTitle}>{chapter.title}</Text>
          <View style={styles.tocDots} />
          <Text style={styles.tocPageNumber}>{index + 1}</Text>
        </View>
      ))}
    </Page>
  );
}

/**
 * Format chapter number for TOC
 */
function formatTocNumber(num: number, format?: string): string {
  if (!format) return String(num);

  if (format.includes("{roman}")) {
    return toRomanLower(num);
  }
  if (format.includes("{n}")) {
    return String(num);
  }
  return String(num);
}

/**
 * Convert to lowercase roman numerals
 */
function toRomanLower(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
    [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
    [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];

  let result = "";
  let remaining = num;

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Renders all front matter pages based on configuration
 */
export function FrontMatter({ items, config, chapters }: FrontMatterProps) {
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item, index) => {
        switch (item.type) {
          case "halfTitle":
            return <HalfTitlePage key={index} config={config} />;
          case "title":
            return <TitlePage key={index} config={config} item={item} />;
          case "copyright":
            return <CopyrightPage key={index} config={config} item={item} />;
          case "dedication":
            return <DedicationPage key={index} config={config} item={item} />;
          case "epigraph":
            return <EpigraphPage key={index} config={config} item={item} />;
          case "toc":
            return <TableOfContentsPage key={index} config={config} chapters={chapters} />;
          default:
            return null;
        }
      })}
    </>
  );
}

export {
  HalfTitlePage,
  TitlePage,
  CopyrightPage,
  DedicationPage,
  EpigraphPage,
  TableOfContentsPage,
};
