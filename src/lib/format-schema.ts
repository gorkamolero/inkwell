/**
 * Format Configuration Schema for Hotpress
 *
 * Defines the complete format configuration schema for books, articles,
 * threads, newsletters, and documentation. This schema drives PDF generation
 * and other output formats.
 */

import { z } from "zod";

// ============================================================================
// Content Types
// ============================================================================

export const ContentTypeSchema = z.enum([
  "book",
  "article",
  "thread",
  "newsletter",
  "docs",
]);

export type ContentType = z.infer<typeof ContentTypeSchema>;

// ============================================================================
// Metadata Schema
// ============================================================================

export const SeriesSchema = z.object({
  name: z.string(),
  number: z.number().int().positive().optional(),
});

export const MetaSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  series: SeriesSchema.optional(),
  language: z.string().optional().default("en"),
  isbn: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export type Meta = z.infer<typeof MetaSchema>;

// ============================================================================
// Typography Schema
// ============================================================================

export const BodyFontSchema = z.object({
  font: z.string().optional().default("Cormorant Garamond"),
  size: z.string().optional().default("11pt"),
  lineHeight: z.number().optional().default(1.5),
  style: z.enum(["normal", "italic", "oblique"]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const HeadingsFontSchema = z.object({
  font: z.string().optional().default("Cinzel"),
  size: z.string().optional().default("18pt"),
  lineHeight: z.number().optional(),
  style: z.enum(["normal", "italic", "oblique"]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const ParagraphConfigSchema = z.object({
  indent: z.string().optional().default("1.5em"),
  spacing: z.string().optional().default("0"),
  firstParagraphIndent: z.boolean().optional().default(false),
});

export const TypographySchema = z.object({
  body: BodyFontSchema.optional().default(() => ({
    font: "Cormorant Garamond",
    size: "11pt",
    lineHeight: 1.5,
  })),
  headings: HeadingsFontSchema.optional().default(() => ({
    font: "Cinzel",
    size: "18pt",
  })),
  paragraph: ParagraphConfigSchema.optional().default(() => ({
    indent: "1.5em",
    spacing: "0",
    firstParagraphIndent: false,
  })),
});

export type Typography = z.infer<typeof TypographySchema>;

// ============================================================================
// Chapter Styling Schema
// ============================================================================

export const ChapterNumberingSchema = z.object({
  enabled: z.boolean().optional().default(true),
  format: z.string().optional().default("Chapter {n}"),
});

export const ChapterTitleSchema = z.object({
  font: z.string().optional().default("Cinzel"),
  size: z.string().optional().default("24pt"),
  align: z.enum(["left", "center", "right"]).optional().default("center"),
  transform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional().default("uppercase"),
});

export const ChapterSubtitleSchema = z.object({
  enabled: z.boolean().optional().default(true),
  font: z.string().optional().default("Cormorant Garamond"),
  style: z.enum(["normal", "italic"]).optional().default("italic"),
});

export const OrnamentSchema = z.object({
  enabled: z.boolean().optional().default(true),
  image: z.string().optional().default("flourish-01"),
  spacing: z.string().optional().default("1em"),
});

export const ChaptersSchema = z.object({
  numbering: ChapterNumberingSchema.optional().default(() => ({
    enabled: true,
    format: "Chapter {n}",
  })),
  title: ChapterTitleSchema.optional().default(() => ({
    font: "Cinzel",
    size: "24pt",
    align: "center" as const,
    transform: "uppercase" as const,
  })),
  subtitle: ChapterSubtitleSchema.optional().default(() => ({
    enabled: true,
    font: "Cormorant Garamond",
    style: "italic" as const,
  })),
  startOn: z.enum(["right", "left", "any"]).optional().default("right"),
  ornament: OrnamentSchema.optional().default(() => ({
    enabled: true,
    image: "flourish-01",
    spacing: "1em",
  })),
});

export type Chapters = z.infer<typeof ChaptersSchema>;

// ============================================================================
// Drop Caps Schema
// ============================================================================

export const DropCapsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  lines: z.number().int().min(1).max(5).optional().default(3),
  font: z.string().optional().default("Cinzel"),
  style: z.enum(["dropped", "raised"]).optional().default("dropped"),
});

export type DropCaps = z.infer<typeof DropCapsSchema>;

// ============================================================================
// Scene Breaks Schema
// ============================================================================

export const SceneBreaksSchema = z.object({
  ornament: z.string().optional().default("three-asterisks"),
  customImage: z.string().nullable().optional().default(null),
  spacing: z.string().optional().default("2em"),
});

export type SceneBreaks = z.infer<typeof SceneBreaksSchema>;

// ============================================================================
// Headers Schema (Print)
// ============================================================================

export const HeadersSchema = z.object({
  enabled: z.boolean().optional().default(true),
  left: z.string().optional().default("{author}"),
  right: z.string().optional().default("{title}"),
  font: z.string().optional().default("Cormorant Garamond"),
  size: z.string().optional().default("9pt"),
  transform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional().default("uppercase"),
  hideOnChapterStart: z.boolean().optional().default(true),
});

export type Headers = z.infer<typeof HeadersSchema>;

// ============================================================================
// Footers Schema (Print)
// ============================================================================

export const PageNumberSchema = z.object({
  position: z.enum(["left", "center", "right"]).optional().default("center"),
  format: z.string().optional().default("{n}"),
});

export const FootersSchema = z.object({
  enabled: z.boolean().optional().default(true),
  pageNumber: PageNumberSchema.optional().default(() => ({
    position: "center" as const,
    format: "{n}",
  })),
  ornament: z.string().nullable().optional().default(null),
});

export type Footers = z.infer<typeof FootersSchema>;

// ============================================================================
// Page Layout Schema
// ============================================================================

export const MarginsSchema = z.object({
  top: z.string().optional().default("0.75in"),
  bottom: z.string().optional().default("0.75in"),
  outer: z.string().optional().default("0.625in"),
  gutter: z.string().optional().default("0.875in"),
});

export const PageSchema = z.object({
  size: z.string().optional().default("6x9"),
  width: z.string().optional().default("6in"),
  height: z.string().optional().default("9in"),
  margins: MarginsSchema.optional().default(() => ({
    top: "0.75in",
    bottom: "0.75in",
    outer: "0.625in",
    gutter: "0.875in",
  })),
});

export type Page = z.infer<typeof PageSchema>;

// ============================================================================
// Front Matter Schema
// ============================================================================

export const FrontMatterItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("halfTitle"),
  }),
  z.object({
    type: z.literal("title"),
    includeSubtitle: z.boolean().optional().default(true),
    includeAuthor: z.boolean().optional().default(true),
  }),
  z.object({
    type: z.literal("copyright"),
    template: z.string().optional().default("fiction"),
  }),
  z.object({
    type: z.literal("dedication"),
    content: z.string().optional(),
    align: z.enum(["left", "center", "right"]).optional().default("center"),
  }),
  z.object({
    type: z.literal("epigraph"),
    quote: z.string().optional(),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal("toc"),
    depth: z.number().int().min(1).max(3).optional().default(1),
  }),
  z.object({
    type: z.literal("preface"),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal("foreword"),
    content: z.string().optional(),
    author: z.string().optional(),
  }),
]);

