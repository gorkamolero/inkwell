"use client";

import { Pencil, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EditorModeToggle - Toggle between Write and Format modes
 *
 * Allows users to switch between:
 * - Write mode: Focus on content creation
 * - Format mode: Configure output formatting (typography, chapters, etc.)
 */

// =============================================================================
// Types
// =============================================================================

export type EditorMode = "write" | "format";

export interface EditorModeToggleProps {
  /** Current mode */
  mode: EditorMode;
  /** Callback when mode changes */
  onModeChange: (mode: EditorMode) => void;
  /** Disable the toggle */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function EditorModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: EditorModeToggleProps) {
  // TODO: Add transition animation between modes
  // TODO: Consider keyboard shortcut (e.g., Cmd+Shift+F)
  // TODO: Add visual indicator when format has unsaved changes

  return (
    <div
      className={cn(
        "inline-flex",
        "border-3 border-black",
        "bg-white",
        "shadow-[4px_4px_0_0_#000]",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      role="tablist"
      aria-label="Editor mode"
    >
      <button
        role="tab"
        aria-selected={mode === "write"}
        aria-controls="write-panel"
        onClick={() => onModeChange("write")}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2",
          "px-4 py-2",
          "font-bold text-sm",
          "transition-colors duration-100",
          "focus:outline-none focus:ring-2 focus:ring-brutal-yellow focus:ring-inset",
          mode === "write"
            ? "bg-brutal-yellow text-black"
            : "bg-white text-black hover:bg-gray-100",
        )}
      >
        <Pencil className="h-4 w-4" strokeWidth={2.5} />
        Write
      </button>

      <div className="w-[3px] bg-black" aria-hidden="true" />

      <button
        role="tab"
        aria-selected={mode === "format"}
        aria-controls="format-panel"
        onClick={() => onModeChange("format")}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2",
          "px-4 py-2",
          "font-bold text-sm",
          "transition-colors duration-100",
          "focus:outline-none focus:ring-2 focus:ring-brutal-yellow focus:ring-inset",
          mode === "format"
            ? "bg-brutal-blue text-white"
            : "bg-white text-black hover:bg-gray-100",
        )}
      >
        <Settings2 className="h-4 w-4" strokeWidth={2.5} />
        Format
      </button>
    </div>
  );
}
