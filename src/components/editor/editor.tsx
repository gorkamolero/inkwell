"use client";

import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import type { SerializedEditorState } from "lexical";
import { EditorToolbar } from "./editor-toolbar";

interface EditorProps {
  initialContent: SerializedEditorState | null;
  onSave?: (content: SerializedEditorState) => void;
}

const editorConfig = {
  namespace: "HotpressEditor",
  theme: {
    root: "hotpress-editor",
    paragraph: "mb-4",
    heading: {
      h1: "text-4xl font-black mb-6 mt-8",
      h2: "text-3xl font-bold mb-4 mt-6",
      h3: "text-2xl font-bold mb-3 mt-5",
      h4: "text-xl font-bold mb-2 mt-4",
      h5: "text-lg font-bold mb-2 mt-3",
      h6: "text-base font-bold mb-2 mt-3",
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
    code: "font-mono bg-gray-900 text-gray-100 p-4 rounded-none border-4 border-black my-4 overflow-x-auto",
    link: "text-blue-600 underline hover:text-blue-800",
    table: "w-full border-collapse border-4 border-black my-4",
    tableCell: "border-2 border-black p-2",
    tableCellHeader: "border-2 border-black p-2 bg-gray-100 font-bold",
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
  onError: (error: Error) => {
    console.error("Lexical error:", error);
  },
};

function SavePlugin({ onSave }: { onSave?: (content: SerializedEditorState) => void }) {
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

export function Editor({ initialContent, onSave }: EditorProps) {
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
