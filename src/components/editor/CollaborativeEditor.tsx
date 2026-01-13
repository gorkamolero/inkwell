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
import {
  ClientSideSuspense,
  useCreateAiChat,
  useHistoryVersions,
  useInboxNotifications,
  useThreads,
} from "@liveblocks/react";
import {
  AnchoredThreads,
  FloatingComposer,
  FloatingThreads,
  FloatingToolbar,
  HistoryVersionPreview,
  LiveblocksPlugin,
  liveblocksConfig,
  Toolbar,
  useIsEditorReady,
} from "@liveblocks/react-lexical";
import { $getRoot } from "lexical";
import {
  Bell,
  Bot,
  Check,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiChat } from "@liveblocks/react-ui";
import { BrutalBadge } from "@/components/ui";
import { RoomProvider, useMyPresence, useOthers, useSelf } from "@/lib/liveblocks";
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
  const [, updateMyPresence] = useMyPresence();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selfName = String(self?.info?.name || "You");
  const selfColor = String(self?.info?.color || "#000");

  const otherUsers = others.map((other) => ({
    id: other.connectionId.toString(),
    name: String(other.info?.name || "Anonymous"),
    color: String(other.info?.color || "#666"),
  }));

  const handleEditClick = () => {
    setEditName(selfName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== selfName) {
      updateMyPresence({ name: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Self avatar with edit capability */}
      {self && (
        <div className="flex items-center gap-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveName}
                className="h-7 w-24 border-2 border-black px-2 text-xs font-bold focus:outline-none"
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="flex h-7 w-7 items-center justify-center border-2 border-black bg-brutal-green text-black hover:bg-green-400"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="group flex items-center gap-1"
              title="Click to change your name"
            >
              <div
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold text-white"
                style={{ backgroundColor: selfColor }}
              >
                {selfName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium max-w-[80px] truncate hidden sm:inline">
                {selfName}
              </span>
              <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      )}

      {/* Other users */}
      {otherUsers.slice(0, 4).map((user) => (
        <div
          key={user.id}
          className="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold text-white"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {otherUsers.length > 4 && (
        <div className="flex h-7 w-7 items-center justify-center border-2 border-black bg-gray-200 text-xs font-bold">
          +{otherUsers.length - 4}
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

  return isReady ? (
    <BrutalBadge variant="success" size="sm">
      Live
    </BrutalBadge>
  ) : (
    <BrutalBadge variant="default" size="sm" className="gap-1.5">
      <Loader2 className="h-3 w-3 animate-spin" />
      Connecting...
    </BrutalBadge>
  );
}

// ============================================================================
// Editor Content Area (with loading state)
// ============================================================================

interface EditorContentAreaProps {
  onWordCountChange: (count: number) => void;
}

function EditorContentArea({ onWordCountChange }: EditorContentAreaProps) {
  const isReady = useIsEditorReady();

  // Show skeleton until editor is ready (content synced)
  if (!isReady) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="min-h-[400px] space-y-4">
          <div className="h-8 w-2/3 animate-pulse bg-gray-200" />
          <div className="h-4 w-full animate-pulse bg-gray-100" />
          <div className="h-4 w-5/6 animate-pulse bg-gray-100" />
          <div className="h-4 w-4/5 animate-pulse bg-gray-100" />
          <div className="h-4 w-full animate-pulse bg-gray-100" />
          <div className="h-4 w-3/4 animate-pulse bg-gray-100" />
          <div className="mt-6 h-4 w-full animate-pulse bg-gray-100" />
          <div className="h-4 w-5/6 animate-pulse bg-gray-100" />
          <div className="h-4 w-full animate-pulse bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <>
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
      <WordCountPlugin onWordCountChange={onWordCountChange} />
    </>
  );
}


// ============================================================================
// History Panel
// ============================================================================

interface HistoryPanelProps {
  onClose: () => void;
}

function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { versions, isLoading } = useHistoryVersions();
  type VersionType = NonNullable<typeof versions>[number];
  const [selectedVersion, setSelectedVersion] = useState<VersionType | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="absolute right-0 top-full z-50 mt-2 w-80 border-4 border-black bg-white p-4 shadow-brutal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Version History</h3>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-gray-100 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (selectedVersion) {
    return (
      <div className="absolute right-0 top-full z-50 mt-2 w-96 border-4 border-black bg-white shadow-brutal">
        <div className="flex items-center justify-between border-b-3 border-black p-3">
          <button
            type="button"
            onClick={() => setSelectedVersion(null)}
            className="text-sm font-bold hover:underline"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-gray-100 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-auto">
          <HistoryVersionPreview version={selectedVersion} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 border-4 border-black bg-white shadow-brutal">
      <div className="flex items-center justify-between border-b-3 border-black p-3">
        <h3 className="font-bold">Version History</h3>
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-gray-100 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-auto">
        {versions && versions.length > 0 ? (
          versions.map((version) => (
            <button
              type="button"
              key={version.id}
              onClick={() => setSelectedVersion(version)}
              className="w-full border-b border-gray-200 p-3 text-left hover:bg-gray-50 last:border-b-0"
            >
              <div className="text-sm font-medium">
                {new Date(version.createdAt).toLocaleString()}
              </div>
              {version.authors && version.authors.length > 0 && (
                <div className="text-xs text-gray-500">
                  by {version.authors.map((a) => a.id).join(", ")}
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No versions yet. Start writing to create history.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Notifications Bell
// ============================================================================

function NotificationBell() {
  const { inboxNotifications, isLoading } = useInboxNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount =
    inboxNotifications?.filter((n) => n.readAt === null).length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center border-2 border-transparent transition-all hover:border-black hover:bg-gray-100 relative"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center border-2 border-black bg-brutal-red text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border-4 border-black bg-white shadow-brutal">
          <div className="flex items-center justify-between border-b-3 border-black p-3">
            <h3 className="font-bold">Notifications</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-100 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : inboxNotifications && inboxNotifications.length > 0 ? (
              inboxNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-gray-200 p-3 last:border-b-0 ${
                    notification.readAt === null ? "bg-yellow-50" : ""
                  }`}
                >
                  <div className="text-sm">
                    {notification.kind === "thread" && "New comment thread"}
                    {notification.kind === "$documentAccess" &&
                      "Document access updated"}
                    {notification.kind === "$textMention" &&
                      "You were mentioned"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.notifiedAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Threads Sidebar
// ============================================================================

interface ThreadsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function ThreadsSidebar({ isOpen, onClose }: ThreadsSidebarProps) {
  const { threads } = useThreads();

  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 border-l-4 border-black bg-white">
      <div className="flex items-center justify-between border-b-3 border-black p-3">
        <h3 className="font-bold">Comments</h3>
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-gray-100 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div
        className="overflow-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {threads && threads.length > 0 ? (
          <AnchoredThreads threads={threads} />
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No comments yet. Select text and click the comment button to start.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AI Assistant Panel
// ============================================================================

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function AiAssistantPanel({ isOpen, onClose }: AiAssistantPanelProps) {
  const [chatId, setChatId] = useState<string | null>(null);
  const createChat = useCreateAiChat();
  const self = useSelf();

  const isAuthenticated = self?.info?.isAuthenticated === true;

  // Create a chat when the panel opens for the first time (only if authenticated)
  useEffect(() => {
    if (isOpen && !chatId && isAuthenticated) {
      const newChatId = `ai-chat-${Date.now()}`;
      createChat(newChatId);
      setChatId(newChatId);
    }
  }, [isOpen, chatId, createChat, isAuthenticated]);

  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 border-l-4 border-black bg-white flex flex-col">
      <div className="flex items-center justify-between border-b-3 border-black p-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <h3 className="font-bold">AI Assistant</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-gray-100 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Bot className="h-12 w-12 text-gray-300 mb-4" />
            <p className="font-bold mb-2">Sign in to use AI</p>
            <p className="text-sm text-gray-500 mb-4">
              AI writing assistance is available for signed-in users.
            </p>
            <a
              href="/api/auth/signin"
              className="brutal border-3 border-black bg-brutal-yellow px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Sign in with GitHub
            </a>
          </div>
        ) : chatId ? (
          <AiChat chatId={chatId} className="h-full" autoFocus={false} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
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
  const [showHistory, setShowHistory] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const { threads } = useThreads();

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

  const threadCount = threads?.length ?? 0;

  return (
    <div className="flex">
      <div className="flex-1 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <LexicalComposer initialConfig={editorConfig}>
          {/* Liveblocks Plugin - handles all collaboration + floating comments */}
          <LiveblocksPlugin>
            <FloatingComposer />
            {threads && <FloatingThreads threads={threads} />}
            <FloatingToolbar>
              <Toolbar.SectionInline />
              <Toolbar.Separator />
              <Toolbar.SectionCollaboration />
            </FloatingToolbar>
          </LiveblocksPlugin>

          {/* Header with presence */}
          <div className="flex items-center justify-between border-b-3 border-black bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-black truncate max-w-[200px]">
                {sessionTitle || "Untitled"}
              </h2>
              <LivePresenceAvatars />
            </div>
            <div className="flex items-center gap-1">
              {/* Threads toggle (also opens composer when text selected) */}
              <button
                type="button"
                onClick={() => setShowThreads(!showThreads)}
                className={`flex h-8 items-center gap-1 px-2 border-2 transition-all ${
                  showThreads
                    ? "border-black bg-yellow-400"
                    : "border-transparent hover:border-black hover:bg-gray-100"
                }`}
                title="Toggle Comments Sidebar"
              >
                <MessageSquare className="h-4 w-4" />
                {threadCount > 0 && (
                  <span className="text-xs font-bold">{threadCount}</span>
                )}
              </button>

              {/* History button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex h-8 w-8 items-center justify-center border-2 transition-all ${
                    showHistory
                      ? "border-black bg-yellow-400"
                      : "border-transparent hover:border-black hover:bg-gray-100"
                  }`}
                  title="Version History"
                >
                  <History className="h-4 w-4" />
                </button>
                {showHistory && (
                  <HistoryPanel onClose={() => setShowHistory(false)} />
                )}
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* AI Assistant toggle */}
              <button
                type="button"
                onClick={() => setShowAi(!showAi)}
                className={`flex h-8 w-8 items-center justify-center border-2 transition-all ${
                  showAi
                    ? "border-black bg-yellow-400"
                    : "border-transparent hover:border-black hover:bg-gray-100"
                }`}
                title="AI Assistant"
              >
                <Bot className="h-4 w-4" />
              </button>

              {/* Status indicator */}
              <EditorReadyIndicator />
            </div>
          </div>

          {/* Toolbar */}
          <EditorToolbar />

          {/* Editor content */}
          <div className="relative">
            <EditorContentArea onWordCountChange={setWordCount} />
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

      {/* Threads sidebar */}
      <ThreadsSidebar
        isOpen={showThreads}
        onClose={() => setShowThreads(false)}
      />

      {/* AI Assistant panel */}
      <AiAssistantPanel isOpen={showAi} onClose={() => setShowAi(false)} />
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
