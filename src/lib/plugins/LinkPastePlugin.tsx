"use client";

/**
 * LinkPastePlugin - Automatically converts pasted URLs to links
 *
 * The standard AutoLinkPlugin only works when typing. This plugin
 * handles paste events to detect and convert URLs to clickable links.
 */

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createLinkNode } from "@lexical/link";
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";

// URL regex - matches http://, https://, and www. URLs
const URL_REGEX =
  /^((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Checks if a string is a valid URL
 */
function isUrl(text: string): boolean {
  return URL_REGEX.test(text.trim());
}

/**
 * Normalizes a URL by adding https:// if missing
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function LinkPastePlugin(): null {
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

        // Check if the entire pasted text is a URL
        if (!isUrl(text)) {
          return false; // Let default paste handle non-URL text
        }

        // Prevent default paste behavior
        event.preventDefault();

        const url = normalizeUrl(text);

        // Insert as a link node
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          // Create a link node with the URL
          const linkNode = $createLinkNode(url);
          linkNode.append($createTextNode(text.trim()));

          // Insert the link
          selection.insertNodes([linkNode]);
        });

        return true; // Command handled
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
