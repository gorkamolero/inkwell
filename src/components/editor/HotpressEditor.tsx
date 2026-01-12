"use client";

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
import { $createHeadingNode } from "@lexical/rich-text";
import type { SerializedEditorState } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import {
  BrutalBadge,
  BrutalButton,
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogDescription,
  BrutalDialogFooter,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalInput,
} from "@/components/ui";
import { createEditorConfig } from "@/lib/editor-config";

type ContentType = "book" | "article" | "thread" | "newsletter" | "docs";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SessionData {
  id: string;
  title: string | null;
  type: ContentType;
  content: string | null;
  shareSlug: string | null;
}

const CONTENT_TYPES: {
  value: ContentType;
  label: string;
  description: string;
}[] = [
  {
    value: "book",
    label: "Book",
    description: "Long-form writing with chapters",
  },
  { value: "article", label: "Article", description: "Blog posts and essays" },
  { value: "thread", label: "Thread", description: "Social media threads" },
];

const SAVE_STATUS_CONFIG: Record<
  SaveStatus,
  {
    variant: "default" | "success" | "destructive";
    icon?: typeof Check;
    label: string;
  }
> = {
  idle: { variant: "default", label: "Auto-saving" },
  saving: { variant: "default", icon: Loader2, label: "Saving..." },
  saved: { variant: "success", icon: Check, label: "Saved" },
  error: { variant: "destructive", label: "Save failed" },
};

function SaveStatusBadge({
  status,
}: {
  status: SaveStatus;
}): React.ReactElement {
  const config = SAVE_STATUS_CONFIG[status];
  const Icon = config.icon;
  const iconClass = status === "saving" ? "h-3 w-3 animate-spin" : "h-3 w-3";

  return (
    <BrutalBadge
      variant={config.variant}
      size="sm"
      className={Icon ? "gap-1.5" : undefined}
    >
      {Icon && <Icon className={iconClass} />}
      {config.label}
    </BrutalBadge>
  );
}

function InitialContentPlugin({ content }: { content: string | null }): null {
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
      p1.append(
        $createTextNode(
          "This is Hotpress. Write here, collaborate in real-time, and publish anywhere.",
        ),
      );
      root.append(p1);

      // Second paragraph
      const p2 = $createParagraphNode();
      p2.append(
        $createTextNode(
          "Your content saves automatically. Share the link to collaborate.",
        ),
      );
      root.append(p2);
    });
  }, [editor, content]);

  return null;
}

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
}): null {
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

function WordCountPlugin({
  onWordCountChange,
}: {
  onWordCountChange: (count: number) => void;
}): null {
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

function TypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: ContentType;
  onChange: (type: ContentType) => void;
  disabled: boolean;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const currentType =
    CONTENT_TYPES.find((t) => t.value === value) || CONTENT_TYPES[0];

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
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {CONTENT_TYPES.map((type) => (
              <button
                type="button"
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

export function HotpressEditor(): React.ReactElement {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [wordCount, setWordCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get or create session on mount
  useEffect(() => {
    if (!isMounted || session || isCreatingSession) return;

    const initSession = async () => {
      setIsCreatingSession(true);
      try {
        // First, check for existing session in cookie
        const currentResponse = await fetch("/api/sessions?current=true");
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          if (currentData.session) {
            setSession({
              id: currentData.session.id,
              title: currentData.session.title,
              type: currentData.session.type,
              content: currentData.session.content,
              shareSlug: currentData.session.shareSlug,
            });
            return;
          }
        }

        // No existing session, create a new one
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
        console.error("Failed to initialize session:", error);
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
    [session],
  );

  // Handle share button click - opens dialog
  const handleShare = useCallback(() => {
    if (!session) return;

    // If we already have a share slug, show it
    if (session.shareSlug) {
      setShareUrl(`${window.location.origin}/s/${session.shareSlug}`);
    }
    setShareDialogOpen(true);
  }, [session]);

  // Create share link via API
  const handleCreateShareLink = useCallback(async () => {
    if (!session) return;

    setIsCreatingShare(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setSession((prev) =>
        prev ? { ...prev, shareSlug: data.shareSlug } : null,
      );
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setIsCreatingShare(false);
    }
  }, [session]);

  // Copy share URL to clipboard
  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [shareUrl]);

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
    // Reset to idle after 3 seconds
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, []);

  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  const editorConfig = useMemo(() => createEditorConfig(), []);

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
          <TypeSelector
            value={session.type}
            onChange={handleTypeChange}
            disabled={saveStatus === "saving"}
          />

          {/* Word count */}
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <SaveStatusBadge status={saveStatus} />

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 border-3 border-black bg-brutal-blue px-3 py-1.5 font-bold text-white shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Share Dialog */}
      <BrutalDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <BrutalDialogContent className="max-w-md">
          <BrutalDialogHeader>
            <BrutalDialogTitle>Share Session</BrutalDialogTitle>
            <BrutalDialogDescription>
              Share this writing session with others. Anyone with the link can
              view and edit.
            </BrutalDialogDescription>
          </BrutalDialogHeader>

          <div className="space-y-4 py-4">
            {shareUrl ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <BrutalInput
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <BrutalButton
                    variant="primary"
                    size="icon"
                    onClick={handleCopyShareUrl}
                    title={shareCopied ? "Copied!" : "Copy link"}
                  >
                    {shareCopied ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Copy className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </BrutalButton>
                </div>
                {shareCopied && (
                  <p className="text-sm text-green-600 font-medium">
                    Link copied to clipboard!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Share2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  Generate a link to share this session with collaborators
                </p>
                <BrutalButton
                  variant="primary"
                  onClick={handleCreateShareLink}
                  disabled={isCreatingShare}
                >
                  {isCreatingShare ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Share Link"
                  )}
                </BrutalButton>
              </div>
            )}
          </div>

          <BrutalDialogFooter>
            <BrutalButton
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Done
            </BrutalButton>
          </BrutalDialogFooter>
        </BrutalDialogContent>
      </BrutalDialog>
    </div>
  );
}