export const FrontMatterSchema = z.array(FrontMatterItemSchema).optional().default([]);

export type FrontMatterItem = z.infer<typeof FrontMatterItemSchema>;
export type FrontMatter = z.infer<typeof FrontMatterSchema>;

// ============================================================================
// Back Matter Schema
// ============================================================================

export const BookReferenceSchema = z.object({
  title: z.string(),
  link: z.string().url().optional(),
});

export const BackMatterItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("epilogue"),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal("acknowledgements"),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal("aboutAuthor"),
    content: z.string().optional(),
    image: z.string().optional(),
  }),
  z.object({
    type: z.literal("alsoBy"),
    books: z.array(BookReferenceSchema).optional().default([]),
  }),
  z.object({
    type: z.literal("glossary"),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal("appendix"),
    title: z.string().optional(),
    content: z.string().optional(),
  }),
]);

export const BackMatterSchema = z.array(BackMatterItemSchema).optional().default([]);

export type BackMatterItem = z.infer<typeof BackMatterItemSchema>;
export type BackMatter = z.infer<typeof BackMatterSchema>;

// ============================================================================
// Special Elements Schema
// ============================================================================

export const BlockquoteStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  style: z.enum(["normal", "italic"]).optional().default("italic"),
  indent: z.string().optional().default("2em"),
});

export const VerseStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  style: z.enum(["normal", "italic"]).optional().default("italic"),
  align: z.enum(["left", "center", "right"]).optional().default("left"),
});

export const CalloutStyleSchema = z.object({
  enabled: z.boolean().optional().default(true),
  border: z.string().optional().default("2px solid black"),
  background: z.string().optional().default("#f5f5f5"),
});

