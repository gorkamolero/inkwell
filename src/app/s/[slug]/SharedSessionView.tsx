"use client";

import { X } from "lucide-react";
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
  TemplateGalleryModal,
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(!!data?.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

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
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Editor - Full Screen with internal scrolling */}
      <div className="flex-1 overflow-hidden">
        <CollaborativeEditor
          roomId={session.id}
          sessionTitle={session.title}
          isAuthenticated={isAuthenticated}
          onCopyLink={handleCopyLink}
          copied={copied}
          onShowTemplates={() => setShowTemplates(true)}
          onShowFormat={() => setShowFormat(true)}
          onShowPreview={() => setShowPreview(true)}
        />
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
                <OutputSection sessionId={session.id} />
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

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        currentConfig={formatConfig as SchemaFormatConfig}
        onApply={(newConfig) => {
          setFormatConfig(newConfig as FormatConfig);
        }}
        onCustomize={() => setShowFormat(true)}
      />
    </div>
  );
}
