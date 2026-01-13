"use client";

import { Check, Copy, ExternalLink, FileText, Settings, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import {
  BackMatterSection,
  ChapterSection,
  ElementsSection,
  FormatPanel,
  FrontMatterSection,
  HeadersFootersSection,
  MetadataSection,
  OutputSection,
  PageLayoutSection,
  PreviewPane,
  SceneBreaksSection,
  ThemeSection,
  TypographySection,
  type FormatConfig,
} from "@/components/format";
import type { FormatConfig as SchemaFormatConfig } from "@/lib/format-schema";

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
  const [showPreview, setShowPreview] = useState(false);
  const [showFormat, setShowFormat] = useState(false);

  // Format config state
  const [formatConfig, setFormatConfig] = useState<FormatConfig>(
    (session.formatConfig as FormatConfig) || {}
  );
  const [originalConfig, setOriginalConfig] = useState<FormatConfig>(
    (session.formatConfig as FormatConfig) || {}
  );
  const [saving, setSaving] = useState(false);

  // Check if config has changed
  const hasChanges =
    JSON.stringify(formatConfig) !== JSON.stringify(originalConfig);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  // Save format config to API
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/format`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to save format config");
      }

      setOriginalConfig(formatConfig);
    } catch (error) {
      console.error("Failed to save format config:", error);
    } finally {
      setSaving(false);
    }
  }, [session.id, formatConfig]);

  // Reset to original config
  const handleReset = useCallback(() => {
    setFormatConfig(originalConfig);
  }, [originalConfig]);

  // Update config on prop change
  useEffect(() => {
    if (session.formatConfig) {
      const newConfig = session.formatConfig as FormatConfig;
      setFormatConfig(newConfig);
      setOriginalConfig(newConfig);
    }
  }, [session.formatConfig]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black tracking-tight text-black"
          >
            HOTPRESS
          </Link>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 md:gap-2 border-3 border-black bg-white px-2 md:px-3 py-1.5 text-sm md:text-base font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowFormat(true)}
              className="flex items-center gap-1.5 md:gap-2 border-3 border-black bg-white px-2 md:px-3 py-1.5 text-sm md:text-base font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Format</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 md:gap-2 border-3 border-black bg-brutal-pink px-2 md:px-3 py-1.5 text-sm md:text-base font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 border-3 border-black bg-brutal-yellow px-3 py-1.5 font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]"
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

      {/* Format Panel Overlay */}
      {showFormat && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l-4 border-black shadow-[-8px_0_0_0_#000]">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-3 border-black bg-brutal-blue text-white">
              <h2 className="text-lg font-black">Format Settings</h2>
              <button
                type="button"
                onClick={() => setShowFormat(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Format Panel Content */}
            <div className="h-[calc(100%-56px)]">
              <FormatPanel
                config={formatConfig}
                onConfigChange={setFormatConfig}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
                hasChanges={hasChanges}
              >
                {/* Theme Section (First - Quick Apply) */}
                <ThemeSection defaultExpanded />

                {/* Metadata Section */}
                <MetadataSection />

                {/* Typography Section */}
                <TypographySection />

                {/* Chapter Section */}
                <ChapterSection />

                {/* Page Layout Section */}
                <PageLayoutSection />

                {/* Headers & Footers Section */}
                <HeadersFootersSection />

                {/* Scene Breaks Section */}
                <SceneBreaksSection />

                {/* Special Elements Section */}
                <ElementsSection />

                {/* Front Matter Section */}
                <FrontMatterSection />

                {/* Back Matter Section */}
                <BackMatterSection />

                {/* Output Section */}
                <OutputSection />
              </FormatPanel>
            </div>
          </div>
        </div>
      )}

      {/* Preview Panel Overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white border-l-4 border-black shadow-[-8px_0_0_0_#000]">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-3 border-black bg-brutal-yellow">
              <h2 className="text-lg font-black">PDF Preview</h2>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-black/10 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="h-[calc(100%-56px)]">
              <PreviewPane
                sessionId={session.id}
                config={formatConfig as unknown as Partial<SchemaFormatConfig>}
                autoGenerate={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