export const FootnotesStyleSchema = z.object({
  style: z.enum(["bottom", "endnotes"]).optional().default("bottom"),
  numbering: z.string().optional().default("1"),
});

export const ElementsSchema = z.object({
  blockquote: BlockquoteStyleSchema.optional().default(() => ({
    font: "inherit",
    style: "italic" as const,
    indent: "2em",
  })),
  verse: VerseStyleSchema.optional().default(() => ({
    font: "inherit",
    style: "italic" as const,
    align: "left" as const,
  })),
  callout: CalloutStyleSchema.optional().default(() => ({
    enabled: true,
    border: "2px solid black",
    background: "#f5f5f5",
  })),
  footnotes: FootnotesStyleSchema.optional().default(() => ({
    style: "bottom" as const,
    numbering: "1",
  })),
});

export type Elements = z.infer<typeof ElementsSchema>;

// ============================================================================
// Image Settings Schema
// ============================================================================

export const InlineImageSchema = z.object({
  maxWidth: z.string().optional().default("80%"),
  align: z.enum(["left", "center", "right"]).optional().default("center"),
});

export const FullPageImageSchema = z.object({
  bleed: z.boolean().optional().default(false),
});

export const CaptionStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  size: z.string().optional().default("9pt"),
  style: z.enum(["normal", "italic"]).optional().default("italic"),
});

export const ImagesSchema = z.object({
  inline: InlineImageSchema.optional().default(() => ({
    maxWidth: "80%",
    align: "center" as const,
  })),
  fullPage: FullPageImageSchema.optional().default(() => ({
    bleed: false,
  })),
  caption: CaptionStyleSchema.optional().default(() => ({
    font: "inherit",
    size: "9pt",
    style: "italic" as const,
  })),
});

export type Images = z.infer<typeof ImagesSchema>;

// ============================================================================
// Output Settings Schema
// ============================================================================

export const PdfOutputSchema = z.object({
  colorProfile: z.enum(["RGB", "CMYK"]).optional().default("CMYK"),
  bleed: z.string().optional().default("0.125in"),
});

export const EpubOutputSchema = z.object({
  coverImage: z.string().optional(),
  tocDepth: z.number().int().min(1).max(3).optional().default(2),
});

export const OutputSchema = z.object({
  formats: z.array(z.enum(["pdf", "epub", "html", "markdown"])).optional().default(["pdf"]),
  pdf: PdfOutputSchema.optional().default(() => ({
    colorProfile: "CMYK" as const,
    bleed: "0.125in",
  })),
  epub: EpubOutputSchema.optional().default(() => ({
    tocDepth: 2,
  })),
});

export type Output = z.infer<typeof OutputSchema>;

// ============================================================================
// Theme Schema
// ============================================================================

export const ThemeSchema = z.object({
  preset: z.string().nullable().optional().default(null),
});

export type Theme = z.infer<typeof ThemeSchema>;

// ============================================================================
// Type-Specific Settings
// ============================================================================

export const ArticleSettingsSchema = z.object({
  platform: z.enum(["web", "medium", "substack"]).optional().default("web"),
  featuredImage: z.string().optional(),
  toc: z.boolean().optional().default(true),
});

export const ThreadSettingsSchema = z.object({
  platform: z.enum(["twitter", "linkedin", "bluesky"]).optional().default("twitter"),
  splitStrategy: z.enum(["paragraph", "sentence", "manual"]).optional().default("paragraph"),
  maxLength: z.number().int().positive().optional().default(280),
  numbering: z.boolean().optional().default(true),
});

export const NewsletterSettingsSchema = z.object({
  platform: z.enum(["resend", "mailgun", "ses"]).optional().default("resend"),
  subject: z.string().optional().default("{{title}}"),
  preheader: z.string().optional(),
});

export type ArticleSettings = z.infer<typeof ArticleSettingsSchema>;
export type ThreadSettings = z.infer<typeof ThreadSettingsSchema>;
export type NewsletterSettings = z.infer<typeof NewsletterSettingsSchema>;

// ============================================================================
// Complete Format Configuration Schema
// ============================================================================

