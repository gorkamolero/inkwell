"use client";

/**
 * MarkdownPastePlugin - Converts pasted markdown to rich text
 *
 * Detects when markdown is pasted and converts it to Lexical nodes
 * using the same transformers as MarkdownShortcutPlugin.
 */

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";

// Markdown detection patterns
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,           // Headings
  /^\s*[-*+]\s/m,        // Unordered lists
  /^\s*\d+\.\s/m,        // Ordered lists
  /^\s*>/m,              // Blockquotes
  /`{3}/,                // Code blocks
  /`[^`]+`/,             // Inline code
  /\*\*[^*]+\*\*/,       // Bold
  /__[^_]+__/,           // Bold underscore
  /\*[^*]+\*/,           // Italic asterisk
  /_[^_]+_/,             // Italic underscore
  /\[([^\]]+)\]\(([^)]+)\)/,  // Links
];

/**
 * Checks if text appears to be markdown
 */
function isMarkdown(text: string): boolean {
  return MARKDOWN_PATTERNS.some(pattern => pattern.test(text));
}

export function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        // Get plain text from clipboard
        const text = clipboardData.getData("text/plain");
        if (!text) {
          return false;
        }

        // Check if it looks like markdown
        if (!isMarkdown(text)) {
          return false; // Let default paste handle regular text
        }

        // Prevent default paste behavior
        event.preventDefault();

        // Convert markdown to Lexical nodes
        try {
          $convertFromMarkdownString(text, TRANSFORMERS);
          return true; // Command handled
        } catch (error) {
          console.error("Failed to convert pasted markdown:", error);
          return false; // Let default handler deal with it
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
