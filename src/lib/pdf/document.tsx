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
  InlineNode,
} from "./content-parser";
import { getDropCapLetter, getTextAfterDropCap } from "./content-parser";
import { FrontMatter } from "./front-matter";
import { BackMatter } from "./back-matter";
import { SceneBreakOrnament, ChapterOrnament } from "./ornaments";
import { registerFonts } from "./styles/fonts";
import { createStyles, getPageDimensions, type BookStyles } from "./styles/theme";
import { formatChapterNumber } from "./utils/number-format";

// Ensure fonts are registered
registerFonts();

interface BookDocumentProps {
  content: ParsedDocument;
  config: FormatConfig;
  showHotpressColophon?: boolean;
}

/**
 * Main book document component
 */
export function BookDocument({ content, config, showHotpressColophon }: BookDocumentProps) {
  const styles = createStyles(config);
  const { width, height } = getPageDimensions(config);

  // Get front and back matter items from config
  const frontMatterItems = (config.frontMatter as Array<{ type: string; [key: string]: unknown }>) || [];
  const backMatterItems = (config.backMatter as Array<{ type: string; [key: string]: unknown }>) || [];

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
        />
      ))}

      {/* Back Matter */}
      <BackMatter
        items={backMatterItems}
        config={config}
        footnotes={content.footnotes}
        showHotpressColophon={showHotpressColophon}
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
        bookmark={
          chapters?.numbering?.enabled
            ? `${formatChapterNumber(chapter.number, chapters.numbering.format)}: ${chapter.title}`
            : chapter.title
        }
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
              {restOfText.map((inlineNode, i) => (
                <InlineNodeComponent key={i} node={inlineNode} styles={styles} />
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
          {paragraph.children.map((inlineNode, i) => (
            <InlineNodeComponent key={i} node={inlineNode} styles={styles} />
          ))}
        </Text>
      );
    }

    case "heading": {
      const headingStyles: Record<number, typeof styles.heading2> = {
        2: styles.heading2,
        3: styles.heading3,
        4: styles.heading4,
      };
      const headingStyle = headingStyles[node.level] || styles.heading4;

      return <Text style={headingStyle}>{node.content}</Text>;
    }

    case "blockquote": {
      return (
        <View style={styles.blockquote}>
          {node.children.map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para.children.map((inlineNode, j) => (
                <InlineNodeComponent key={j} node={inlineNode} styles={styles} />
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
                {para.children.map((inlineNode, j) => (
                  <InlineNodeComponent key={j} node={inlineNode} styles={styles} />
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
              {para.children.map((inlineNode, j) => (
                <InlineNodeComponent key={j} node={inlineNode} styles={styles} />
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

interface InlineNodeComponentProps {
  node: InlineNode;
  styles: BookStyles;
}

/**
 * Renders inline content (text with formatting or footnote reference)
 */
function InlineNodeComponent({ node, styles }: InlineNodeComponentProps) {
  if (node.type === "footnote-ref") {
    return (
      <Text style={styles.footnoteRef}>{node.number}</Text>
    );
  }

  // TextNode
  const textNode = node as TextNode;
  if (textNode.bold && textNode.italic) {
    return (
      <Text style={[styles.bold, styles.italic]}>{textNode.content}</Text>
    );
  }
  if (textNode.bold) {
    return <Text style={styles.bold}>{textNode.content}</Text>;
  }
  if (textNode.italic) {
    return <Text style={styles.italic}>{textNode.content}</Text>;
  }
  if (textNode.code) {
    return <Text style={styles.code}>{textNode.content}</Text>;
  }
  return <Text>{textNode.content}</Text>;
}

interface HeaderProps {
  config: FormatConfig;
  styles: BookStyles;
  isLeftPage: boolean;
}

/**
 * Renders running header with accurate page numbers using render prop
 */
function Header({ config, styles, isLeftPage }: HeaderProps) {
  const headers = config.headers;
  if (!headers?.enabled) return null;

  const author = config.meta?.author || "";
  const title = config.meta?.title || "";

  // Pre-compute static parts of header text
  const leftTemplate = headers.left
    ?.replace("{author}", author)
    .replace("{title}", title);

  const rightTemplate = headers.right
    ?.replace("{author}", author)
    .replace("{title}", title);

  return (
    <View style={styles.header} fixed>
      <Text
        style={styles.headerLeft}
        render={({ pageNumber }) =>
          isLeftPage ? (leftTemplate?.replace("{n}", String(pageNumber)) || "") : ""
        }
      />
      <Text
        style={styles.headerRight}
        render={({ pageNumber }) =>
          isLeftPage ? "" : (rightTemplate?.replace("{n}", String(pageNumber)) || "")
        }
      />
    </View>
  );
}

interface FooterProps {
  config: FormatConfig;
  styles: BookStyles;
}

/**
 * Renders page footer with accurate page number using render prop
 */
function Footer({ config, styles }: FooterProps) {
  const footers = config.footers;
  if (!footers?.enabled) return null;

  const format = footers.pageNumber?.format || "{n}";

  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        format
          .replace("{n}", String(pageNumber))
          .replace("{total}", String(totalPages))
      }
    />
  );
}

export default BookDocument;
