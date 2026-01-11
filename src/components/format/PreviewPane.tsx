"use client";

import * as React from "react";
import { Download, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { BrutalButton, BrutalCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FormatConfig } from "./FormatPanel";

/**
 * PreviewPane - Preview of formatted output
 *
 * Shows a live preview of how the content will look with
 * the current format settings. Supports:
 * - PDF preview iframe
 * - Zoom controls
 * - Refresh/regenerate
 * - Download
 */

// =============================================================================
// Types
// =============================================================================

export type PreviewStatus = "idle" | "generating" | "ready" | "error";

export interface PreviewPaneProps {
  /** Session ID for preview generation */
  sessionId: string;
  /** Current format configuration */
  config: FormatConfig;
  /** Preview PDF URL (when ready) */
  previewUrl?: string | null;
  /** Current preview status */
  status?: PreviewStatus;
  /** Error message if status is "error" */
  error?: string | null;
  /** Callback to regenerate preview */
  onRegenerate?: () => void;
  /** Callback to download PDF */
  onDownload?: () => void;
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
  previewUrl,
  status = "idle",
  error,
  onRegenerate,
  onDownload,
  className,
}: PreviewPaneProps) {
  const [zoom, setZoom] = React.useState(100);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // TODO: Implement actual PDF preview rendering
  // TODO: Add page navigation for multi-page documents
  // TODO: Add print button
  // TODO: Add side-by-side page view
  // TODO: Add thumbnail navigation

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

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-gray-100",
        isFullscreen && "bg-gray-900",
        className
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-4 py-2",
          "border-b-3 border-black",
          "bg-white"
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
            onClick={onRegenerate}
            disabled={status === "generating"}
            loading={status === "generating"}
            loadingText="Generating..."
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </BrutalButton>

          <BrutalButton
            variant="primary"
            size="sm"
            onClick={onDownload}
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
              <BrutalButton variant="outline" onClick={onRegenerate}>
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
                "flex items-center justify-center"
              )}
            >
              <span className="text-4xl text-gray-300">PDF</span>
            </div>
            <p className="text-gray-500 mb-4">
              No preview generated yet
            </p>
            <BrutalButton variant="primary" onClick={onRegenerate}>
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
          "text-xs text-gray-500"
        )}
      >
        <span>Session: {sessionId}</span>
        <span>
          {config.page?.size || "6x9"} |{" "}
          {config.typography?.bodyFont || "Cormorant Garamond"}
        </span>
      </div>
    </div>
  );
}
