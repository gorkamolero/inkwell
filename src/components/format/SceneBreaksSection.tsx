"use client";

import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * SceneBreaksSection - Scene break ornament settings
 *
 * Controls for:
 * - Ornament type selection
 * - Custom ornament
 * - Spacing around breaks
 */

// =============================================================================
// Types
// =============================================================================

export interface SceneBreaksSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const ORNAMENT_OPTIONS = [
  { value: "three-asterisks", label: "Three Asterisks", preview: "* * *" },
  { value: "three-dots", label: "Three Dots", preview: "• • •" },
  { value: "em-dash", label: "Em Dash", preview: "—" },
  { value: "three-dashes", label: "Three Dashes", preview: "— — —" },
  { value: "fleuron", label: "Fleuron", preview: "❧" },
  { value: "asterism", label: "Asterism", preview: "⁂" },
  { value: "dinkus", label: "Dinkus", preview: "# # #" },
  { value: "blank", label: "Blank Space", preview: " " },
];

const SPACING_OPTIONS = [
  { value: "1em", label: "Tight" },
  { value: "1.5em", label: "Normal" },
  { value: "2em", label: "Relaxed" },
  { value: "3em", label: "Wide" },
];

// =============================================================================
// Component
// =============================================================================

export function SceneBreaksSection({
  defaultExpanded = false,
}: SceneBreaksSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const sceneBreaks = (configAny.sceneBreaks as Record<string, unknown>) || {};

  const handleChange = (key: string, value: string | null) => {
    updateConfig({
      sceneBreaks: {
        ...sceneBreaks,
        [key]: value,
      },
    } as Record<string, unknown>);
  };

  const selectedOrnament = (sceneBreaks.ornament as string) || "three-asterisks";
  const selectedSpacing = (sceneBreaks.spacing as string) || "2em";
  const customImage = sceneBreaks.customImage as string | null;

  return (
    <FormatSection
      title="Scene Breaks"
      icon={<Minus className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Ornament Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Ornament Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ORNAMENT_OPTIONS.map(({ value, label, preview }) => (
            <button
              type="button"
              key={value}
              onClick={() => handleChange("ornament", value)}
              className={cn(
                "px-3 py-3",
                "border-brutal",
                "text-left",
                "transition-all duration-100",
                selectedOrnament === value
                  ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                  : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
              )}
            >
              <span className="block text-lg text-center mb-1 font-serif">
                {preview}
              </span>
              <span className="block text-xs font-bold text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Ornament (future feature) */}
      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Custom Ornament Image
        </label>
        <div
          className={cn(
            "h-24 flex items-center justify-center",
            "border-3 border-dashed border-gray-300",
            "bg-gray-50",
            "text-gray-400 text-sm",
            "cursor-not-allowed",
          )}
        >
          {customImage ? (
            <span>Custom image selected</span>
          ) : (
            <span>Upload custom image (coming soon)</span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Upload a small decorative image to use between scenes
        </p>
      </div>

      {/* Spacing */}
      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Spacing
        </label>
        <div className="flex gap-2">
          {SPACING_OPTIONS.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              onClick={() => handleChange("spacing", value)}
              className={cn(
                "flex-1 px-3 py-2",
                "border-brutal",
                "font-bold text-xs",
                "transition-all duration-100",
                selectedSpacing === value
                  ? "bg-brutal-yellow text-black shadow-[4px_4px_0_0_#000]"
                  : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Vertical space above and below the scene break
        </p>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border-brutal bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-500">
          Preview
        </p>
        <div className="font-serif text-sm leading-relaxed">
          <p>
            The door slammed behind him. He wouldn&apos;t look back. Not this time.
          </p>
          <div
            className="text-center py-2 text-lg"
            style={{
              paddingTop: selectedSpacing,
              paddingBottom: selectedSpacing,
            }}
          >
            {ORNAMENT_OPTIONS.find((o) => o.value === selectedOrnament)?.preview || "* * *"}
          </div>
          <p>
            Three years later, she found the letter tucked inside the old book.
          </p>
        </div>
      </div>
    </FormatSection>
  );
}
