"use client";

import { ChevronRight, Download, Upload } from "lucide-react";
import * as React from "react";
import { BrutalButton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * FormatPanel - Main formatting panel container
 *
 * Container component for all formatting sections. Handles:
 * - Collapsible section navigation
 * - Section state management
 * - Save/reset actions
 */

// =============================================================================
// Types
// =============================================================================

export interface FormatConfig {
  /** Theme settings */
  theme?: {
    preset?: string | null;
  };
  /** Metadata settings */
  meta?: {
    title?: string;
    subtitle?: string;
    author?: string;
    series?: {
      name?: string;
      number?: number;
    };
    language?: string;
    isbn?: string;
    tags?: string[];
  };
  /** Typography settings */
  typography?: {
    body?: {
      font?: string;
      size?: string;
      lineHeight?: number;
    };
    headings?: {
      font?: string;
      size?: string;
    };
    paragraph?: {
      indent?: string;
      spacing?: string;
      firstParagraphIndent?: boolean;
    };
    // Legacy flat properties for backwards compatibility
    bodyFont?: string;
    headingFont?: string;
    bodySize?: string;
    lineHeight?: number;
  };
  /** Chapter settings */
  chapters?: {
    numbering?: {
      enabled?: boolean;
      format?: string;
    };
    title?: {
      font?: string;
      size?: string;
      align?: string;
      transform?: string;
    };
    subtitle?: {
      enabled?: boolean;
      font?: string;
      style?: string;
    };
    startOn?: string;
    ornament?: {
      enabled?: boolean;
      image?: string;
      spacing?: string;
    };
    // Legacy flat properties
    numberingEnabled?: boolean;
    numberingFormat?: string;
    dropCapsEnabled?: boolean;
    dropCapsLines?: number;
  };
  /** Drop caps settings */
  dropCaps?: {
    enabled?: boolean;
    lines?: number;
    font?: string;
    style?: string;
  };
  /** Scene breaks settings */
  sceneBreaks?: {
    ornament?: string;
    customImage?: string | null;
    spacing?: string;
  };
  /** Headers settings */
  headers?: {
    enabled?: boolean;
    left?: string;
    right?: string;
    font?: string;
    size?: string;
    transform?: string;
    hideOnChapterStart?: boolean;
  };
  /** Footers settings */
  footers?: {
    enabled?: boolean;
    pageNumber?: {
      position?: string;
      format?: string;
    };
    ornament?: string | null;
  };
  /** Page layout settings */
  page?: {
    size?: string;
    width?: string;
    height?: string;
    margins?: {
      top?: string;
      bottom?: string;
      outer?: string;
      gutter?: string;
    };
  };
  /** Front matter items */
  frontMatter?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  /** Back matter items */
  backMatter?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  /** Special elements */
  elements?: {
    blockquote?: {
      font?: string;
      style?: string;
      indent?: string;
    };
    verse?: {
      font?: string;
      style?: string;
      align?: string;
    };
    callout?: {
      enabled?: boolean;
      border?: string;
      background?: string;
    };
    footnotes?: {
      style?: string;
      numbering?: string;
    };
  };
  /** Output settings */
  output?: {
    formats?: string[];
    pdf?: {
      colorProfile?: string;
      bleed?: string;
    };
    epub?: {
      coverImage?: string;
      tocDepth?: number;
    };
  };
}

export interface FormatPanelProps {
  /** Current format configuration */
  config: FormatConfig;
  /** Callback when config changes */
  onConfigChange: (config: FormatConfig) => void;
  /** Callback to save config */
  onSave: () => Promise<void>;
  /** Callback to reset to defaults */
  onReset: () => void;
  /** Whether save is in progress */
  saving?: boolean;
  /** Whether there are unsaved changes */
  hasChanges?: boolean;
  /** Child section components */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Context
// =============================================================================

interface FormatContextValue {
  config: FormatConfig;
  updateConfig: (partial: Partial<FormatConfig>) => void;
}

const FormatContext = React.createContext<FormatContextValue | null>(null);

export function useFormatContext() {
  const context = React.useContext(FormatContext);
  if (!context) {
    throw new Error("useFormatContext must be used within a FormatPanel");
  }
  return context;
}

// =============================================================================
// Subcomponents
// =============================================================================

interface FormatSectionProps {
  /** Section title */
  title: string;
  /** Section icon */
  icon?: React.ReactNode;
  /** Whether section is initially expanded */
  defaultExpanded?: boolean;
  /** Section content */
  children: React.ReactNode;
}

export function FormatSection({
  title,
  icon,
  defaultExpanded = false,
  children,
}: FormatSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-3",
          "font-bold text-left",
          "hover:bg-gray-50",
          "transition-colors duration-100",
        )}
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronRight
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function FormatPanel({
  config,
  onConfigChange,
  onSave,
  onReset,
  saving = false,
  hasChanges = false,
  children,
  className,
}: FormatPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateConfig = React.useCallback(
    (partial: Partial<FormatConfig>) => {
      onConfigChange({ ...config, ...partial });
    },
    [config, onConfigChange],
  );

  const contextValue = React.useMemo(
    () => ({ config, updateConfig }),
    [config, updateConfig],
  );

  // Export config as JSON file
  const handleExport = React.useCallback(() => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hotpress-format.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config]);

  // Import config from JSON file
  const handleImport = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content) as FormatConfig;
          onConfigChange(imported);
        } catch (error) {
          console.error("Failed to import format config:", error);
          alert("Invalid format file. Please select a valid hotpress-format.json file.");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be selected again
      event.target.value = "";
    },
    [onConfigChange],
  );

  return (
    <FormatContext.Provider value={contextValue}>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Unsaved indicator */}
        {hasChanges && (
          <div className="px-4 py-2 bg-brutal-yellow border-b-2 border-black">
            <span className="text-xs font-bold">Unsaved changes</span>
          </div>
        )}

        {/* Sections */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children || (
            <div className="p-4 text-center text-gray-500">
              <p>No format sections configured</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-4 py-3 border-t-3 border-black bg-white">
          {/* Import/Export Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
            >
              <Upload className="h-3 w-3" />
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {/* Save/Reset Row */}
          <div className="flex items-center justify-between gap-3">
            <BrutalButton
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={saving || !hasChanges}
            >
              Reset
            </BrutalButton>
            <BrutalButton
              variant="primary"
              size="sm"
              onClick={onSave}
              loading={saving}
              loadingText="Saving..."
              disabled={!hasChanges}
            >
              Save Changes
            </BrutalButton>
          </div>
        </div>
      </div>
    </FormatContext.Provider>
  );
}
