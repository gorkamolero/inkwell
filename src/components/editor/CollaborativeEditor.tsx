"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ImageNode } from "@/lib/nodes/ImageNode";
import { ImagePastePlugin } from "@/lib/plugins/ImagePastePlugin";
import { LinkPastePlugin } from "@/lib/plugins/LinkPastePlugin";
import { MarkdownPastePlugin } from "@/lib/plugins/MarkdownPastePlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { AutoLinkOnIdlePlugin } from "@/lib/plugins/AutoLinkOnIdlePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  ClientSideSuspense,
  useCreateAiChat,
  useHistoryVersions,
  useInboxNotifications,
  useThreads,
  useStatus,
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
  Copy,
  ExternalLink,
  FileText,
  History,
  Home,
  Loader2,
  MessageSquare,
  Palette,
  Pencil,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AiChat } from "@liveblocks/react-ui";
import { BrutalBadge } from "@/components/ui";
import { RoomProvider, useMyPresence, useOthers, useSelf } from "@/lib/liveblocks";
import { EditorToolbar } from "./editor-toolbar";
import { CollaborationProofSnapshot } from "./CollaborationProofSnapshot";

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
  const selfPicture = (self?.info?.picture as string | undefined) || null;

  const otherUsers = others.map((other) => ({
    id: other.connectionId.toString(),
    name: String(other.info?.name || "Anonymous"),
    color: String(other.info?.color || "#666"),
    avatarUrl: (other.info?.picture as string | undefined) || null,
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
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold text-white overflow-hidden"
                style={{ backgroundColor: selfColor }}
              >
                {selfPicture ? (
                  // biome-ignore lint/performance/noImgElement: External avatar URLs from GitHub
                  <img
                    src={selfPicture}
                    alt={selfName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selfName.charAt(0).toUpperCase()
                )}
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
          className="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold text-white overflow-hidden"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: External avatar URLs from GitHub
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
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

interface AutoSavePluginProps {
  sessionId: string;
}

function AutoSavePlugin({ sessionId }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      const serialized = JSON.stringify(editorState.toJSON());

      if (serialized === lastSavedRef.current) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: serialized }),
          });

          if (!response.ok) {
            throw new Error("Failed to save collaborative session");
          }

          lastSavedRef.current = serialized;
        } catch (error) {
          console.error("Collaborative auto-save failed:", error);
        }
      }, 1000);
    });

    return () => {
      removeListener();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, sessionId]);

  return null;
}

// ============================================================================
// Editor Ready Status
// ============================================================================

function EditorReadyIndicator() {
  const isReady = useIsEditorReady();
  const status = useStatus();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (offline || status === "disconnected") {
    return <BrutalBadge variant="destructive" size="sm">Offline</BrutalBadge>;
  }
  if (status === "reconnecting") {
    return <BrutalBadge variant="default" size="sm">Reconnecting...</BrutalBadge>;
  }

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
      <AutoLinkOnIdlePlugin />
      <LinkPastePlugin />
      <ImagePastePlugin />
      <MarkdownPastePlugin />
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
        style={{ height: "calc(100vh - 200px)" }}
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
// Editable Title Component
// ============================================================================

interface EditableTitleProps {
  sessionId: string;
  initialTitle: string | null;
}

function EditableTitle({ sessionId, initialTitle }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || "Untitled");
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditValue(title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });

        if (response.ok) {
          setTitle(trimmed);
        }
      } catch (error) {
        console.error("Failed to update title:", error);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="h-7 max-w-[300px] border-2 border-black px-2 font-bold text-black focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
        maxLength={100}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className="font-bold text-black truncate max-w-[300px] hover:text-brutal-blue transition-colors text-left"
      title="Click to edit title"
    >
      {title}
    </button>
  );
}

// ============================================================================
// Collaborative Editor Inner
// ============================================================================

interface CollaborativeEditorInnerProps {
  roomId: string;
  sessionTitle: string | null;
  isAuthenticated: boolean | null;
  canCommitToGitHub: boolean;
  onCopyLink: () => void;
  copied: boolean;
  onShowTemplates: () => void;
  onShowFormat: () => void;
  onShowPreview: () => void;
}

