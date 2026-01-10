"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, MoreHorizontal } from "lucide-react";
import type { SerializedEditorState } from "lexical";
import { Editor } from "./editor";
import type { EditorDocument } from "@/types";

interface EditorContainerProps {
  document: EditorDocument;
  projectSlug: string;
}

export function EditorContainer({
  document,
  projectSlug,
}: EditorContainerProps) {
  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = useCallback(
    async (content: SerializedEditorState) => {
      setIsSaving(true);

      try {
        await fetch(`/api/documents/${document.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
          }),
        });

        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save document:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [document.id, title]
  );

  return (
    <>
      {/* Editor Header */}
      <header className="flex h-14 items-center justify-between border-b-4 border-black bg-white px-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectSlug}`}
            className="flex items-center gap-2 font-bold text-gray-700 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 text-lg font-bold text-black focus:outline-none focus:ring-0"
            placeholder="Untitled"
          />
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => handleSave(document.content as SerializedEditorState)}
            disabled={isSaving}
            className="flex items-center gap-2 border-4 border-black bg-yellow-400 px-4 py-1.5 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="border-4 border-black p-1.5 transition-all hover:bg-gray-50"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-8 py-12">
          <Editor
            initialContent={document.content}
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  );
}