export const FormatConfigSchema = z.object({
  type: ContentTypeSchema.optional().default("book"),
  meta: MetaSchema.optional().default(() => ({
    language: "en",
    tags: [],
  })),
  theme: ThemeSchema.optional().default(() => ({
    preset: null,
  })),
  typography: TypographySchema.optional().default(() => ({
    body: {
      font: "Cormorant Garamond",
      size: "11pt",
      lineHeight: 1.5,
    },
    headings: {
      font: "Cinzel",
      size: "18pt",
    },
    paragraph: {
      indent: "1.5em",
      spacing: "0",
      firstParagraphIndent: false,
    },
  })),
  chapters: ChaptersSchema.optional().default(() => ({
    numbering: {
      enabled: true,
      format: "Chapter {n}",
    },
    title: {
      font: "Cinzel",
      size: "24pt",
      align: "center" as const,
      transform: "uppercase" as const,
    },
    subtitle: {
      enabled: true,
      font: "Cormorant Garamond",
      style: "italic" as const,
    },
    startOn: "right" as const,
    ornament: {
      enabled: true,
      image: "flourish-01",
      spacing: "1em",
    },
  })),
  dropCaps: DropCapsSchema.optional().default(() => ({
    enabled: true,
    lines: 3,
    font: "Cinzel",
    style: "dropped" as const,
  })),
  sceneBreaks: SceneBreaksSchema.optional().default(() => ({
    ornament: "three-asterisks",
    customImage: null,
    spacing: "2em",
  })),
  headers: HeadersSchema.optional().default(() => ({
    enabled: true,
    left: "{author}",
    right: "{title}",
    font: "Cormorant Garamond",
    size: "9pt",
    transform: "uppercase" as const,
    hideOnChapterStart: true,
  })),
  footers: FootersSchema.optional().default(() => ({
    enabled: true,
    pageNumber: {
      position: "center" as const,
      format: "{n}",
    },
    ornament: null,
  })),
  page: PageSchema.optional().default(() => ({
    size: "6x9",
    width: "6in",
    height: "9in",
    margins: {
      top: "0.75in",
      bottom: "0.75in",
      outer: "0.625in",
      gutter: "0.875in",
    },
  })),
  frontMatter: FrontMatterSchema.optional().default([]),
  backMatter: BackMatterSchema.optional().default([]),
  elements: ElementsSchema.optional().default(() => ({
    blockquote: {
      font: "inherit",
      style: "italic" as const,
      indent: "2em",
    },
    verse: {
      font: "inherit",
      style: "italic" as const,
      align: "left" as const,
    },
    callout: {
      enabled: true,
      border: "2px solid black",
      background: "#f5f5f5",
    },
    footnotes: {
      style: "bottom" as const,
      numbering: "1",
    },
  })),
  images: ImagesSchema.optional().default(() => ({
    inline: {
      maxWidth: "80%",
      align: "center" as const,
    },
    fullPage: {
      bleed: false,
    },
    caption: {
      font: "inherit",
      size: "9pt",
      style: "italic" as const,
    },
  })),
  output: OutputSchema.optional().default(() => ({
    formats: ["pdf"] as ("pdf" | "epub" | "html" | "markdown")[],
    pdf: {
      colorProfile: "CMYK" as const,
      bleed: "0.125in",
    },
    epub: {
      tocDepth: 2,
    },
  })),
  // Type-specific settings
  article: ArticleSettingsSchema.optional(),
  thread: ThreadSettingsSchema.optional(),
  newsletter: NewsletterSettingsSchema.optional(),
});

export type FormatConfig = z.infer<typeof FormatConfigSchema>;

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default format configuration for books.
 * Classic fiction layout with serif fonts and traditional chapter styling.
 */
