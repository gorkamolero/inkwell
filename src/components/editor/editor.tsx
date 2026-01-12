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
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import type { SerializedEditorState } from "lexical";
import type React from "react";
import { useEffect } from "react";
import { createEditorConfig } from "@/lib/editor-config";
import { EditorToolbar } from "./editor-toolbar";

interface EditorProps {
  initialContent: SerializedEditorState | null;
  onSave?: (content: SerializedEditorState) => void;
}

const editorConfig = createEditorConfig({ includeTableNodes: true });

function SavePlugin({
  onSave,
}: {
  onSave?: (content: SerializedEditorState) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (onSave) {
          const editorState = editor.getEditorState();
          onSave(editorState.toJSON());
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, onSave]);

  return null;
}

function InitialContentPlugin({
  initialContent,
}: {
  initialContent: SerializedEditorState | null;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialContent) {
      const editorState = editor.parseEditorState(initialContent);
      editor.setEditorState(editorState);
    }
  }, [editor, initialContent]);

  return null;
}

export function Editor({
  initialContent,
  onSave,
}: EditorProps): React.ReactElement {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="relative">
        <EditorToolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="prose prose-lg max-w-none outline-none min-h-[500px] focus:outline-none" />
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
        <SavePlugin onSave={onSave} />
        <InitialContentPlugin initialContent={initialContent} />
      </div>
    </LexicalComposer>
  );
}
