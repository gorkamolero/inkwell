"use client";

import { Download, Maximize2, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";
import { BrutalButton, BrutalCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FormatConfig } from "@/lib/format-schema";

/**
 * PreviewPane - PDF Preview with integrated API calls
 *
 * Shows a live preview of how the content will look with
 * the current format settings. Handles its own state and API calls.
 */

// =============================================================================
// Types
// =============================================================================

export type PreviewStatus = "idle" | "generating" | "ready" | "error";

interface PreviewResponse {
  previewUrl: string;
  pageCount: number;
  generatedAt: string;
  quality: "draft" | "preview";
  expiresAt: string;
}

export interface PreviewPaneProps {
  /** Session ID for preview generation */
  sessionId: string;
  /** Current format configuration (for display in status bar) */
  config?: Partial<FormatConfig>;
  /** Auto-generate preview on mount */
  autoGenerate?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

// =============================================================================
// Component
// =============================================================================

export function PreviewPane({
  sessionId,
  config,
  autoGenerate = false,
  className,
}: PreviewPaneProps) {
  const [zoom, setZoom] = React.useState(100);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [status, setStatus] = React.useState<PreviewStatus>("idle");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Generate preview via API
  const generatePreview = React.useCallback(async () => {
    if (!sessionId) return;

    setStatus("generating");
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality: "preview" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate preview");
      }

      const data: PreviewResponse = await response.json();
      setPreviewUrl(data.previewUrl);
      setPageCount(data.pageCount);
      setStatus("ready");
    } catch (err) {
      console.error("Preview generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate preview");
      setStatus("error");
    }
  }, [sessionId]);

  // Download PDF
  const downloadPdf = React.useCallback(() => {
    if (!previewUrl) return;

    try {
      // Extract base64 from data URL and convert to blob
      const base64 = previewUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `preview-${sessionId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [previewUrl, sessionId]);

  // Auto-generate on mount if enabled
  React.useEffect(() => {
    if (autoGenerate && sessionId && status === "idle") {
      generatePreview();
    }
  }, [autoGenerate, sessionId, status, generatePreview]);

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Get display values from config
  const pageSize = config?.page?.size || "6x9";
  const bodyFont = config?.typography?.body?.font || "Cormorant Garamond";

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-gray-100",
        isFullscreen && "bg-gray-900",
        className,
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-4 py-2",
          "border-b-3 border-black",
          "bg-white",
        )}
      >
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </BrutalButton>

          <span className="w-16 text-center text-sm font-bold">{zoom}%</span>

          <BrutalButton
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </BrutalButton>
        </div>

        <div className="flex items-center gap-2">
          <BrutalButton
            variant="ghost"
            size="icon-sm"
            onClick={handleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="h-4 w-4" />
          </BrutalButton>

          <BrutalButton
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={status === "generating"}
            loading={status === "generating"}
            loadingText="Generating..."
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {status === "idle" ? "Generate" : "Refresh"}
          </BrutalButton>

          <BrutalButton
            variant="primary"
            size="sm"
            onClick={downloadPdf}
            disabled={status !== "ready" || !previewUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </BrutalButton>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4">
        {status === "generating" && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-black border-t-brutal-yellow animate-spin" />
            <p className="mt-4 font-bold">Generating preview...</p>
            <p className="text-sm text-gray-500 mt-1">
              This may take a few seconds
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full">
            <BrutalCard className="max-w-md text-center" accent="red">
              <h3 className="font-bold text-lg mb-2">Preview Error</h3>
              <p className="text-sm text-gray-600 mb-4">
                {error || "Failed to generate preview. Please try again."}
              </p>
              <BrutalButton variant="outline" onClick={generatePreview}>
                Try Again
              </BrutalButton>
            </BrutalCard>
          </div>
        )}

        {status === "ready" && previewUrl && (
          <div
            className="mx-auto transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {/* PDF displayed via iframe with data URL */}
            <iframe
              src={previewUrl}
              className="w-[612px] h-[792px] border-4 border-black shadow-[8px_8px_0_0_#000] bg-white"
              title="PDF Preview"
            />
          </div>
        )}

        {status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full">
            <div
              className={cn(
                "w-32 h-40 mb-4",
                "border-3 border-dashed border-gray-300",
                "flex items-center justify-center",
              )}
            >
              <span className="text-4xl text-gray-300">PDF</span>
            </div>
            <p className="text-gray-500 mb-4">No preview generated yet</p>
            <BrutalButton variant="primary" onClick={generatePreview}>
              Generate Preview
            </BrutalButton>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-4 py-2",
          "border-t-3 border-black",
          "bg-white",
          "text-xs text-gray-500",
        )}
      >
        <span>
          {status === "ready" && pageCount > 0
            ? `${pageCount} page${pageCount !== 1 ? "s" : ""}`
            : `Session: ${sessionId.slice(0, 8)}...`}
        </span>
        <span>
          {pageSize} | {bodyFont}
        </span>
      </div>
    </div>
  );
}
