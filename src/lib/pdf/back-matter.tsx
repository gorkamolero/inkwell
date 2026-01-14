/**
 * Back Matter PDF Components
 *
 * React-PDF components for rendering back matter pages:
 * - Acknowledgements
 * - About the Author
 * - Also By
 * - Glossary
 * - Appendix
 */

import { Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import type { FormatConfig } from "@/lib/format-schema";
import type { Footnote } from "./content-parser";
import { getFontWithFallback } from "./styles/fonts";
import { getPageDimensions, getMargins, parseToPoints } from "./styles/theme";

// =============================================================================
// Types
// =============================================================================

interface BackMatterItem {
  type: string;
  [key: string]: unknown;
}

interface BookReference {
  title: string;
  link?: string;
}

interface BackMatterProps {
  items: BackMatterItem[];
  config: FormatConfig;
  footnotes?: Footnote[];
}

interface PageProps {
  config: FormatConfig;
  item: BackMatterItem;
}

// =============================================================================
// Styles
// =============================================================================

function createBackMatterStyles(config: FormatConfig) {
  const typography = config.typography;
  const margins = getMargins(config);
  const { width, height } = getPageDimensions(config);

  const bodyFont = getFontWithFallback(typography?.body?.font || "Cormorant Garamond");
  const headingFont = getFontWithFallback(typography?.headings?.font || "Cinzel");
  const bodySize = parseToPoints(typography?.body?.size || "11pt");
  const lineHeight = typography?.body?.lineHeight || 1.5;

  return StyleSheet.create({
    page: {
      width,
      height,
      fontFamily: bodyFont,
      fontSize: bodySize,
      lineHeight,
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.gutter,
      paddingRight: margins.outer,
    },

    // Section title
    sectionTitle: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.5,
      textAlign: "center",
      marginBottom: 36,
      marginTop: 48,
      textTransform: "uppercase",
      letterSpacing: 2,
    },

    // Content paragraph
    paragraph: {
      marginBottom: 12,
      textAlign: "justify",
    },

    // First paragraph (no indent)
    paragraphFirst: {
      marginBottom: 12,
      textAlign: "justify",
    },

    // About Author - centered bio
    authorBioContainer: {
      alignItems: "center",
    },

    authorBio: {
      maxWidth: "85%",
      textAlign: "center",
      lineHeight: 1.6,
    },

    // Also By list
    bookListContainer: {
      alignItems: "center",
      marginTop: 24,
    },

    bookTitle: {
      fontStyle: "italic",
      marginBottom: 8,
      textAlign: "center",
    },

    bookLink: {
      color: "#0066FF",
      textDecoration: "none",
    },

    // Glossary
    glossaryEntry: {
      marginBottom: 12,
    },

    glossaryTerm: {
      fontWeight: "bold",
      marginBottom: 2,
    },

    glossaryDefinition: {
      marginLeft: 24,
    },

    // Appendix
    appendixTitle: {
      fontFamily: headingFont,
      fontSize: bodySize * 1.3,
      marginBottom: 24,
      marginTop: 24,
    },

    appendixContent: {
      textAlign: "justify",
    },

    // Endnotes
    endnoteEntry: {
      flexDirection: "row",
      marginBottom: 8,
    },

    endnoteNumber: {
      width: 24,
      fontSize: bodySize * 0.9,
      fontWeight: "bold",
    },

    endnoteContent: {
      flex: 1,
      fontSize: bodySize,
      textAlign: "justify",
    },
  });
}

// =============================================================================
// Components
// =============================================================================

/**
 * Acknowledgements Page
 */
function AcknowledgementsPage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
  const content = (item.content as string) || "";

  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark="Acknowledgements"
    >
      <Text style={styles.sectionTitle}>Acknowledgements</Text>

      {paragraphs.length > 0 ? (
        paragraphs.map((para, index) => (
          <Text
            key={index}
            style={index === 0 ? styles.paragraphFirst : styles.paragraph}
          >
            {para}
          </Text>
        ))
      ) : (
        <Text style={styles.paragraphFirst}>
          The author would like to thank everyone who made this book possible.
        </Text>
      )}
    </Page>
  );
}

/**
 * About the Author Page
 */
function AboutAuthorPage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
  const content = (item.content as string) || "";
  const authorName = config.meta?.author || "The Author";

  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark="About the Author"
    >
      <Text style={styles.sectionTitle}>About the Author</Text>

      <View style={styles.authorBioContainer}>
        {paragraphs.length > 0 ? (
          paragraphs.map((para, index) => (
            <Text key={index} style={styles.authorBio}>
              {para}
            </Text>
          ))
        ) : (
          <Text style={styles.authorBio}>
            {authorName} is the author of this book.
          </Text>
        )}
      </View>
    </Page>
  );
}

