"use client";

import { Editor } from "@/components/editor/editor";

export function LiveEditor() {
  return (
    <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <Editor initialContent={null} />
    </div>
  );
}