export const DEFAULT_BOOK_CONFIG: FormatConfig = {
  type: "book",
  meta: {
    title: "Untitled Book",
    language: "en",
    tags: [],
  },
  theme: {
    preset: "classic-serif",
  },
  typography: {
    body: {
      font: "Cormorant Garamond",
      size: "11pt",
      lineHeight: 1.5,
    },
    headings: {
      font: "Cinzel",
      size: "18pt",
    },
    paragraph: {
      indent: "1.5em",
      spacing: "0",
      firstParagraphIndent: false,
    },
  },
  chapters: {
    numbering: {
      enabled: true,
      format: "Chapter {n}",
    },
    title: {
      font: "Cinzel",
      size: "24pt",
      align: "center",
      transform: "uppercase",
    },
    subtitle: {
      enabled: true,
      font: "Cormorant Garamond",
      style: "italic",
    },
    startOn: "right",
    ornament: {
      enabled: true,
      image: "flourish-01",
      spacing: "1em",
    },
  },
  dropCaps: {
    enabled: true,
    lines: 3,
    font: "Cinzel",
    style: "dropped",
  },
  sceneBreaks: {
    ornament: "three-asterisks",
    customImage: null,
    spacing: "2em",
  },
  headers: {
    enabled: true,
    left: "{author}",
    right: "{title}",
    font: "Cormorant Garamond",
    size: "9pt",
    transform: "uppercase",
    hideOnChapterStart: true,
  },
  footers: {
    enabled: true,
    pageNumber: {
      position: "center",
      format: "{n}",
    },
    ornament: null,
  },
  page: {
    size: "6x9",
    width: "6in",
    height: "9in",
    margins: {
      top: "0.75in",
      bottom: "0.75in",
      outer: "0.625in",
      gutter: "0.875in",
    },
  },
  frontMatter: [
    { type: "halfTitle" },
    { type: "title", includeSubtitle: true, includeAuthor: true },
    { type: "copyright", template: "fiction" },
    { type: "toc", depth: 1 },
  ],
  backMatter: [],
  elements: {
    blockquote: {
      font: "inherit",
      style: "italic",
      indent: "2em",
    },
    verse: {
      font: "inherit",
      style: "italic",
      align: "left",
    },
    callout: {
      enabled: true,
      border: "2px solid black",
      background: "#f5f5f5",
    },
    footnotes: {
      style: "bottom",
      numbering: "1",
    },
  },
  images: {
    inline: {
      maxWidth: "80%",
      align: "center",
    },
    fullPage: {
      bleed: false,
    },
    caption: {
      font: "inherit",
      size: "9pt",
      style: "italic",
    },
  },
  output: {
    formats: ["pdf"],
    pdf: {
      colorProfile: "CMYK",
      bleed: "0.125in",
    },
    epub: {
      tocDepth: 2,
    },
  },
};

/**
 * Default format configuration for articles.
 * Clean web-friendly layout with modern styling.
 */
export const DEFAULT_ARTICLE_CONFIG: FormatConfig = {
  type: "article",
  meta: {
    title: "Untitled Article",
    language: "en",
    tags: [],
  },
  theme: {
    preset: null,
  },
  typography: {
    body: {
      font: "Inter",
      size: "16px",
      lineHeight: 1.6,
    },
    headings: {
      font: "Inter",
      size: "24px",
      weight: "700",
    },
    paragraph: {
      indent: "0",
      spacing: "1em",
      firstParagraphIndent: false,
    },
  },
  chapters: {
    numbering: {
      enabled: false,
      format: "{n}",
    },
    title: {
      font: "Inter",
      size: "32px",
      align: "left",
      transform: "none",
    },
    subtitle: {
      enabled: true,
      font: "Inter",
      style: "normal",
    },
    startOn: "any",
    ornament: {
      enabled: false,
      image: "",
      spacing: "0",
    },
  },
  dropCaps: {
    enabled: false,
    lines: 3,
    font: "Inter",
    style: "dropped",
  },
  sceneBreaks: {
    ornament: "horizontal-rule",
    customImage: null,
    spacing: "2em",
  },
  headers: {
    enabled: false,
    left: "",
    right: "",
    font: "Inter",
    size: "14px",
    transform: "none",
    hideOnChapterStart: false,
  },
  footers: {
    enabled: false,
    pageNumber: {
      position: "center",
      format: "{n}",
    },
    ornament: null,
  },
  page: {
    size: "web",
    width: "100%",
    height: "auto",
    margins: {
      top: "2rem",
      bottom: "2rem",
      outer: "1rem",
      gutter: "1rem",
    },
  },
  frontMatter: [],
  backMatter: [],
  elements: {
    blockquote: {
      font: "inherit",
      style: "italic",
      indent: "1em",
    },
    verse: {
      font: "inherit",
      style: "italic",
      align: "left",
    },
    callout: {
      enabled: true,
      border: "1px solid #e5e5e5",
      background: "#f9f9f9",
    },
    footnotes: {
      style: "bottom",
      numbering: "1",
    },
  },
  images: {
    inline: {
      maxWidth: "100%",
      align: "center",
    },
    fullPage: {
      bleed: false,
    },
    caption: {
      font: "inherit",
      size: "14px",
      style: "italic",
    },
  },
  output: {
    formats: ["html", "markdown"],
    pdf: {
      colorProfile: "RGB",
      bleed: "0",
    },
    epub: {
      tocDepth: 2,
    },
  },
  article: {
    platform: "web",
    toc: true,
  },
};