/**
 * Also By Page - Other books by the author
 */
function AlsoByPage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
  const books = (item.books as BookReference[]) || [];
  const authorName = config.meta?.author || "This Author";

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark={`Also By ${authorName}`}
    >
      <Text style={styles.sectionTitle}>Also By {authorName}</Text>

      <View style={styles.bookListContainer}>
        {books.length > 0 ? (
          books.map((book, index) => (
            <View key={index}>
              {book.link ? (
                <Link src={book.link} style={[styles.bookTitle, styles.bookLink]}>
                  {book.title}
                </Link>
              ) : (
                <Text style={styles.bookTitle}>{book.title}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.paragraph}>
            More books coming soon.
          </Text>
        )}
      </View>
    </Page>
  );
}

/**
 * Glossary Page
 */
function GlossaryPage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
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

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark="Glossary"
    >
      <Text style={styles.sectionTitle}>Glossary</Text>

      {entries.map((entry, index) => (
        <View key={index} style={styles.glossaryEntry}>
          <Text style={styles.glossaryTerm}>{entry.term}</Text>
          {entry.definition && (
            <Text style={styles.glossaryDefinition}>{entry.definition}</Text>
          )}
        </View>
      ))}
    </Page>
  );
}

/**
 * Appendix Page
 */
function AppendixPage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
  const title = (item.title as string) || "Appendix";
  const content = (item.content as string) || "";

  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark={title}
    >
      <Text style={styles.sectionTitle}>{title}</Text>

      {paragraphs.map((para, index) => (
        <Text
          key={index}
          style={index === 0 ? styles.paragraphFirst : styles.paragraph}
        >
          {para}
        </Text>
      ))}
    </Page>
  );
}

/**
 * Epilogue Page (similar to Acknowledgements)
 */
function EpiloguePage({ config, item }: PageProps) {
  const styles = createBackMatterStyles(config);
  const content = (item.content as string) || "";

  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark="Epilogue"
    >
      <Text style={styles.sectionTitle}>Epilogue</Text>

      {paragraphs.map((para, index) => (
        <Text
          key={index}
          style={index === 0 ? styles.paragraphFirst : styles.paragraph}
        >
          {para}
        </Text>
      ))}
    </Page>
  );
}

/**
 * Endnotes Page - Renders all footnotes as endnotes
 */
interface EndnotesPageProps {
  config: FormatConfig;
  footnotes: Footnote[];
}

function EndnotesPage({ config, footnotes }: EndnotesPageProps) {
  const styles = createBackMatterStyles(config);

  if (footnotes.length === 0) return null;

  return (
    <Page
      size={{ width: styles.page.width, height: styles.page.height }}
      style={styles.page}
      bookmark="Notes"
    >
      <Text style={styles.sectionTitle}>Notes</Text>

      {footnotes.map((note) => (
        <View key={note.id} style={styles.endnoteEntry}>
          <Text style={styles.endnoteNumber}>{note.number}.</Text>
          <Text style={styles.endnoteContent}>{note.content}</Text>
        </View>
      ))}
    </Page>
  );
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Renders all back matter pages based on configuration
 */
export function BackMatter({ items, config, footnotes }: BackMatterProps) {
  const hasContent = (items && items.length > 0) || (footnotes && footnotes.length > 0);
  if (!hasContent) return null;

  return (
    <>
      {items?.map((item, index) => {
        switch (item.type) {
          case "epilogue":
            return <EpiloguePage key={index} config={config} item={item} />;
          case "acknowledgements":
            return <AcknowledgementsPage key={index} config={config} item={item} />;
          case "aboutAuthor":
            return <AboutAuthorPage key={index} config={config} item={item} />;
          case "alsoBy":
            return <AlsoByPage key={index} config={config} item={item} />;
          case "glossary":
            return <GlossaryPage key={index} config={config} item={item} />;
          case "appendix":
            return <AppendixPage key={index} config={config} item={item} />;
          default:
            return null;
        }
      })}

      {/* Render endnotes if there are any footnotes */}
      {footnotes && footnotes.length > 0 && (
        <EndnotesPage config={config} footnotes={footnotes} />
      )}
    </>
  );
}

export {
  AcknowledgementsPage,
  AboutAuthorPage,
  AlsoByPage,
  GlossaryPage,
  AppendixPage,
  EpiloguePage,
  EndnotesPage,
};
