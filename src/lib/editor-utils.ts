import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { createEditor, type SerializedEditorState } from "lexical";

// Extended transformers for better markdown support
const EXTENDED_TRANSFORMERS: Transformer[] = TRANSFORMERS;

// Shared node configuration (must match editor.tsx)
const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
];

/**
 * Convert markdown string to Lexical SerializedEditorState.
 * Creates a temporary editor instance to perform the conversion.
 */
export function markdownToLexical(markdown: string): SerializedEditorState {
  // Create a headless editor for conversion
  const editor = createEditor({
    namespace: "HotpressConverter",
    nodes: EDITOR_NODES,
    onError: (error: Error) => {
      console.error("Editor conversion error:", error);
    },
  });

  // Use editor.update to modify state and convert markdown
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, EXTENDED_TRANSFORMERS);
    },
    { discrete: true },
  );

  // Get the serialized state
  const editorState = editor.getEditorState();
  return editorState.toJSON();
}

/**
 * Convert Lexical SerializedEditorState to markdown string.
 */
export function lexicalToMarkdown(state: SerializedEditorState): string {
  // Create a headless editor for conversion
  const editor = createEditor({
    namespace: "HotpressConverter",
    nodes: EDITOR_NODES,
    onError: (error: Error) => {
      console.error("Editor conversion error:", error);
    },
  });

  // Parse the serialized state
  const editorState = editor.parseEditorState(state);

  // Read the markdown content
  let markdown = "";
  editorState.read(() => {
    markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
  });

  return markdown;
}

/**
 * Count words in markdown content.
 * Strips markdown syntax for accurate count.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;

  // Remove markdown syntax for cleaner word count
  const cleaned = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`]+`/g, "")
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove emphasis markers
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove blockquote markers
    .replace(/^>\s+/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Remove excess whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return 0;

  // Split on whitespace and count
  return cleaned.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Extract document title from markdown content.
 * Looks for first H1 heading or first paragraph.
 */
export function extractTitle(markdown: string): string | null {
  // Look for H1 heading
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Look for first non-empty line
  const lines = markdown.split("\n").filter((line) => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Limit length for title
    if (firstLine.length > 100) {
      return `${firstLine.slice(0, 97)}...`;
    }
    return firstLine;
  }

  return null;
}

/**
 * Check if editor state is empty.
 */
export function isEditorStateEmpty(state: SerializedEditorState): boolean {
  try {
    const root = state.root;
    if (!root || !root.children || root.children.length === 0) {
      return true;
    }

    // Check if all children are empty paragraphs
    return root.children.every((child) => {
      if (child.type === "paragraph") {
        const paragraph = child as { children?: { text?: string }[] };
        if (!paragraph.children || paragraph.children.length === 0) {
          return true;
        }
        // Check if paragraph only contains empty text
        return paragraph.children.every(
          (textNode) => !textNode.text || textNode.text.trim() === "",
        );
      }
      return false;
    });
  } catch {
    return true;
  }
}

/**
 * Format relative time for display.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    });
  }
}

/**
 * Generate a commit message for a document save.
 */
export function generateCommitMessage(
  docPath: string,
  isNew: boolean = false,
): string {
  const filename = docPath.split("/").pop() || docPath;
  const action = isNew ? "Create" : "Update";
  return `${action} ${filename}`;
}
