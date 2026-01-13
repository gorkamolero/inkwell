/**
 * PDF Generation Library
 *
 * Exports all PDF generation utilities and components.
 */

export { BookDocument } from "./document";
export { FrontMatter, HalfTitlePage, TitlePage, CopyrightPage, DedicationPage, EpigraphPage, TableOfContentsPage } from "./front-matter";
export { BackMatter, AcknowledgementsPage, AboutAuthorPage, AlsoByPage, GlossaryPage, AppendixPage, EpiloguePage } from "./back-matter";
export { parseMarkdown, getDropCapLetter, getTextAfterDropCap } from "./content-parser";
export type {
  ParsedDocument,
  Chapter,
  ContentNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  BlockquoteNode,
  ListNode,
  SceneBreakNode,
  ImageNode,
} from "./content-parser";
export { registerFonts, getAvailableFonts, isFontAvailable, getFontWithFallback } from "./styles/fonts";
export { createStyles, parseToPoints, getPageDimensions, getMargins } from "./styles/theme";
export type { BookStyles } from "./styles/theme";
