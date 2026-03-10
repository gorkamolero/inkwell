"use client";

import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NewDocumentPageClientProps {
  projectId: string;
}

export default function NewDocumentPageClient({
  projectId,
}: NewDocumentPageClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError(null);

    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          path: `${filename}.md`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create document");
      }

      const { document } = await response.json();
      router.push(`/${projectId}/${document.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/projects/${projectId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="border-3 border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <h1 className="text-2xl font-black">New Document</h1>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-black">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter 1: Introduction"
                className="w-full border-3 border-black bg-white px-4 py-3 font-medium focus:outline-none focus:shadow-[4px_4px_0_0_#000000]"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="flex w-full items-center justify-center gap-2 border-3 border-black bg-brutal-yellow px-6 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Document"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