function CollaborativeEditorInner({
  roomId,
  sessionTitle,
  isAuthenticated,
  canCommitToGitHub,
  onCopyLink,
  copied,
  onShowTemplates,
  onShowFormat,
  onShowPreview,
}: CollaborativeEditorInnerProps) {
  const [wordCount, setWordCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
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
      ImageNode,
    ],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  });

  const threadCount = threads?.length ?? 0;

  const handleCommitToGitHub = async () => {
    if (isCommitting) return;

    setIsCommitting(true);
    try {
      const response = await fetch(`/api/sessions/${roomId}/commit`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to commit to GitHub");
      }
    } catch (error) {
      console.error("GitHub commit failed:", error);
      alert(
        error instanceof Error ? error.message : "Failed to commit to GitHub",
      );
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <LiveblocksPlugin>
        <CollaborationProofSnapshot />
        <FloatingComposer />
        {threads && <FloatingThreads threads={threads} />}
        <FloatingToolbar>
          <Toolbar.SectionInline />
          <Toolbar.Separator />
          <Toolbar.SectionCollaboration />
        </FloatingToolbar>
        <div className="flex h-full">
          <div className="flex-1 flex flex-col border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

          {/* Header with presence - FIXED */}
          <div className="flex items-center justify-between border-b-3 border-black bg-gray-50 px-4 py-2 flex-shrink-0">
            <div className="flex items-center gap-3">
              <EditableTitle
                sessionId={roomId}
                initialTitle={sessionTitle}
              />
              <LivePresenceAvatars />
            </div>
            <div className="flex items-center gap-1">
              {/* Dashboard/Home button */}
              {isAuthenticated === true && (
                <Link
                  href="/sessions"
                  className="flex h-8 w-8 items-center justify-center border-2 border-transparent hover:border-black hover:bg-brutal-yellow transition-all"
                  title="Back to Dashboard"
                >
                  <Home className="h-4 w-4" />
                </Link>
              )}

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

              {canCommitToGitHub && (
                <button
                  type="button"
                  onClick={handleCommitToGitHub}
                  disabled={isCommitting}
                  className="flex h-8 items-center gap-1.5 border-2 border-black bg-green-400 px-3 font-bold text-sm text-black transition-all hover:bg-green-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                  title="Commit changes to GitHub"
                >
                  {isCommitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden md:inline">
                    {isCommitting ? "Committing..." : "Commit"}
                  </span>
                </button>
              )}
              
              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              {/* Copy Link */}
              <button
                type="button"
                onClick={onCopyLink}
                className="flex h-8 items-center gap-1 px-2 border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all"
                title="Copy Link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              
              {/* Conditional buttons based on auth */}
              {isAuthenticated === true ? (
                <>
                  {/* Templates */}
                  <button
                    type="button"
                    onClick={onShowTemplates}
                    className="flex h-8 items-center gap-1 px-2 border-2 border-transparent hover:border-black hover:bg-brutal-yellow transition-all"
                    title="Templates"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                  
                  {/* Customize */}
                  <button
                    type="button"
                    onClick={onShowFormat}
                    className="flex h-8 items-center gap-1 px-2 border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all"
                    title="Customize"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  
                  {/* Preview */}
                  <button
                    type="button"
                    onClick={onShowPreview}
                    className="flex h-8 items-center gap-1 px-2 border-2 border-transparent hover:border-black hover:bg-brutal-pink transition-all"
                    title="Preview"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </>
              ) : isAuthenticated === false ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = encodeURIComponent(window.location.pathname);
                    window.location.href = `/login?callbackUrl=${currentUrl}`;
                  }}
                  className="flex h-8 items-center gap-1.5 px-3 border-2 border-black bg-brutal-yellow hover:bg-brutal-yellow/80 font-bold text-sm transition-all"
                  title="Sign in to customize"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Sign in</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Toolbar - FIXED */}
          <div className="flex-shrink-0">
            <EditorToolbar />
          </div>

          {/* Editor content - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            <div className="relative">
              <EditorContentArea onWordCountChange={setWordCount} />
            </div>
          </div>

          <AutoSavePlugin sessionId={roomId} />

          {/* Status bar - FIXED */}
          <div className="flex items-center justify-between border-t-3 border-black bg-gray-50 px-4 py-3 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <BrutalBadge variant="default" size="sm">
              Collaborative
            </BrutalBadge>
          </div>
      </div>

      {/* Threads sidebar shares the editor and Liveblocks comment contexts. */}
      <ThreadsSidebar
        isOpen={showThreads}
        onClose={() => setShowThreads(false)}
      />

      {/* AI Assistant panel */}
      <AiAssistantPanel isOpen={showAi} onClose={() => setShowAi(false)} />
        </div>
      </LiveblocksPlugin>
    </LexicalComposer>
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
  isAuthenticated: boolean | null;
  canCommitToGitHub?: boolean;
  onCopyLink: () => void;
  copied: boolean;
  onShowTemplates: () => void;
  onShowFormat: () => void;
  onShowPreview: () => void;
}

export function CollaborativeEditor({
  roomId,
  sessionTitle,
  isAuthenticated,
  canCommitToGitHub = false,
  onCopyLink,
  copied,
  onShowTemplates,
  onShowFormat,
  onShowPreview,
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
          roomId={roomId}
          sessionTitle={sessionTitle ?? null}
          isAuthenticated={isAuthenticated}
          canCommitToGitHub={canCommitToGitHub}
          onCopyLink={onCopyLink}
          copied={copied}
          onShowTemplates={onShowTemplates}
          onShowFormat={onShowFormat}
          onShowPreview={onShowPreview}
        />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
