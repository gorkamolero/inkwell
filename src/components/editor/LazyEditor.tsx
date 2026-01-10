"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading skeleton for the editor
function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      {/* Header skeleton */}
      <header className="flex items-center justify-between border-b-4 border-gray-300 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 border-2 border-gray-300" />
          <div className="h-6 w-48 bg-gray-200 border-2 border-gray-300" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-gray-100 border-2 border-gray-200" />
        </div>
      </header>

      {/* Loading indicator */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="flex h-20 w-20 items-center justify-center border-4 border-black bg-brutal-yellow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Loader2
            className="h-10 w-10 animate-spin text-black"
            strokeWidth={2.5}
          />
        </div>
        <p className="text-lg font-bold text-black">Loading editor...</p>
        <p className="text-sm text-gray-500">
          Preparing your document for editing
        </p>
      </div>
    </div>
  );
}

// Dynamically import the editor with no SSR
export const LazyDocumentEditor = dynamic(
  () =>
    import("./DocumentEditor").then((mod) => ({
      default: mod.DocumentEditor,
    })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);
