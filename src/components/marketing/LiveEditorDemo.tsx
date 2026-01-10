"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";
import type { EditorState, SerializedEditorState } from "lexical";
import { Github, Save, FileText } from "lucide-react";
import Link from "next/link";
import { BrutalBadge } from "@/components/ui";
import { EditorToolbar } from "@/components/editor/editor-toolbar";

const STORAGE_KEY = "inkwell-demo-content";

const editorTheme = {
  root: "inkwell-editor",
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

function InitialContentPlugin() {
  const [editor] = useLexicalComposerContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Try to load from localStorage first
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent) as SerializedEditorState;
        const editorState = editor.parseEditorState(parsed);
        editor.setEditorState(editorState);
        return;
      } catch {
        // Invalid saved content, fall through to default
      }
    }

    // Set up initial content
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Title
      const h1 = $createHeadingNode("h1");
      h1.append($createTextNode("Welcome to Inkwell"));
      root.append(h1);

      // Empty paragraph
      const p1 = $createParagraphNode();
      p1.append($createTextNode("Start typing to see the magic."));
      root.append(p1);

      // Formatting demo paragraph
      const p2 = $createParagraphNode();
      const boldNode = $createTextNode("Bold");
      boldNode.setFormat("bold");
      const italicNode = $createTextNode("italic");
      italicNode.setFormat("italic");
      const codeNode = $createTextNode("code");
      codeNode.setFormat("code");
      p2.append(boldNode);
      p2.append($createTextNode(", "));
      p2.append(italicNode);
      p2.append($createTextNode(", and "));
      p2.append(codeNode);
      p2.append($createTextNode(" just work."));
      root.append(p2);

      // CTA paragraph
      const p3 = $createParagraphNode();
      p3.append(
        $createTextNode("This is YOUR editor. No account needed to try it.")
      );
      root.append(p3);
    });
  }, [editor]);

  return null;
}

function AutoSavePlugin({ onSave }: { onSave: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      const serialized = editorState.toJSON();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      onSave();
    });

    return () => {
      removeListener();
    };
  }, [editor, onSave]);

  return null;
}

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

// Loading skeleton component
function EditorSkeleton() {
  return (
    <section
      id="demo"
      className="border-y-4 border-black bg-[#F5F5F5] py-16 sm:py-20 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute -left-4 -top-4 sm:-left-6 sm:-top-6">
              <div className="-rotate-3 border-3 border-black bg-brutal-yellow px-3 py-1.5 text-sm font-black uppercase tracking-wide text-black sm:px-4 sm:py-2 sm:text-base">
                TRY IT
              </div>
            </div>
            <div className="border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6 md:p-8">
              <div className="animate-pulse">
                <div className="mb-4 h-8 w-1/3 bg-gray-200" />
                <div className="mb-2 h-4 w-full bg-gray-200" />
                <div className="mb-2 h-4 w-2/3 bg-gray-200" />
                <div className="h-4 w-3/4 bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Client-only editor wrapper - only rendered when mounted
function EditorContent({
  onSave,
  onWordCountChange,
  wordCount,
  lastSaved,
}: {
  onSave: () => void;
  onWordCountChange: (count: number) => void;
  wordCount: number;
  lastSaved: Date | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChange = useCallback((_editorState: EditorState) => {
    // State changes are handled by the plugins
  }, []);

  const editorConfig = useMemo(
    () => ({
      namespace: "InkwellDemoEditor",
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

  return (
    <section
      id="demo"
      className="border-y-4 border-black bg-[#F5F5F5] py-16 sm:py-20 md:py-24"
    >
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-8 max-w-4xl text-center sm:mb-12">
          <h2 className="mb-4 text-3xl font-black text-black sm:text-4xl md:text-5xl">
            Don&apos;t take our word for it.{" "}
            <span className="text-brutal-blue">Try it.</span>
          </h2>
          <p className="text-lg text-gray-700 sm:text-xl">
            This is the actual editor. No signup. No credit card. Just start
            typing.
          </p>
        </div>

        {/* Editor */}
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* TRY IT label */}
            <div className="absolute -left-2 -top-4 z-20 sm:-left-4 sm:-top-6 md:-left-6">
              <div className="-rotate-3 border-3 border-black bg-brutal-yellow px-3 py-1.5 text-sm font-black uppercase tracking-wide text-black shadow-brutal-sm sm:px-4 sm:py-2 sm:text-base">
                TRY IT
              </div>
            </div>

            {/* Editor card */}
            <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LexicalComposer initialConfig={editorConfig}>
                <div className="relative">
                  <EditorToolbar />
                  <div className="p-4 sm:p-6 md:p-8">
                    <RichTextPlugin
                      contentEditable={
                        <ContentEditable
                          className="prose prose-lg min-h-[250px] max-w-none outline-none focus:outline-none sm:min-h-[300px]"
                          aria-label="Demo editor"
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
                  <OnChangePlugin onChange={handleChange} />
                  <InitialContentPlugin />
                  <AutoSavePlugin onSave={onSave} />
                  <WordCountPlugin onWordCountChange={onWordCountChange} />
                </div>
              </LexicalComposer>

              {/* Status bar */}
              <div className="flex flex-col items-start justify-between gap-2 border-t-3 border-black bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                  </span>
                  {lastSaved && (
                    <span className="flex items-center gap-1.5">
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Saved to browser</span>
                      <span className="sm:hidden">Saved</span>
                    </span>
                  )}
                </div>
                <BrutalBadge variant="success" size="sm">
                  Auto-saving locally
                </BrutalBadge>
              </div>
            </div>

            {/* Sign up CTA */}
            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-black"
              >
                <Github className="h-5 w-5" />
                <span className="font-medium underline-offset-4 group-hover:underline">
                  Sign up to save to GitHub
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveEditorDemo() {
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mount state transition in a way that works with the linter
  // This is a client component, so we use useEffect to detect client-side mounting
  useEffect(() => {
    // This is an intentional pattern for client-only rendering
    // The lint rule is too strict here - we need to trigger a re-render after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleSave = useCallback(() => {
    setLastSaved(new Date());
  }, []);

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  if (!isMounted) {
    return <EditorSkeleton />;
  }

  return (
    <EditorContent
      onSave={handleSave}
      onWordCountChange={handleWordCountChange}
      wordCount={wordCount}
      lastSaved={lastSaved}
    />
  );
}