/**
 * Default format configuration for threads.
 * Optimized for social media splitting.
 */
export const DEFAULT_THREAD_CONFIG: FormatConfig = {
  type: "thread",
  meta: {
    title: "Untitled Thread",
    language: "en",
    tags: [],
  },
  theme: {
    preset: null,
  },
  typography: {
    body: {
      font: "system-ui",
      size: "15px",
      lineHeight: 1.4,
    },
    headings: {
      font: "system-ui",
      size: "18px",
      weight: "700",
    },
    paragraph: {
      indent: "0",
      spacing: "0.5em",
      firstParagraphIndent: false,
    },
  },
  chapters: {
    numbering: {
      enabled: false,
      format: "",
    },
    title: {
      font: "system-ui",
      size: "18px",
      align: "left",
      transform: "none",
    },
    subtitle: {
      enabled: false,
      font: "system-ui",
      style: "normal",
    },
    startOn: "any",
    ornament: {
      enabled: false,
      image: "",
      spacing: "0",
    },
  },
  dropCaps: {
    enabled: false,
    lines: 1,
    font: "system-ui",
    style: "dropped",
  },
  sceneBreaks: {
    ornament: "none",
    customImage: null,
    spacing: "1em",
  },
  headers: {
    enabled: false,
    left: "",
    right: "",
    font: "system-ui",
    size: "14px",
    transform: "none",
    hideOnChapterStart: false,
  },
  footers: {
    enabled: false,
    pageNumber: {
      position: "center",
      format: "",
    },
    ornament: null,
  },
  page: {
    size: "thread",
    width: "100%",
    height: "auto",
    margins: {
      top: "0",
      bottom: "0",
      outer: "0",
      gutter: "0",
    },
  },
  frontMatter: [],
  backMatter: [],
  elements: {
    blockquote: {
      font: "inherit",
      style: "normal",
      indent: "0",
    },
    verse: {
      font: "inherit",
      style: "normal",
      align: "left",
    },
    callout: {
      enabled: false,
      border: "none",
      background: "transparent",
    },
    footnotes: {
      style: "bottom",
      numbering: "1",
    },
  },
  images: {
    inline: {
      maxWidth: "100%",
      align: "center",
    },
    fullPage: {
      bleed: false,
    },
    caption: {
      font: "inherit",
      size: "13px",
      style: "normal",
    },
  },
  output: {
    formats: ["markdown"],
    pdf: {
      colorProfile: "RGB",
      bleed: "0",
    },
    epub: {
      tocDepth: 1,
    },
  },
  thread: {
    platform: "twitter",
    splitStrategy: "paragraph",
    maxLength: 280,
    numbering: true,
  },
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates a format configuration object.
 * Returns a validated config with defaults applied.
 */
export function validateFormatConfig(config: unknown): FormatConfig {
  return FormatConfigSchema.parse(config);
}

/**
 * Safely validates a format configuration, returning a result object.
 */
export function safeValidateFormatConfig(config: unknown): {
  success: boolean;
  data?: FormatConfig;
  error?: z.ZodError;
} {
  const result = FormatConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Gets the default configuration for a given content type.
 */
export function getDefaultConfig(type: ContentType): FormatConfig {
  switch (type) {
    case "book":
      return DEFAULT_BOOK_CONFIG;
    case "article":
      return DEFAULT_ARTICLE_CONFIG;
    case "thread":
      return DEFAULT_THREAD_CONFIG;
    case "newsletter":
      // Newsletter uses article defaults with newsletter-specific settings
      return {
        ...DEFAULT_ARTICLE_CONFIG,
        type: "newsletter",
        newsletter: {
          platform: "resend",
          subject: "{{title}}",
        },
      };
    case "docs":
      // Docs use article defaults
      return {
        ...DEFAULT_ARTICLE_CONFIG,
        type: "docs",
      };
    default:
      return DEFAULT_BOOK_CONFIG;
  }
}

/**
 * Merges partial config updates with existing config.
 * Validates the result and returns the merged config.
 */
export function mergeFormatConfig(
  existing: FormatConfig,
  updates: Partial<FormatConfig>
): FormatConfig {
  const merged = {
    ...existing,
    ...updates,
    meta: { ...existing.meta, ...updates.meta },
    typography: { ...existing.typography, ...updates.typography },
    chapters: { ...existing.chapters, ...updates.chapters },
    page: { ...existing.page, ...updates.page },
  };
  return validateFormatConfig(merged);
}
