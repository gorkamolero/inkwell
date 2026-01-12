"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * ChapterSection - Chapter numbering and drop caps settings
 *
 * Controls for:
 * - Chapter numbering format
 * - Drop caps enable/style
 * - Chapter title styling
 * - Scene break ornaments
 */

// =============================================================================
// Types
// =============================================================================

export interface ChapterSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const NUMBERING_FORMATS = [
  { value: "Chapter {n}", label: "Chapter 1, Chapter 2..." },
  { value: "{n}", label: "1, 2, 3..." },
  { value: "{roman}", label: "I, II, III..." },
  { value: "{word}", label: "One, Two, Three..." },
  { value: "", label: "No numbering" },
];

const DROP_CAP_LINES = [2, 3, 4, 5];

// =============================================================================
// Subcomponents
// =============================================================================

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-7 flex-shrink-0",
          "border-3 border-black",
          "transition-colors duration-100",
          checked ? "bg-brutal-green" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5",
            "bg-white border-2 border-black",
            "transition-transform duration-100",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      <div>
        <span className="block text-sm font-bold">{label}</span>
        {description && (
          <span className="block text-xs text-gray-500 mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ChapterSection({
  defaultExpanded = false,
}: ChapterSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const chapters = config.chapters || {};

  // TODO: Add chapter title font/size settings
  // TODO: Add chapter start page setting (right/left/any)
  // TODO: Add scene break ornament selection
  // TODO: Add chapter ornament/flourish selection

  const handleChange = (key: string, value: string | number | boolean) => {
    updateConfig({
      chapters: {
        ...chapters,
        [key]: value,
      },
    });
  };

  return (
    <FormatSection
      title="Chapters"
      icon={<BookOpen className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Chapter Numbering */}
      <div className="space-y-3">
        <ToggleSwitch
          label="Chapter Numbering"
          description="Add numbers before chapter titles"
          checked={chapters.numberingEnabled ?? true}
          onChange={(v) => handleChange("numberingEnabled", v)}
        />

        {chapters.numberingEnabled !== false && (
          <div className="ml-15 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Format
            </label>
            <select
              value={chapters.numberingFormat || "Chapter {n}"}
              onChange={(e) => handleChange("numberingFormat", e.target.value)}
              className={cn(
                "w-full h-10 px-3",
                "border-3 border-black",
                "bg-white text-black",
                "font-medium",
                "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                "transition-shadow duration-100",
              )}
            >
              {NUMBERING_FORMATS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Drop Caps */}
      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <ToggleSwitch
          label="Drop Caps"
          description="Large decorative first letter of each chapter"
          checked={chapters.dropCapsEnabled ?? false}
          onChange={(v) => handleChange("dropCapsEnabled", v)}
        />

        {chapters.dropCapsEnabled && (
          <div className="ml-15 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Drop Cap Height
            </label>
            <div className="flex gap-2">
              {DROP_CAP_LINES.map((lines) => (
                <button
                  key={lines}
                  onClick={() => handleChange("dropCapsLines", lines)}
                  className={cn(
                    "w-10 h-10",
                    "border-3 border-black",
                    "font-bold",
                    "transition-all duration-100",
                    chapters.dropCapsLines === lines
                      ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
                  )}
                >
                  {lines}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Number of lines the drop cap spans
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border-3 border-black bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
          Preview
        </p>
        <div className="font-serif">
          {chapters.numberingEnabled !== false && (
            <p className="text-sm text-gray-600 uppercase tracking-widest mb-1">
              {(chapters.numberingFormat || "Chapter {n}").replace("{n}", "1")}
            </p>
          )}
          <h3 className="text-xl font-bold mb-2">The Beginning</h3>
          <p className="text-sm leading-relaxed">
            {chapters.dropCapsEnabled ? (
              <>
                <span
                  className="float-left text-4xl font-bold mr-2 leading-none"
                  style={{
                    fontSize: `${(chapters.dropCapsLines || 3) * 1.2}em`,
                  }}
                >
                  T
                </span>
                he story begins on a cold winter morning...
              </>
            ) : (
              "The story begins on a cold winter morning..."
            )}
          </p>
        </div>
      </div>
    </FormatSection>
  );
}
