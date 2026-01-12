"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { BrutalButton, BrutalCard } from "@/components/ui";
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
  /** Typography settings */
  typography?: {
    bodyFont?: string;
    headingFont?: string;
    bodySize?: string;
    lineHeight?: number;
  };
  /** Chapter settings */
  chapters?: {
    numberingEnabled?: boolean;
    numberingFormat?: string;
    dropCapsEnabled?: boolean;
    dropCapsLines?: number;
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
    <div className="border-b-3 border-black last:border-b-0">
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
  // TODO: Implement theme/preset selection
  // TODO: Add import/export for hotpress.yaml
  // TODO: Add live preview updates
  // TODO: Add undo/redo for config changes

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

  return (
    <FormatContext.Provider value={contextValue}>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-3 border-black bg-white">
          <h2 className="text-lg font-black">Format Settings</h2>
          {hasChanges && (
            <span className="px-2 py-1 text-xs font-bold bg-brutal-yellow border-2 border-black">
              Unsaved
            </span>
          )}
        </div>

        {/* Sections */}
        <BrutalCard className="flex-1 overflow-y-auto" padding="none">
          {children || (
            <div className="p-4 text-center text-gray-500">
              <p>No format sections configured</p>
            </div>
          )}
        </BrutalCard>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t-3 border-black bg-white">
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
    </FormatContext.Provider>
  );
}
