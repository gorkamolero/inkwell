"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BrutalButton,
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogDescription,
  BrutalDialogFooter,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalInput,
} from "@/components/ui";
import { generateDocumentSlug } from "@/lib/slugs";

interface DocumentUrlActionsProps {
  documentId: string;
  initialSlug: string;
  projectId: string;
  projectPublicSlug: string;
}

function buildDocumentPath(projectPublicSlug: string, documentSlug: string) {
  return `/${projectPublicSlug}/${documentSlug}`;
}

export function DocumentUrlActions({
  documentId,
  initialSlug,
  projectId,
  projectPublicSlug,
}: DocumentUrlActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [draftSlug, setDraftSlug] = useState(initialSlug);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrentSlug(initialSlug);
    setDraftSlug(initialSlug);
  }, [initialSlug]);

  const previewSlug = useMemo(
    () => generateDocumentSlug({ title: draftSlug }),
    [draftSlug],
  );
  const currentPath = buildDocumentPath(projectPublicSlug, currentSlug);
  const previewPath = buildDocumentPath(projectPublicSlug, previewSlug);

  async function handleCopy() {
    try {
      const url = new URL(currentPath, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("Failed to copy document URL:", copyError);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug: draftSlug }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update document URL");
      }

      const nextSlug = data.document?.slug ?? previewSlug;
      setCurrentSlug(nextSlug);
      setDraftSlug(nextSlug);
      setOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update document URL",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BrutalButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setDraftSlug(currentSlug);
          setError(null);
          setOpen(true);
        }}
      >
        <Link2 className="h-3.5 w-3.5" />
        URL
      </BrutalButton>

      <BrutalDialog open={open} onOpenChange={setOpen}>
        <BrutalDialogContent className="max-w-lg">
          <BrutalDialogHeader>
            <BrutalDialogTitle>Document URL</BrutalDialogTitle>
            <BrutalDialogDescription>
              Set a readable URL for this existing document.
            </BrutalDialogDescription>
          </BrutalDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Current URL
              </label>
              <div className="flex gap-2">
                <BrutalInput
                  readOnly
                  value={currentPath}
                  className="font-mono text-sm"
                />
                <BrutalButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </BrutalButton>
              </div>
            </div>

            <BrutalInput
              label="Readable Slug"
              value={draftSlug}
              onChange={(event) => setDraftSlug(event.target.value)}
              errorMessage={error ?? undefined}
              helperText="Letters, numbers, and hyphens only. A numeric suffix is added if the slug is already taken."
            />

            <div className="border-3 border-black bg-gray-50 p-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                Preview
              </div>
              <div className="font-mono text-sm text-black">{previewPath}</div>
            </div>
          </div>

          <BrutalDialogFooter>
            <BrutalButton
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </BrutalButton>
            <BrutalButton
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={saving || isPending}
            >
              Save URL
            </BrutalButton>
          </BrutalDialogFooter>
        </BrutalDialogContent>
      </BrutalDialog>
    </>
  );
}
