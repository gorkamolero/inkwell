"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  History,
  Download,
  Trash2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/hooks/useAutoSave";
import {
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalDialogDescription,
  BrutalDialogFooter,
} from "@/components/ui/brutal-dialog";
import { BrutalButton } from "@/components/ui/brutal-button";

interface EditorHeaderProps {
  projectName: string;
  projectSlug: string;
  documentTitle: string;
  saveStatus: SaveStatus;
  wordCount: number;
  onOpenHistory: () => void;
  onExport: () => void;
  onDelete: () => void;
  lastSavedAt: Date | null;
}

export function EditorHeader({
  projectName,
  projectSlug,
  documentTitle,
  saveStatus,
  wordCount,
  onOpenHistory,
  onExport,
  onDelete,
  lastSavedAt,
}: EditorHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setMenuOpen(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b-4 border-black bg-white px-4">
        {/* Left section: Back button, project name, doc title */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectSlug}`}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white transition-all hover:bg-gray-100"
            title="Back to project"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href={`/projects/${projectSlug}`}
              className="font-bold text-gray-600 hover:text-black hover:underline"
            >
              {projectName}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-bold text-black">{documentTitle}</span>
          </nav>
        </div>

        {/* Center section: Save status */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        {/* Right section: Word count, more menu */}
        <div className="flex items-center gap-3">
          {/* Word count */}
          <div className="hidden items-center gap-1.5 text-sm text-gray-500 sm:flex">
            <FileText className="h-4 w-4" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white transition-all hover:bg-gray-100"
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full z-50 mt-2 w-48 border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-black transition-colors hover:bg-gray-100"
                  >
                    <History className="h-4 w-4" />
                    Version History
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onExport();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-black transition-colors hover:bg-gray-100"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <div className="border-t-2 border-gray-100" />
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Delete confirmation dialog */}
      <BrutalDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <BrutalDialogContent>
          <BrutalDialogHeader>
            <BrutalDialogTitle>Delete Document</BrutalDialogTitle>
            <BrutalDialogDescription>
              Are you sure you want to delete &quot;{documentTitle}&quot;? This
              will remove it from GitHub and cannot be undone.
            </BrutalDialogDescription>
          </BrutalDialogHeader>
          <BrutalDialogFooter>
            <BrutalButton
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </BrutalButton>
            <BrutalButton variant="destructive" onClick={confirmDelete}>
              Delete
            </BrutalButton>
          </BrutalDialogFooter>
        </BrutalDialogContent>
      </BrutalDialog>
    </>
  );
}

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
}

function SaveStatusIndicator({ status, lastSavedAt }: SaveStatusIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-none border-2 px-3 py-1 text-xs font-bold transition-all",
        {
          "border-gray-300 bg-gray-50 text-gray-500": status === "idle",
          "border-yellow-500 bg-yellow-50 text-yellow-700": status === "saving",
          "border-green-500 bg-green-50 text-green-700": status === "saved",
          "border-orange-500 bg-orange-50 text-orange-700":
            status === "unsaved",
          "border-red-500 bg-red-50 text-red-700": status === "error",
        }
      )}
    >
      {status === "idle" && lastSavedAt && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved at {formatTime(lastSavedAt)}</span>
        </>
      )}
      {status === "idle" && !lastSavedAt && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Unsaved changes</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}
