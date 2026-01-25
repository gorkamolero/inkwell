"use client";

/**
 * AutoLinkOnIdlePlugin - Links URLs after user stops typing
 *
 * Scans text nodes for URLs and converts them to links after a brief pause.
 * Unlike the standard AutoLinkPlugin, this doesn't require space/enter.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createAutoLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
} from "@lexical/link";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  TextNode,
  LexicalNode,
} from "lexical";

// URL regex
const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Email regex
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

interface AutoLinkOnIdlePluginProps {
  delay?: number;
}

function replaceTextWithLink(
  textNode: TextNode,
  startIndex: number,
  matchLength: number,
  url: string
): void {
  // splitText returns array of nodes split at the given offsets
  // splitText(start, end) -> [before, middle, after] or subset if at boundaries
  const endIndex = startIndex + matchLength;

  let targetNode: TextNode;

  if (startIndex === 0) {
    // URL is at the start
    if (endIndex < textNode.getTextContentSize()) {
      const parts = textNode.splitText(endIndex);
      targetNode = parts[0];
    } else {
      // Entire node is the URL
      targetNode = textNode;
    }
  } else {
    // URL is in the middle or end
    const parts = textNode.splitText(startIndex, endIndex);
    // parts[0] = before, parts[1] = the URL text, parts[2] = after (if any)
    targetNode = parts[1];
  }

  if (targetNode && $isTextNode(targetNode)) {
    const linkNode = $createAutoLinkNode(url);
    const textContent = targetNode.getTextContent();
    // Replace target with link first, then create new text inside
    const newTextNode = $createTextNode(textContent);
    newTextNode.setFormat(targetNode.getFormat());
    linkNode.append(newTextNode);
    targetNode.replace(linkNode);
  }
}

export function AutoLinkOnIdlePlugin({
  delay = 700,
}: AutoLinkOnIdlePluginProps = {}): null {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedRef = useRef<Set<string>>(new Set());

  const processAutoLinks = useCallback(() => {
    editor.update(
      () => {
        const selection = $getSelection();

        // Get cursor position to avoid linking text user is still typing
        let cursorKey: string | null = null;
        let cursorOffset = 0;

        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          cursorKey = selection.anchor.key;
          cursorOffset = selection.anchor.offset;
        }

        // Walk all text nodes
        const root = $getRoot();
        const textNodes: TextNode[] = [];

        const collectTextNodes = (node: LexicalNode): void => {
          if ($isTextNode(node)) {
            textNodes.push(node);
          }
          if ("getChildren" in node && typeof node.getChildren === "function") {
            (node.getChildren() as LexicalNode[]).forEach(collectTextNodes);
          }
        };

        root.getChildren().forEach(collectTextNodes);

        for (const textNode of textNodes) {
          // Skip if parent is already a link
          const parent = textNode.getParent();
          if (parent && ($isLinkNode(parent) || $isAutoLinkNode(parent))) {
            continue;
          }

          const text = textNode.getTextContent();
          const nodeKey = textNode.getKey();

          // Try URL match
          const urlMatch = URL_REGEX.exec(text);
          if (urlMatch) {
            const matchText = urlMatch[0];
            const startIndex = urlMatch.index;
            const endIndex = startIndex + matchText.length;

            // Skip if cursor is strictly inside this URL (user still typing)
            // Allow linking when cursor is at boundary (start or end)
            if (
              nodeKey === cursorKey &&
              cursorOffset > startIndex &&
              cursorOffset < endIndex
            ) {
              continue;
            }

            // Skip if already processed
            const matchKey = `${nodeKey}:${matchText}`;
            if (processedRef.current.has(matchKey)) {
              continue;
            }
            processedRef.current.add(matchKey);

            // Create the link
            const url = matchText.startsWith("http")
              ? matchText
              : `https://${matchText}`;

            try {
              replaceTextWithLink(textNode, startIndex, matchText.length, url);
            } catch (e) {
              console.error("AutoLink error:", e);
            }

            return; // Process one at a time to avoid mutation conflicts
          }

          // Try email match
          const emailMatch = EMAIL_REGEX.exec(text);
          if (emailMatch) {
            const matchText = emailMatch[0];
            const startIndex = emailMatch.index;
            const endIndex = startIndex + matchText.length;

            // Skip if cursor is strictly inside this email (user still typing)
            if (
              nodeKey === cursorKey &&
              cursorOffset > startIndex &&
              cursorOffset < endIndex
            ) {
              continue;
            }

            const matchKey = `${nodeKey}:${matchText}`;
            if (processedRef.current.has(matchKey)) {
              continue;
            }
            processedRef.current.add(matchKey);

            try {
              replaceTextWithLink(
                textNode,
                startIndex,
                matchText.length,
                `mailto:${matchText}`
              );
            } catch (e) {
              console.error("AutoLink email error:", e);
            }

            return;
          }
        }
      },
      { discrete: true }
    );
  }, [editor]);

  useEffect(() => {
    // Clear processed set periodically to allow re-processing
    const intervalId = setInterval(() => {
      processedRef.current.clear();
    }, 5000);

    const removeListener = editor.registerUpdateListener(
      ({ dirtyLeaves, tags }) => {
        // Skip if no changes or skip certain tags
        if (dirtyLeaves.size === 0 || tags.has("collaboration")) {
          return;
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(processAutoLinks, delay);
      }
    );

    return () => {
      removeListener();
      clearInterval(intervalId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, delay, processAutoLinks]);

  return null;
}
