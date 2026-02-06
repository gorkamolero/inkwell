"use client";

import { Clock, GitCommit, Loader2, RotateCcw, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrutalButton } from "@/components/ui/brutal-button";
import { formatRelativeTime } from "@/lib/editor-utils";
import type { CommitInfo } from "@/lib/github-app";
import { cn } from "@/lib/utils";

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  documentPath: string;
  onRestore: (commitSha: string, content: string) => void;
}

export function VersionHistory({
  isOpen,
  onClose,
  projectId,
  documentPath,
  onRestore,
}: VersionHistoryProps) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Fetch commit history
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/documents/${projectId}/${encodeURIComponent(documentPath)}/history`,
      );

      if (!response.ok) {
        throw new Error("Failed to load version history");
      }

      const data = await response.json();
      setCommits(data.commits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [projectId, documentPath]);

  // Fetch content at a specific commit
  const fetchVersionContent = useCallback(
    async (commitSha: string) => {
      setPreviewLoading(true);

      try {
        const response = await fetch(
          `/api/documents/${projectId}/${encodeURIComponent(
            documentPath,
          )}/version/${commitSha}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load version");
        }

        const data = await response.json();
        setPreviewContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load version");
      } finally {
        setPreviewLoading(false);
      }
    },
    [projectId, documentPath],
  );

  // Handle commit selection
  const handleSelectCommit = (commit: CommitInfo) => {
    setSelectedCommit(commit);
    fetchVersionContent(commit.sha);
  };

  // Handle restore
  const handleRestore = async () => {
    if (!selectedCommit || !previewContent) return;

    setRestoring(true);
    try {
      onRestore(selectedCommit.sha, previewContent);
      onClose();
    } finally {
      setRestoring(false);
    }
  };

  // Load history when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setSelectedCommit(null);
      setPreviewContent(null);
    }
  }, [isOpen, fetchHistory]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 top-0 z-50 w-full max-w-xl",
          "border-l-4 border-black bg-white",
          "flex flex-col",
          "animate-in slide-in-from-right duration-300",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-4 border-black px-6 py-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-black">
            <GitCommit className="h-5 w-5" />
            Version History
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white transition-all hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Commit list */}
          <div
            className={cn(
              "w-full overflow-y-auto border-r-2 border-gray-200",
              selectedCommit && "w-1/2",
            )}
          >
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="border-3 border-red-500 bg-red-50 p-4 m-4">
                <p className="text-sm font-bold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="mt-2 text-sm font-bold text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && commits.length === 0 && (
              <div className="p-8 text-center">
                <GitCommit className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="font-bold text-gray-500">No version history</p>
                <p className="mt-1 text-sm text-gray-400">
                  Changes will appear here after saving
                </p>
              </div>
            )}

            {!loading && !error && commits.length > 0 && (
              <div className="divide-y-2 divide-gray-100">
                {commits.map((commit, index) => (
                  <button
                    type="button"
                    key={commit.sha}
                    onClick={() => handleSelectCommit(commit)}
                    className={cn(
                      "w-full px-4 py-4 text-left transition-colors",
                      selectedCommit?.sha === commit.sha
                        ? "bg-brutal-yellow"
                        : "hover:bg-gray-50",
                    )}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-bold text-black">
                        {commit.message}
                      </p>
                      {index === 0 && (
                        <span className="shrink-0 border-2 border-black bg-brutal-green px-2 py-0.5 text-xs font-bold uppercase text-black">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {commit.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(new Date(commit.date))}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {commit.sha.slice(0, 7)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          {selectedCommit && (
            <div className="flex w-1/2 flex-col overflow-hidden">
              {/* Preview header */}
              <div className="shrink-0 border-b-2 border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCommit(null);
                      setPreviewContent(null);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-black"
                  >
                    Close preview
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs text-gray-600">
                  {selectedCommit.sha.slice(0, 7)} -{" "}
                  {formatRelativeTime(new Date(selectedCommit.date))}
                </p>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-y-auto p-4">
                {previewLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                )}

                {!previewLoading && previewContent && (
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
                    {previewContent}
                  </pre>
                )}
              </div>

              {/* Restore button */}
              <div className="shrink-0 border-t-3 border-black bg-white p-4">
                <BrutalButton
                  variant="primary"
                  className="w-full"
                  onClick={handleRestore}
                  disabled={restoring || !previewContent}
                >
                  {restoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Restore this version
                    </>
                  )}
                </BrutalButton>
                <p className="mt-2 text-center text-xs text-gray-500">
                  This will replace your current content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
