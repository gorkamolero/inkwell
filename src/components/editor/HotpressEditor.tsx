"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode, $createHeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import type { SerializedEditorState } from "lexical";
import { Share2, FileText, Check, Loader2, ChevronDown } from "lucide-react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { BrutalBadge } from "@/components/ui";

// Types
type ContentType = "book" | "article" | "thread" | "newsletter" | "docs";

interface SessionData {
  id: string;
  title: string | null;
  type: ContentType;
  content: string | null;
  shareSlug: string | null;
}

// Editor theme - neobrutalist style
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

// Content type options
const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: "book", label: "Book", description: "Long-form writing with chapters" },
  { value: "article", label: "Article", description: "Blog posts and essays" },
  { value: "thread", label: "Thread", description: "Social media threads" },
];

// ============================================================================
// Initial Content Plugin
// ============================================================================

function InitialContentPlugin({ content }: { content: string | null }) {
  const [editor] = useLexicalComposerContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Try to parse existing content
    if (content) {
      try {
        const parsed = JSON.parse(content) as SerializedEditorState;
        const editorState = editor.parseEditorState(parsed);
        editor.setEditorState(editorState);
        return;
      } catch {
        // Not valid JSON, treat as plain text or set default
      }
    }

    // Set up initial welcome content
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Title
      const h1 = $createHeadingNode("h1");
      h1.append($createTextNode("Start writing something great"));
      root.append(h1);

      // Welcome paragraph
      const p1 = $createParagraphNode();
      p1.append($createTextNode("This is Hotpress. Write here, collaborate in real-time, and publish anywhere."));
      root.append(p1);

      // Second paragraph
      const p2 = $createParagraphNode();
      p2.append($createTextNode("Your content saves automatically. Share the link to collaborate."));
      root.append(p2);
    });
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
  sessionId: string | null;
  onSaveStart: () => void;
  onSaveComplete: () => void;
  onSaveError: (error: Error) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!sessionId) return;

    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      const serialized = JSON.stringify(editorState.toJSON());

      // Skip if content hasn't changed
      if (serialized === lastSavedRef.current) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 1 second
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
          onSaveError(error instanceof Error ? error : new Error("Save failed"));
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
// Type Selector Dropdown
// ============================================================================

function TypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: ContentType;
  onChange: (type: ContentType) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentType = CONTENT_TYPES.find((t) => t.value === value) || CONTENT_TYPES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 border-3 border-black bg-white px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:shadow-[4px_4px_0_0_#000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
      >
        <FileText className="h-4 w-4" />
        {currentType.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  onChange(type.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left transition-colors hover:bg-brutal-yellow ${
                  type.value === value ? "bg-gray-100" : ""
                }`}
              >
                <div className="font-bold">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Editor Component
// ============================================================================

export function HotpressEditor() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [wordCount, setWordCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create or fetch session on mount
  useEffect(() => {
    if (!isMounted || session || isCreatingSession) return;

    const initSession = async () => {
      setIsCreatingSession(true);
      try {
        // Create a new session
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "book" }),
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        const data = await response.json();
        setSession({
          id: data.session.id,
          title: data.session.title,
          type: data.session.type,
          content: data.session.content,
          shareSlug: data.session.shareSlug,
        });
      } catch (error) {
        console.error("Failed to create session:", error);
      } finally {
        setIsCreatingSession(false);
      }
    };

    initSession();
  }, [isMounted, session, isCreatingSession]);

  // Handle content type change
  const handleTypeChange = useCallback(
    async (newType: ContentType) => {
      if (!session) return;

      try {
        const response = await fetch(`/api/sessions/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: newType }),
        });

        if (response.ok) {
          setSession((prev) => (prev ? { ...prev, type: newType } : null));
        }
      } catch (error) {
        console.error("Failed to update type:", error);
      }
    },
    [session]
  );

  // Handle share button click
  const handleShare = useCallback(async () => {
    if (!session) return;

    try {
      // Create share link via API
      const response = await fetch(`/api/sessions/${session.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const data = await response.json();

      // Copy share URL to clipboard
      await navigator.clipboard.writeText(data.shareUrl);

      // Update session with share slug
      setSession((prev) => (prev ? { ...prev, shareSlug: data.shareSlug } : null));

      // Show success message
      alert(`Link copied!\n\n${data.shareUrl}`);
    } catch (error) {
      console.error("Failed to share:", error);
      alert("Failed to create share link. Please try again.");
    }
  }, [session]);

  // Save callbacks
  const handleSaveStart = useCallback(() => {
    setIsSaving(true);
    setSaveStatus("saving");
  }, []);

  const handleSaveComplete = useCallback(() => {
    setIsSaving(false);
    setSaveStatus("saved");
    // Reset to idle after 2 seconds
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  const handleSaveError = useCallback((error: Error) => {
    setIsSaving(false);
    setSaveStatus("error");
    console.error("Save error:", error);
    // Reset to idle after 3 seconds
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, []);

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  const editorConfig = useMemo(
    () => ({
      namespace: "HotpressEditor",
      theme: editorTheme,
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
    []
  );

  // Loading state
  if (!isMounted || !session) {
    return (
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="animate-pulse p-6">
          <div className="mb-4 h-8 w-1/3 bg-gray-200" />
          <div className="mb-2 h-4 w-full bg-gray-200" />
          <div className="mb-2 h-4 w-2/3 bg-gray-200" />
          <div className="h-4 w-3/4 bg-gray-200" />
        </div>
        <div className="border-t-3 border-black bg-gray-50 px-4 py-3">
          <div className="h-4 w-24 animate-pulse bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <LexicalComposer initialConfig={editorConfig}>
        <div className="relative">
          <EditorToolbar />
          <div className="p-4 sm:p-6 md:p-8">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="prose prose-lg min-h-[300px] max-w-none outline-none focus:outline-none sm:min-h-[400px]"
                  aria-label="Editor"
                />
              }
              placeholder={
                <div className="pointer-events-none absolute left-4 top-4 text-gray-400 sm:left-6 sm:top-6 md:left-8 md:top-8">
                  Start writing...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <InitialContentPlugin content={session.content} />
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
      <div className="flex flex-col items-start justify-between gap-2 border-t-3 border-black bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-4">
          {/* Type selector */}
          <TypeSelector
            value={session.type}
            onChange={handleTypeChange}
            disabled={isSaving}
          />

          {/* Word count */}
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Save status */}
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
                Auto-saving
              </BrutalBadge>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 border-3 border-black bg-brutal-blue px-3 py-1.5 font-bold text-white shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
