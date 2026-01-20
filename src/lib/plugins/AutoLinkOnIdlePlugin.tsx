"use client";

/**
 * AutoLinkOnIdlePlugin - Links URLs after user stops typing
 *
 * Scans text nodes for URLs and converts them to links after a brief pause.
 * Unlike the standard AutoLinkPlugin, this doesn't require space/enter.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createAutoLinkNode, $isAutoLinkNode, $isLinkNode } from "@lexical/link";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  TextNode,
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

export function AutoLinkOnIdlePlugin({
  delay = 700,
}: AutoLinkOnIdlePluginProps = {}): null {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedRef = useRef<string>("");

  const processAutoLinks = useCallback(() => {
    editor.update(() => {
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

      const collectTextNodes = (node: any) => {
        if ($isTextNode(node)) {
          textNodes.push(node);
        }
        if (node.getChildren) {
          node.getChildren().forEach(collectTextNodes);
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

          // Skip if cursor is at the end of this URL (user still typing)
          if (nodeKey === cursorKey && cursorOffset >= startIndex && cursorOffset <= endIndex) {
            continue;
          }

          // Skip if we already processed this exact match
          const matchKey = `${nodeKey}:${startIndex}:${matchText}`;
          if (lastProcessedRef.current === matchKey) {
            continue;
          }
          lastProcessedRef.current = matchKey;

          // Create the link
          const url = matchText.startsWith("http") ? matchText : `https://${matchText}`;

          try {
            const [before] = textNode.splitText(startIndex);
            const [linkTextNode, after] = (before || textNode).splitText(
              before ? 0 : startIndex,
              matchText.length
            );

            if (linkTextNode) {
              const linkNode = $createAutoLinkNode(url);
              linkTextNode.replace(linkNode);
              linkNode.append(linkTextNode);
            }
          } catch {
            // Node may have been modified, skip
          }

          return; // Process one at a time
        }

        // Try email match
        const emailMatch = EMAIL_REGEX.exec(text);
        if (emailMatch) {
          const matchText = emailMatch[0];
          const startIndex = emailMatch.index;
          const endIndex = startIndex + matchText.length;

          if (nodeKey === cursorKey && cursorOffset >= startIndex && cursorOffset <= endIndex) {
            continue;
          }

          const matchKey = `${nodeKey}:${startIndex}:${matchText}`;
          if (lastProcessedRef.current === matchKey) {
            continue;
          }
          lastProcessedRef.current = matchKey;

          try {
            const [before] = textNode.splitText(startIndex);
            const [linkTextNode] = (before || textNode).splitText(
              before ? 0 : startIndex,
              matchText.length
            );

            if (linkTextNode) {
              const linkNode = $createAutoLinkNode(`mailto:${matchText}`);
              linkTextNode.replace(linkNode);
              linkNode.append(linkTextNode);
            }
          } catch {
            // Skip
          }

          return;
        }
      }
    });
  }, [editor]);

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(
      ({ dirtyLeaves, tags }) => {
        // Skip our own updates
        if (tags.has("history-merge") || dirtyLeaves.size === 0) {
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, delay, processAutoLinks]);

  return null;
}
