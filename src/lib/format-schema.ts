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
// Shared Constants
// ============================================================================

const FONTS = {
  BODY: "Cormorant Garamond",
  HEADING: "Cinzel",
  WEB: "Inter",
  SYSTEM: "system-ui",
} as const;

const BOOK_DEFAULTS = {
  bodySize: "11pt",
  headingSize: "18pt",
  chapterTitleSize: "24pt",
  headerSize: "9pt",
  lineHeight: 1.5,
  indent: "1.5em",
  ornament: "flourish-01",
  sceneBreakOrnament: "three-asterisks",
} as const;

const ARTICLE_DEFAULTS = {
  bodySize: "16px",
  headingSize: "24px",
  chapterTitleSize: "32px",
  headerSize: "14px",
  lineHeight: 1.6,
  spacing: "1em",
} as const;

const THREAD_DEFAULTS = {
  bodySize: "15px",
  headingSize: "18px",
  lineHeight: 1.4,
  spacing: "0.5em",
  maxLength: 280,
} as const;

// ============================================================================
// Shared Enum Schemas
// ============================================================================

const FontStyleSchema = z.enum(["normal", "italic", "oblique"]);
const TextAlignSchema = z.enum(["left", "center", "right"]);
const TextTransformSchema = z.enum([
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
]);
const NormalItalicSchema = z.enum(["normal", "italic"]);

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
  font: z.string().optional().default(FONTS.BODY),
  size: z.string().optional().default(BOOK_DEFAULTS.bodySize),
  lineHeight: z.number().optional().default(BOOK_DEFAULTS.lineHeight),
  style: FontStyleSchema.optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const HeadingsFontSchema = z.object({
  font: z.string().optional().default(FONTS.HEADING),
  size: z.string().optional().default(BOOK_DEFAULTS.headingSize),
  lineHeight: z.number().optional(),
  style: FontStyleSchema.optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const ParagraphConfigSchema = z.object({
  indent: z.string().optional().default(BOOK_DEFAULTS.indent),
  spacing: z.string().optional().default("0"),
  firstParagraphIndent: z.boolean().optional().default(false),
});

export const TypographySchema = z.object({
  body: BodyFontSchema.optional().default(() => ({
    font: FONTS.BODY,
    size: BOOK_DEFAULTS.bodySize,
    lineHeight: BOOK_DEFAULTS.lineHeight,
  })),
  headings: HeadingsFontSchema.optional().default(() => ({
    font: FONTS.HEADING,
    size: BOOK_DEFAULTS.headingSize,
  })),
  paragraph: ParagraphConfigSchema.optional().default(() => ({
    indent: BOOK_DEFAULTS.indent,
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
  font: z.string().optional().default(FONTS.HEADING),
  size: z.string().optional().default(BOOK_DEFAULTS.chapterTitleSize),
  align: TextAlignSchema.optional().default("center"),
  transform: TextTransformSchema.optional().default("uppercase"),
});

export const ChapterSubtitleSchema = z.object({
  enabled: z.boolean().optional().default(true),
  font: z.string().optional().default(FONTS.BODY),
  style: NormalItalicSchema.optional().default("italic"),
});

export const OrnamentSchema = z.object({
  enabled: z.boolean().optional().default(true),
  image: z.string().optional().default(BOOK_DEFAULTS.ornament),
  spacing: z.string().optional().default("1em"),
});

export const ChaptersSchema = z.object({
  numbering: ChapterNumberingSchema.optional().default(() => ({
    enabled: true,
    format: "Chapter {n}",
  })),
  title: ChapterTitleSchema.optional().default(() => ({
    font: FONTS.HEADING,
    size: BOOK_DEFAULTS.chapterTitleSize,
    align: "center" as const,
    transform: "uppercase" as const,
  })),
  subtitle: ChapterSubtitleSchema.optional().default(() => ({
    enabled: true,
    font: FONTS.BODY,
    style: "italic" as const,
  })),
  startOn: z.enum(["right", "left", "any"]).optional().default("right"),
  ornament: OrnamentSchema.optional().default(() => ({
    enabled: true,
    image: BOOK_DEFAULTS.ornament,
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
  font: z.string().optional().default(FONTS.HEADING),
  style: z.enum(["dropped", "raised"]).optional().default("dropped"),
});

export type DropCaps = z.infer<typeof DropCapsSchema>;

// ============================================================================
// Scene Breaks Schema
// ============================================================================

export const SceneBreaksSchema = z.object({
  ornament: z.string().optional().default(BOOK_DEFAULTS.sceneBreakOrnament),
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
  font: z.string().optional().default(FONTS.BODY),
  size: z.string().optional().default(BOOK_DEFAULTS.headerSize),
  transform: TextTransformSchema.optional().default("uppercase"),
  hideOnChapterStart: z.boolean().optional().default(true),
});

export type Headers = z.infer<typeof HeadersSchema>;

// ============================================================================
// Footers Schema (Print)
// ============================================================================

export const PageNumberSchema = z.object({
  position: TextAlignSchema.optional().default("center"),
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
    align: TextAlignSchema.optional().default("center"),
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

export const FrontMatterSchema = z
  .array(FrontMatterItemSchema)
  .optional()
  .default([]);

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

export const BackMatterSchema = z
  .array(BackMatterItemSchema)
  .optional()
  .default([]);

export type BackMatterItem = z.infer<typeof BackMatterItemSchema>;
export type BackMatter = z.infer<typeof BackMatterSchema>;

// ============================================================================
// Special Elements Schema
// ============================================================================

export const BlockquoteStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  style: NormalItalicSchema.optional().default("italic"),
  indent: z.string().optional().default("2em"),
});

export const VerseStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  style: NormalItalicSchema.optional().default("italic"),
  align: TextAlignSchema.optional().default("left"),
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
  align: TextAlignSchema.optional().default("center"),
});

export const FullPageImageSchema = z.object({
  bleed: z.boolean().optional().default(false),
});

export const CaptionStyleSchema = z.object({
  font: z.string().optional().default("inherit"),
  size: z.string().optional().default("9pt"),
  style: NormalItalicSchema.optional().default("italic"),
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

const OutputFormatSchema = z.enum(["pdf", "epub", "html", "markdown"]);

export const PdfOutputSchema = z.object({
  colorProfile: z.enum(["RGB", "CMYK"]).optional().default("CMYK"),
  bleed: z.string().optional().default("0.125in"),
});

export const EpubOutputSchema = z.object({
  coverImage: z.string().optional(),
  tocDepth: z.number().int().min(1).max(3).optional().default(2),
});

export const OutputSchema = z.object({
  formats: z.array(OutputFormatSchema).optional().default(["pdf"]),
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
  platform: z
    .enum(["twitter", "linkedin", "bluesky"])
    .optional()
    .default("twitter"),
  splitStrategy: z
    .enum(["paragraph", "sentence", "manual"])
    .optional()
    .default("paragraph"),
  maxLength: z
    .number()
    .int()
    .positive()
    .optional()
    .default(THREAD_DEFAULTS.maxLength),
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
      font: FONTS.BODY,
      size: BOOK_DEFAULTS.bodySize,
      lineHeight: BOOK_DEFAULTS.lineHeight,
    },
    headings: {
      font: FONTS.HEADING,
      size: BOOK_DEFAULTS.headingSize,
    },
    paragraph: {
      indent: BOOK_DEFAULTS.indent,
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
      font: FONTS.HEADING,
      size: BOOK_DEFAULTS.chapterTitleSize,
      align: "center" as const,
      transform: "uppercase" as const,
    },
    subtitle: {
      enabled: true,
      font: FONTS.BODY,
      style: "italic" as const,
    },
    startOn: "right" as const,
    ornament: {
      enabled: true,
      image: BOOK_DEFAULTS.ornament,
      spacing: "1em",
    },
  })),
  dropCaps: DropCapsSchema.optional().default(() => ({
    enabled: true,
    lines: 3,
    font: FONTS.HEADING,
    style: "dropped" as const,
  })),
  sceneBreaks: SceneBreaksSchema.optional().default(() => ({
    ornament: BOOK_DEFAULTS.sceneBreakOrnament,
    customImage: null,
    spacing: "2em",
  })),
  headers: HeadersSchema.optional().default(() => ({
    enabled: true,
    left: "{author}",
    right: "{title}",
    font: FONTS.BODY,
    size: BOOK_DEFAULTS.headerSize,
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
      font: FONTS.BODY,
      size: BOOK_DEFAULTS.bodySize,
      lineHeight: BOOK_DEFAULTS.lineHeight,
    },
    headings: {
      font: FONTS.HEADING,
      size: BOOK_DEFAULTS.headingSize,
    },
    paragraph: {
      indent: BOOK_DEFAULTS.indent,
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
      font: FONTS.HEADING,
      size: BOOK_DEFAULTS.chapterTitleSize,
      align: "center",
      transform: "uppercase",
    },
    subtitle: {
      enabled: true,
      font: FONTS.BODY,
      style: "italic",
    },
    startOn: "right",
    ornament: {
      enabled: true,
      image: BOOK_DEFAULTS.ornament,
      spacing: "1em",
    },
  },
  dropCaps: {
    enabled: true,
    lines: 3,
    font: FONTS.HEADING,
    style: "dropped",
  },
  sceneBreaks: {
    ornament: BOOK_DEFAULTS.sceneBreakOrnament,
    customImage: null,
    spacing: "2em",
  },
  headers: {
    enabled: true,
    left: "{author}",
    right: "{title}",
    font: FONTS.BODY,
    size: BOOK_DEFAULTS.headerSize,
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
      font: FONTS.WEB,
      size: ARTICLE_DEFAULTS.bodySize,
      lineHeight: ARTICLE_DEFAULTS.lineHeight,
    },
    headings: {
      font: FONTS.WEB,
      size: ARTICLE_DEFAULTS.headingSize,
      weight: "700",
    },
    paragraph: {
      indent: "0",
      spacing: ARTICLE_DEFAULTS.spacing,
      firstParagraphIndent: false,
    },
  },
  chapters: {
    numbering: {
      enabled: false,
      format: "{n}",
    },
    title: {
      font: FONTS.WEB,
      size: ARTICLE_DEFAULTS.chapterTitleSize,
      align: "left",
      transform: "none",
    },
    subtitle: {
      enabled: true,
      font: FONTS.WEB,
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
    font: FONTS.WEB,
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
    font: FONTS.WEB,
    size: ARTICLE_DEFAULTS.headerSize,
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
      font: FONTS.SYSTEM,
      size: THREAD_DEFAULTS.bodySize,
      lineHeight: THREAD_DEFAULTS.lineHeight,
    },
    headings: {
      font: FONTS.SYSTEM,
      size: THREAD_DEFAULTS.headingSize,
      weight: "700",
    },
    paragraph: {
      indent: "0",
      spacing: THREAD_DEFAULTS.spacing,
      firstParagraphIndent: false,
    },
  },
  chapters: {
    numbering: {
      enabled: false,
      format: "",
    },
    title: {
      font: FONTS.SYSTEM,
      size: THREAD_DEFAULTS.headingSize,
      align: "left",
      transform: "none",
    },
    subtitle: {
      enabled: false,
      font: FONTS.SYSTEM,
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
    font: FONTS.SYSTEM,
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
    font: FONTS.SYSTEM,
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
    maxLength: THREAD_DEFAULTS.maxLength,
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
 * Safely validates a format configuration.
 * Returns Zod's SafeParseReturnType with success/error information.
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
      return {
        ...DEFAULT_ARTICLE_CONFIG,
        type: "newsletter",
        newsletter: {
          platform: "resend",
          subject: "{{title}}",
        },
      };
    case "docs":
      return {
        ...DEFAULT_ARTICLE_CONFIG,
        type: "docs",
      };
  }
}

/**
 * Deep merges partial config updates with existing config.
 * Validates the result and returns the merged config.
 */
export function mergeFormatConfig(
  existing: FormatConfig,
  updates: Partial<FormatConfig>,
): FormatConfig {
  return validateFormatConfig(deepMerge(existing, updates));
}

/**
 * Deep merge utility for nested objects.
 * Arrays are replaced entirely, not merged.
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}
