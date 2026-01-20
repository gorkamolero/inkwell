import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import type { Klass, LexicalNode } from "lexical";
import { ImageNode } from "@/lib/nodes/ImageNode";

/**
 * Shared Lexical editor theme - neobrutalist style
 */
export const EDITOR_THEME = {
  root: "hotpress-editor",
  paragraph: "mb-4",
  heading: {
    h1: "text-3xl font-black mb-4 mt-6 sm:text-4xl",
    h2: "text-2xl font-bold mb-3 mt-5 sm:text-3xl",
    h3: "text-xl font-bold mb-2 mt-4 sm:text-2xl",
    h4: "text-lg font-bold mb-2 mt-3",
    h5: "text-base font-bold mb-2 mt-3",
    h6: "text-sm font-bold mb-2 mt-3",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "font-mono bg-gray-100 px-1.5 py-0.5 border border-gray-300 text-sm",
  },
  list: {
    ul: "list-disc ml-6 mb-4",
    ol: "list-decimal ml-6 mb-4",
    listitem: "mb-1",
    nested: {
      listitem: "list-none",
    },
  },
  quote: "border-l-4 border-black pl-4 italic my-4 text-gray-700",
  code: "font-mono bg-gray-900 text-gray-100 p-4 border-4 border-black my-4 overflow-x-auto",
  link: "text-brutal-blue underline hover:text-blue-800",
  table: "w-full border-collapse border-4 border-black my-4",
  tableCell: "border-2 border-black p-2",
  tableCellHeader: "border-2 border-black p-2 bg-gray-100 font-bold",
} as const;

/**
 * Base editor nodes (without table support)
 */
export const EDITOR_NODES_BASE: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  ImageNode,
];

/**
 * Full editor nodes (with table support)
 */
export const EDITOR_NODES_FULL: Klass<LexicalNode>[] = [
  ...EDITOR_NODES_BASE,
  TableNode,
  TableCellNode,
  TableRowNode,
];

/**
 * Default error handler for Lexical editor
 */
export function handleEditorError(error: Error): void {
  console.error("Lexical error:", error);
}

/**
 * Create a base editor configuration
 */
export function createEditorConfig(options?: {
  namespace?: string;
  includeTableNodes?: boolean;
}): {
  namespace: string;
  theme: typeof EDITOR_THEME;
  nodes: Klass<LexicalNode>[];
  onError: (error: Error) => void;
} {
  const { namespace = "HotpressEditor", includeTableNodes = false } =
    options ?? {};

  return {
    namespace,
    theme: EDITOR_THEME,
    nodes: includeTableNodes ? EDITOR_NODES_FULL : EDITOR_NODES_BASE,
    onError: handleEditorError,
  };
}
