/**
 * BookDocument - Main React-PDF Document Component
 *
 * Renders a complete book from parsed content and format config.
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import type { FormatConfig } from "@/lib/format-schema";
import type {
  ParsedDocument,
  Chapter,
  ContentNode,
  ParagraphNode,
  TextNode,
  VerseNode,
  CalloutNode,
} from "./content-parser";
import { getDropCapLetter, getTextAfterDropCap } from "./content-parser";
import { FrontMatter } from "./front-matter";
import { BackMatter } from "./back-matter";
import { SceneBreakOrnament, ChapterOrnament } from "./ornaments";
import { registerFonts } from "./styles/fonts";
import { createStyles, getPageDimensions, type BookStyles } from "./styles/theme";

// Ensure fonts are registered
registerFonts();

interface BookDocumentProps {
  content: ParsedDocument;
  config: FormatConfig;
}

/**
 * Main book document component
 */
export function BookDocument({ content, config }: BookDocumentProps) {
  const styles = createStyles(config);
  const { width, height } = getPageDimensions(config);

  // Get front and back matter items from config
  const frontMatterItems = (config.frontMatter as Array<{ type: string; [key: string]: unknown }>) || [];
  const backMatterItems = (config.backMatter as Array<{ type: string; [key: string]: unknown }>) || [];

  // Track page numbers (front matter uses roman numerals, main content uses arabic)
  // TODO: Implement proper page counting across sections
  const startPageNumber = 1;

  return (
    <Document
      title={content.title || config.meta?.title || "Untitled"}
      author={config.meta?.author}
      subject={config.meta?.description}
      keywords={config.meta?.tags?.join(", ")}
    >
      {/* Front Matter */}
      <FrontMatter
        items={frontMatterItems}
        config={config}
        chapters={content.chapters}
      />

      {/* Main Content - Chapters */}
      {content.chapters.map((chapter, chapterIndex) => (
        <ChapterPages
          key={chapterIndex}
          chapter={chapter}
          styles={styles}
          config={config}
          width={width}
          height={height}
          startPageNumber={startPageNumber + chapterIndex * 2}
        />
      ))}

      {/* Back Matter */}
      <BackMatter
        items={backMatterItems}
        config={config}
      />
    </Document>
  );
}

interface ChapterPagesProps {
  chapter: Chapter;
  styles: BookStyles;
  config: FormatConfig;
  width: number;
  height: number;
  startPageNumber: number;
}

/**
 * Renders all pages for a single chapter
 */
function ChapterPages({
  chapter,
  styles,
  config,
  width,
  height,
  startPageNumber,
}: ChapterPagesProps) {
  const chapters = config.chapters;
  const headers = config.headers;
  const footers = config.footers;

  return (
    <>
      {/* Chapter title page */}
      <Page
        size={{ width, height }}
        style={[styles.page, styles.pageRight, styles.chapterTitlePage]}
      >
        {/* Chapter numbering */}
        {chapters?.numbering?.enabled && (
          <Text style={styles.chapterNumber}>
            {formatChapterNumber(chapter.number, chapters.numbering.format)}
          </Text>
        )}

        {/* Chapter title */}
        <Text style={styles.chapterTitle}>{chapter.title}</Text>

        {/* Chapter subtitle */}
        {chapter.subtitle && chapters?.subtitle?.enabled && (
          <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
        )}

        {/* Chapter ornament */}
        {chapters?.ornament?.enabled && (
          <ChapterOrnament
            type={chapters.ornament.image || "flourish-01"}
            width={60}
            height={20}
          />
        )}
      </Page>

      {/* Content pages */}
      <Page
        size={{ width, height }}
        style={[styles.page, styles.pageLeft]}
      >
        {/* Header */}
        {headers?.enabled && !headers?.hideOnChapterStart && (
          <Header
            config={config}
            styles={styles}
            pageNumber={startPageNumber + 1}
            isLeftPage={true}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {chapter.content.map((node, nodeIndex) => (
            <ContentNodeComponent
              key={nodeIndex}
              node={node}
              styles={styles}
              config={config}
              isFirstNode={nodeIndex === 0}
            />
          ))}
        </View>

        {/* Footer with page number */}
        {footers?.enabled && (
          <Footer
            config={config}
            styles={styles}
            pageNumber={startPageNumber + 1}
          />
        )}
      </Page>
    </>
  );
}

interface ContentNodeComponentProps {
  node: ContentNode;
  styles: BookStyles;
  config: FormatConfig;
  isFirstNode: boolean;
}

/**
 * Renders a single content node (paragraph, heading, etc.)
 */
function ContentNodeComponent({
  node,
  styles,
  config,
  isFirstNode,
}: ContentNodeComponentProps) {
  const dropCaps = config.dropCaps;

  switch (node.type) {
    case "paragraph": {
      const paragraph = node as ParagraphNode;
      const shouldDropCap =
        dropCaps?.enabled &&
        (paragraph.isFirstInChapter || paragraph.isFirstAfterSceneBreak);

      if (shouldDropCap) {
        const dropCapLetter = getDropCapLetter(paragraph);
        const restOfText = getTextAfterDropCap(paragraph);

        return (
          <View style={styles.dropCapContainer}>
            <Text style={styles.dropCap}>{dropCapLetter}</Text>
            <Text style={styles.dropCapText}>
              {restOfText.map((textNode, i) => (
                <TextNodeComponent key={i} node={textNode} styles={styles} />
              ))}
            </Text>
          </View>
        );
      }

      return (
        <Text
          style={
            isFirstNode || paragraph.isFirstInChapter
              ? styles.paragraphFirst
              : styles.paragraph
          }
        >
          {paragraph.children.map((textNode, i) => (
            <TextNodeComponent key={i} node={textNode} styles={styles} />
          ))}
        </Text>
      );
    }

    case "heading": {
      const headingStyle =
        node.level === 2
          ? styles.heading2
          : node.level === 3
            ? styles.heading3
            : styles.heading4;

      return <Text style={headingStyle}>{node.content}</Text>;
    }

    case "blockquote": {
      return (
        <View style={styles.blockquote}>
          {node.children.map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para.children.map((textNode, j) => (
                <TextNodeComponent key={j} node={textNode} styles={styles} />
              ))}
            </Text>
          ))}
        </View>
      );
    }

    case "list": {
      return (
        <View style={styles.list}>
          {node.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>
                {node.ordered ? `${i + 1}.` : "•"}
              </Text>
              <Text style={styles.listContent}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    case "scene-break": {
      const ornamentType = config.sceneBreaks?.ornament || "three-asterisks";
      const spacing = config.sceneBreaks?.spacing
        ? parseFloat(config.sceneBreaks.spacing) * 12
        : 24;
      return (
        <SceneBreakOrnament
          type={ornamentType}
          spacing={spacing}
        />
      );
    }

    case "image": {
      return (
        <View>
          <Image src={node.src} style={styles.image} />
          {node.caption && (
            <Text style={styles.imageCaption}>{node.caption}</Text>
          )}
        </View>
      );
    }

    case "verse": {
      const verseNode = node as VerseNode;
      const verseStyle = config.elements?.verse;
      return (
        <View style={styles.verse}>
          {verseNode.lines.map((line, i) => (
            <Text
              key={i}
              style={{
                fontStyle: verseStyle?.style === "italic" ? "italic" : "normal",
                textAlign: (verseStyle?.align as "left" | "center" | "right") || "left",
                marginBottom: 2,
              }}
            >
              {line}
            </Text>
          ))}
        </View>
      );
    }

    case "callout": {
      const calloutNode = node as CalloutNode;
      const calloutStyle = config.elements?.callout;
      if (calloutStyle?.enabled === false) {
        // If callouts are disabled, render as plain paragraphs
        return (
          <View>
            {calloutNode.children.map((para, i) => (
              <Text key={i} style={styles.paragraph}>
                {para.children.map((textNode, j) => (
                  <TextNodeComponent key={j} node={textNode} styles={styles} />
                ))}
              </Text>
            ))}
          </View>
        );
      }
      return (
        <View style={styles.callout}>
          {calloutNode.title && (
            <Text style={styles.calloutTitle}>{calloutNode.title}</Text>
          )}
          {calloutNode.children.map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para.children.map((textNode, j) => (
                <TextNodeComponent key={j} node={textNode} styles={styles} />
              ))}
            </Text>
          ))}
        </View>
      );
    }

    default:
      return null;
  }
}

