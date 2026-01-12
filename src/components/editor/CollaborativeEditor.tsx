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
import { ClientSideSuspense } from "@liveblocks/react";
import {
  LiveblocksPlugin,
  liveblocksConfig,
  useIsEditorReady,
} from "@liveblocks/react-lexical";
import { $getRoot } from "lexical";
import { FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrutalBadge } from "@/components/ui";
import { RoomProvider, useOthers, useSelf } from "@/lib/liveblocks";
import { EditorToolbar } from "./editor-toolbar";

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
  quote:
    "border-l-4 border-black pl-4 italic text-gray-700 my-4 bg-gray-50 py-2",
  code: "font-mono bg-gray-900 text-gray-100 p-4 block overflow-x-auto my-4 border-3 border-black",
  link: "text-brutal-blue underline underline-offset-2 hover:text-brutal-blue/80",
};

// ============================================================================
// Presence Avatars
// ============================================================================

function LivePresenceAvatars() {
  const others = useOthers();
  const self = useSelf();

  const users = [
    ...(self
      ? [
          {
            id: "self",
            name: String(self.info?.name || "You"),
            color: String(self.info?.color || "#000"),
          },
        ]
      : []),
    ...others.map((other) => ({
      id: other.connectionId.toString(),
      name: String(other.info?.name || "Anonymous"),
      color: String(other.info?.color || "#666"),
    })),
  ];

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.slice(0, 5).map((user) => (
        <div
          key={user.id}
          className="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold text-white"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {users.length > 5 && (
        <div className="flex h-7 w-7 items-center justify-center border-2 border-black bg-gray-200 text-xs font-bold">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Word Count Plugin
// ============================================================================

interface WordCountPluginProps {
  onWordCountChange: (count: number) => void;
}

function WordCountPlugin({ onWordCountChange }: WordCountPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const textContent = $getRoot().getTextContent();
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
// Editor Ready Status
// ============================================================================

function EditorReadyIndicator() {
  const isReady = useIsEditorReady();

  if (isReady) {
    return (
      <BrutalBadge variant="success" size="sm">
        Live
      </BrutalBadge>
    );
  }

  return (
    <BrutalBadge variant="default" size="sm" className="gap-1.5">
      <Loader2 className="h-3 w-3 animate-spin" />
      Connecting...
    </BrutalBadge>
  );
}

// ============================================================================
// Collaborative Editor Inner
// ============================================================================

interface CollaborativeEditorInnerProps {
  sessionTitle: string | null;
}

function CollaborativeEditorInner({
  sessionTitle,
}: CollaborativeEditorInnerProps) {
  const [wordCount, setWordCount] = useState(0);

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  // Create editor config with Liveblocks
  const editorConfig = liveblocksConfig({
    namespace: "CollaborativeEditor",
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
  });

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <LexicalComposer initialConfig={editorConfig}>
        {/* Liveblocks Plugin - handles all collaboration */}
        <LiveblocksPlugin />

        {/* Header with presence */}
        <div className="flex items-center justify-between border-b-3 border-black bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-black truncate max-w-[200px]">
              {sessionTitle || "Untitled"}
            </h2>
            <LivePresenceAvatars />
          </div>
          <div className="flex items-center gap-2">
            <EditorReadyIndicator />
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar />

        {/* Editor content */}
        <div className="relative">
          <div className="p-4 sm:p-6 md:p-8">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="prose prose-lg min-h-[400px] max-w-none outline-none focus:outline-none"
                  aria-label="Collaborative Editor"
                />
              }
              placeholder={
                <div className="pointer-events-none absolute left-4 top-4 text-gray-400 sm:left-6 sm:top-6 md:left-8 md:top-8">
                  Start writing together...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <WordCountPlugin onWordCountChange={handleWordCountChange} />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t-3 border-black bg-gray-50 px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <BrutalBadge variant="default" size="sm">
            Collaborative
          </BrutalBadge>
        </div>
      </LexicalComposer>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function EditorSkeleton() {
  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b-3 border-black bg-gray-50 px-4 py-2">
        <div className="h-6 w-32 animate-pulse bg-gray-200" />
        <div className="h-6 w-20 animate-pulse bg-gray-200" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex gap-2 border-b-3 border-black bg-white px-4 py-2">
        <div className="h-8 w-8 animate-pulse bg-gray-100 border-2 border-gray-200" />
        <div className="h-8 w-8 animate-pulse bg-gray-100 border-2 border-gray-200" />
        <div className="h-8 w-8 animate-pulse bg-gray-100 border-2 border-gray-200" />
      </div>

      {/* Content skeleton */}
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-4 w-3/4 animate-pulse bg-gray-200" />
          <div className="h-4 w-full animate-pulse bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse bg-gray-200" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between border-t-3 border-black bg-gray-50 px-4 py-3">
        <div className="h-4 w-20 animate-pulse bg-gray-200" />
        <div className="h-5 w-24 animate-pulse bg-gray-200" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export interface CollaborativeEditorProps {
  roomId: string;
  sessionTitle?: string | null;
}

export function CollaborativeEditor({
  roomId,
  sessionTitle,
}: CollaborativeEditorProps) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        name: "",
        color: "",
      }}
    >
      <ClientSideSuspense fallback={<EditorSkeleton />}>
        <CollaborativeEditorInner sessionTitle={sessionTitle ?? null} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
