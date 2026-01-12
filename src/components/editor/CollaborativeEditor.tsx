"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
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
import type { Provider } from "@lexical/yjs";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical";
import { FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { BrutalBadge } from "@/components/ui";
import { RoomProvider, useOthers, useRoom, useSelf } from "@/lib/liveblocks";
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
  quote: "border-l-4 border-black pl-4 italic my-4 text-gray-700",
  code: "font-mono bg-gray-900 text-gray-100 p-4 border-4 border-black my-4 overflow-x-auto",
  link: "text-brutal-blue underline hover:text-blue-800",
};

// ============================================================================
// Presence Avatars (inline)
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
// Collaborative Editor Inner
// ============================================================================

interface CollaborativeEditorInnerProps {
  sessionId: string;
  sessionTitle: string | null;
}

function CollaborativeEditorInner({
  sessionId,
  sessionTitle,
}: CollaborativeEditorInnerProps) {
  const room = useRoom();
  const self = useSelf();
  const [wordCount, setWordCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  // Initial editor state for new documents
  function initialEditorState(_editor: LexicalEditor): void {
    const root = $getRoot();
    if (root.getChildrenSize() === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Start writing together..."));
      root.append(paragraph);
    }
  }

  // Provider factory for CollaborationPlugin
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
      const doc = new Y.Doc();
      yjsDocMap.set(id, doc);

      const provider = new LiveblocksYjsProvider(room, doc);

      provider.on("sync", (synced: boolean) => {
        setConnectionStatus(synced ? "connected" : "connecting");
      });

      return provider as unknown as Provider;
    },
    [room],
  );

  const editorConfig = {
    namespace: "CollaborativeEditor",
    theme: editorTheme,
    editorState: null, // CollaborationPlugin handles state
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
  };

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <LexicalComposer initialConfig={editorConfig}>
        {/* Header with presence */}
        <div className="flex items-center justify-between border-b-3 border-black bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-black truncate max-w-[200px]">
              {sessionTitle || "Untitled"}
            </h2>
            <LivePresenceAvatars />
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === "connecting" && (
              <BrutalBadge variant="default" size="sm" className="gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
              </BrutalBadge>
            )}
            {connectionStatus === "connected" && (
              <BrutalBadge variant="success" size="sm">
                Live
              </BrutalBadge>
            )}
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

          {/* Collaboration Plugin - handles Yjs sync and cursors */}
          <CollaborationPlugin
            id={sessionId}
            providerFactory={providerFactory}
            initialEditorState={initialEditorState}
            shouldBootstrap={true}
            cursorColor={String(self?.info?.color || "#000")}
            username={String(self?.info?.name || "Anonymous")}
          />

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <WordCountPlugin onWordCountChange={handleWordCountChange} />
        </div>
      </LexicalComposer>

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
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function EditorSkeleton() {
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

// ============================================================================
// Main Export
// ============================================================================

interface CollaborativeEditorProps {
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
        <CollaborativeEditorInner
          sessionId={roomId}
          sessionTitle={sessionTitle ?? null}
        />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
