"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";

// Types
interface SessionData {
  id: string;
  title: string | null;
  type: string;
  content: string | null;
  formatConfig: Record<string, unknown> | null;
  passwordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SharedSessionViewProps {
  session: SessionData;
}

// ============================================================================
// Main Component
// ============================================================================

export function SharedSessionView({ session }: SharedSessionViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-black"
          >
            HOTPRESS
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 border-3 border-black bg-white px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 border-3 border-black bg-brutal-yellow px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              <ExternalLink className="h-4 w-4" />
              Create Your Own
            </Link>
          </div>
        </div>

        {/* Editor */}
        <div className="mx-auto max-w-4xl">
          <CollaborativeEditor
            roomId={session.id}
            sessionTitle={session.title}
          />
        </div>
      </div>
    </div>
  );
}
