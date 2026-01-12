"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import type { EditorState, SerializedEditorState } from "lexical";

import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./EditorHeader";
import { VersionHistory } from "./VersionHistory";
import { BrutalButton } from "@/components/ui/brutal-button";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  markdownToLexical,
  lexicalToMarkdown,
  countWords,
  generateCommitMessage,
} from "@/lib/editor-utils";
import { createEditorConfig } from "@/lib/editor-config";
import { cn } from "@/lib/utils";

interface DocumentEditorProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  documentPath: string;
  documentTitle: string;
  initialContent: string;
  initialSha: string;
  hasDraft?: boolean;
  canCommit?: boolean;
}

export function DocumentEditor({
  projectId,
  projectName,
  projectSlug,
  documentPath,
  documentTitle,
  initialContent,
  initialSha,
  hasDraft = false,
  canCommit = false,
}: DocumentEditorProps): React.ReactElement {
  const router = useRouter();
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    () => {
      try {
        return markdownToLexical(initialContent);
      } catch {
        return null;
      }
    }
  );
  const [currentSha, setCurrentSha] = useState(initialSha);
  const [wordCount, setWordCount] = useState(() =>
    countWords(initialContent)
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef(initialContent);
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(hasDraft);
  const [isCommitting, setIsCommitting] = useState(false);

  // Check for mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Save function for auto-save hook
  const saveDocument = useCallback(
    async (content: string) => {
      const response = await fetch(
        `/api/documents/${projectId}/${encodeURIComponent(documentPath)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            sha: currentSha,
            message: generateCommitMessage(documentPath),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save document");
      }

      setHasUncommittedChanges(true); // Mark as having uncommitted changes
    },
    [projectId, documentPath, currentSha]
  );

  // Commit to GitHub
  const commitDocument = useCallback(async () => {
    if (!canCommit || isCommitting) return;
    
    setIsCommitting(true);
    try {
      const response = await fetch(
        `/api/documents/${projectId}/${encodeURIComponent(documentPath)}/commit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: generateCommitMessage(documentPath),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to commit");
      }

      const data = await response.json();
      setCurrentSha(data.sha);
      setHasUncommittedChanges(false);
    } catch (error) {
      console.error("Commit failed:", error);
      alert("Failed to commit to GitHub");
    } finally {
      setIsCommitting(false);
    }
  }, [projectId, documentPath, canCommit, isCommitting]);

  // Auto-save hook
  const { status, save, lastSavedAt, markChanged } =
    useAutoSave({
      data: contentRef.current,
      onSave: saveDocument,
      debounceMs: 2000,
      enabled: !isMobile, // Disable auto-save on mobile
    });

  // Handle editor changes
  const handleEditorChange = useCallback(
    (state: EditorState) => {
      const serialized = state.toJSON();
      setEditorState(serialized);

      // Convert to markdown for saving
      const markdown = lexicalToMarkdown(serialized);
      contentRef.current = markdown;

      // Update word count
      setWordCount(countWords(markdown));

      // Mark as changed for auto-save
      markChanged();
    },
    [markChanged]
  );

  // Manual save (Cmd/Ctrl+S)
  const handleManualSave = useCallback(() => {
    save();
  }, [save]);

  // Open version history
  const handleOpenHistory = useCallback(() => {
    setHistoryOpen(true);
  }, []);

  // Export document
  const handleExport = useCallback(() => {
    const markdown = contentRef.current;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [documentTitle]);

  // Delete document
  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/documents/${projectId}/${encodeURIComponent(documentPath)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sha: currentSha }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      router.push(`/projects/${projectSlug}`);
    } catch (error) {
      console.error("Delete error:", error);
      // TODO: Show error toast
    }
  }, [projectId, documentPath, currentSha, projectSlug, router]);

  // Restore from version history
  const handleRestore = useCallback(
    (commitSha: string, content: string) => {
      contentRef.current = content;

      // Update editor with restored content
      try {
        const newState = markdownToLexical(content);
        setEditorState(newState);
        setWordCount(countWords(content));
        markChanged();
      } catch (error) {
        console.error("Failed to restore version:", error);
      }
    },
    [markChanged]
  );

  const baseConfig = createEditorConfig({ includeTableNodes: true });
  const editorConfig = {
    ...baseConfig,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
  };

  // Mobile warning
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <EditorHeader
          projectName={projectName}
          projectSlug={projectSlug}
          documentTitle={documentTitle}
          saveStatus={status}
          wordCount={wordCount}
          onOpenHistory={handleOpenHistory}
          onExport={handleExport}
          onDelete={handleDelete}
          lastSavedAt={lastSavedAt}
          canCommit={canCommit}
          hasUncommittedChanges={hasUncommittedChanges}
          isCommitting={isCommitting}
          onCommit={commitDocument}
        />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="border-3 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="mb-2 text-xl font-black text-black">
              View-Only Mode
            </h2>
            <p className="mb-4 text-gray-700">
              Editing is best on a tablet or desktop. You can still view the
              document and export it.
            </p>
            <BrutalButton onClick={handleExport}>Export Markdown</BrutalButton>
          </div>

          {/* Read-only preview */}
          <div className="mt-8 w-full max-w-2xl border-3 border-gray-200 bg-white p-6 text-left">
            <pre className="whitespace-pre-wrap font-serif text-gray-700">
              {contentRef.current}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        projectName={projectName}
        projectSlug={projectSlug}
        documentTitle={documentTitle}
        saveStatus={status}
        wordCount={wordCount}
        onOpenHistory={handleOpenHistory}
        onExport={handleExport}
        onDelete={handleDelete}
        lastSavedAt={lastSavedAt}
        canCommit={canCommit}
        hasUncommittedChanges={hasUncommittedChanges}
        isCommitting={isCommitting}
        onCommit={commitDocument}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-8 py-12">
          <LexicalComposer initialConfig={editorConfig}>
            <div className="relative">
              <EditorToolbar />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={cn(
                      "prose prose-lg max-w-none",
                      "outline-none min-h-[500px] focus:outline-none",
                      "font-serif"
                    )}
                  />
                }
                placeholder={
                  <div className="pointer-events-none absolute top-0 left-0 text-gray-400">
                    Start writing...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <TablePlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <OnChangePlugin onChange={handleEditorChange} />
              <SavePlugin onSave={handleManualSave} />
            </div>
          </LexicalComposer>
        </div>
      </div>

      <VersionHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        projectId={projectId}
        documentPath={documentPath}
        onRestore={handleRestore}
      />
    </div>
  );
}

function SavePlugin({ onSave }: { onSave: () => void }): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, onSave]);

  return null;
}
