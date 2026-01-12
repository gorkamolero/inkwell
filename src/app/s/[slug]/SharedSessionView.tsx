"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { SerializedEditorState } from "lexical";
import { $getRoot } from "lexical";
import { Check, Copy, ExternalLink, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { BrutalBadge } from "@/components/ui";

// Types
interface SessionData {
  id: string;
  title: string | null;
  type: string;
  content: string | null;
  formatConfig: Record<string, unknown> | null;
  passwordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SharedSessionViewProps {
  session: SessionData;
}

// Editor theme
const editorTheme = {
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
};

// ============================================================================
// Content Plugin - Load initial content
// ============================================================================

function ContentPlugin({ content }: { content: string | null }) {
  const [editor] = useLexicalComposerContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !content) return;
    initializedRef.current = true;

    try {
      const parsed = JSON.parse(content) as SerializedEditorState;
      const editorState = editor.parseEditorState(parsed);
      editor.setEditorState(editorState);
    } catch {
      // Invalid content, editor will stay empty
    }
  }, [editor, content]);

  return null;
}

// ============================================================================
// Auto-save Plugin
// ============================================================================

function AutoSavePlugin({
  sessionId,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: {
  sessionId: string;
  onSaveStart: () => void;
  onSaveComplete: () => void;
  onSaveError: (error: Error) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      const serialized = JSON.stringify(editorState.toJSON());

      if (serialized === lastSavedRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        onSaveStart();
        try {
          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: serialized }),
          });

          if (!response.ok) {
            throw new Error("Failed to save");
          }

          lastSavedRef.current = serialized;
          onSaveComplete();
        } catch (error) {
          onSaveError(
            error instanceof Error ? error : new Error("Save failed"),
          );
        }
      }, 1000);
    });

    return () => {
      removeListener();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, sessionId, onSaveStart, onSaveComplete, onSaveError]);

  return null;
}

// ============================================================================
// Word Count Plugin
// ============================================================================

function WordCountPlugin({
  onWordCountChange,
}: {
  onWordCountChange: (count: number) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        const words = textContent
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        onWordCountChange(words.length);
      });
    });

    return () => {
      removeListener();
    };
  }, [editor, onWordCountChange]);

  return null;
}

// ============================================================================
// Main Component
// ============================================================================

export function SharedSessionView({ session }: SharedSessionViewProps) {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Save callbacks
  const handleSaveStart = useCallback(() => {
    setSaveStatus("saving");
  }, []);

  const handleSaveComplete = useCallback(() => {
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  const handleSaveError = useCallback((error: Error) => {
    setSaveStatus("error");
    console.error("Save error:", error);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, []);

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  const editorConfig = useMemo(
    () => ({
      namespace: "SharedSessionEditor",
      theme: editorTheme,
      editable: true, // Collaborative editing enabled
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
      ],
      onError: (error: Error) => {
        console.error("Lexical error:", error);
      },
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-black"
          >
            HOTPRESS
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 border-3 border-black bg-white px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 border-3 border-black bg-brutal-yellow px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              <ExternalLink className="h-4 w-4" />
              Create Your Own
            </Link>
          </div>
        </div>

        {/* Title */}
        {session.title && (
          <div className="mx-auto mb-4 max-w-4xl">
            <h1 className="text-2xl font-black text-black sm:text-3xl">
              {session.title}
            </h1>
          </div>
        )}

        {/* Editor */}
        <div className="mx-auto max-w-4xl">
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <LexicalComposer initialConfig={editorConfig}>
              <div className="relative">
                <EditorToolbar />
                <div className="p-4 sm:p-6 md:p-8">
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        className="prose prose-lg min-h-[400px] max-w-none outline-none focus:outline-none"
                        aria-label="Shared session editor"
                      />
                    }
                    placeholder={
                      <div className="pointer-events-none absolute left-4 top-4 text-gray-400 sm:left-6 sm:top-6 md:left-8 md:top-8">
                        This session is empty...
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </div>
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <ContentPlugin content={session.content} />
                <AutoSavePlugin
                  sessionId={session.id}
                  onSaveStart={handleSaveStart}
                  onSaveComplete={handleSaveComplete}
                  onSaveError={handleSaveError}
                />
                <WordCountPlugin onWordCountChange={handleWordCountChange} />
              </div>
            </LexicalComposer>

            {/* Status bar */}
            <div className="flex items-center justify-between border-t-3 border-black bg-gray-50 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <BrutalBadge variant="default" size="sm" className="gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </BrutalBadge>
                )}
                {saveStatus === "saved" && (
                  <BrutalBadge variant="success" size="sm" className="gap-1.5">
                    <Check className="h-3 w-3" />
                    Saved
                  </BrutalBadge>
                )}
                {saveStatus === "error" && (
                  <BrutalBadge variant="destructive" size="sm">
                    Save failed
                  </BrutalBadge>
                )}
                {saveStatus === "idle" && (
                  <BrutalBadge variant="default" size="sm">
                    Collaborative
                  </BrutalBadge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