interface TextNodeComponentProps {
  node: TextNode;
  styles: BookStyles;
}

/**
 * Renders inline text with formatting
 */
function TextNodeComponent({ node, styles }: TextNodeComponentProps) {
  if (node.bold && node.italic) {
    return (
      <Text style={[styles.bold, styles.italic]}>{node.content}</Text>
    );
  }
  if (node.bold) {
    return <Text style={styles.bold}>{node.content}</Text>;
  }
  if (node.italic) {
    return <Text style={styles.italic}>{node.content}</Text>;
  }
  if (node.code) {
    return <Text style={styles.code}>{node.content}</Text>;
  }
  return <Text>{node.content}</Text>;
}

interface HeaderProps {
  config: FormatConfig;
  styles: BookStyles;
  pageNumber: number;
  isLeftPage: boolean;
}

/**
 * Renders running header
 */
function Header({ config, styles, pageNumber, isLeftPage }: HeaderProps) {
  const headers = config.headers;
  if (!headers?.enabled) return null;

  const leftText = headers.left
    ?.replace("{author}", config.meta?.author || "")
    .replace("{title}", config.meta?.title || "")
    .replace("{n}", String(pageNumber));

  const rightText = headers.right
    ?.replace("{author}", config.meta?.author || "")
    .replace("{title}", config.meta?.title || "")
    .replace("{n}", String(pageNumber));

  return (
    <View style={styles.header}>
      <Text style={styles.headerLeft}>{isLeftPage ? leftText : ""}</Text>
      <Text style={styles.headerRight}>{isLeftPage ? "" : rightText}</Text>
    </View>
  );
}

interface FooterProps {
  config: FormatConfig;
  styles: BookStyles;
  pageNumber: number;
}

/**
 * Renders page footer with page number
 */
function Footer({ config, styles, pageNumber }: FooterProps) {
  const footers = config.footers;
  if (!footers?.enabled) return null;

  const format = footers.pageNumber?.format || "{n}";
  const text = format.replace("{n}", String(pageNumber));

  return <Text style={styles.footer}>{text}</Text>;
}

/**
 * Format chapter number according to format string
 */
function formatChapterNumber(num: number, format: string): string {
  return format
    .replace("{n}", String(num))
    .replace("{roman}", toRoman(num))
    .replace("{word}", toWord(num));
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
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

/**
 * Convert number to word
 */
function toWord(num: number): string {
  const words = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
    "Twenty",
  ];

  if (num <= 20) return words[num];
  if (num < 100) {
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const tensDigit = Math.floor(num / 10);
    const onesDigit = num % 10;
    return tens[tensDigit] + (onesDigit > 0 ? `-${words[onesDigit]}` : "");
  }

  return String(num);
}

export default BookDocument;
