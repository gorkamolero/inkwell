"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrutalSwitch } from "@/components/ui";
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
// Component
// =============================================================================

export function ChapterSection({
  defaultExpanded = false,
}: ChapterSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const chapters = config.chapters || {};
  const numbering = chapters.numbering || {};
  const dropCaps = config.dropCaps || {};

  const handleNumberingChange = (key: string, value: string | boolean) => {
    updateConfig({
      chapters: {
        ...chapters,
        numbering: { ...numbering, [key]: value },
      },
    });
  };

  const handleDropCapsChange = (key: string, value: number | boolean) => {
    updateConfig({
      dropCaps: { ...dropCaps, [key]: value },
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
        <BrutalSwitch
          label="Chapter Numbering"
          description="Add numbers before chapter titles"
          checked={numbering.enabled ?? true}
          onCheckedChange={(v) => handleNumberingChange("enabled", v)}
        />

        {numbering.enabled !== false && (
          <div className="ml-15 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Format
            </label>
            <select
              value={numbering.format || "Chapter {n}"}
              onChange={(e) => handleNumberingChange("format", e.target.value)}
              className={cn(
                "w-full h-10 px-3",
                "border-brutal border-black",
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
        <BrutalSwitch
          label="Drop Caps"
          description="Large decorative first letter of each chapter"
          checked={dropCaps.enabled ?? false}
          onCheckedChange={(v) => handleDropCapsChange("enabled", v)}
        />

        {dropCaps.enabled && (
          <div className="ml-15 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Drop Cap Height
            </label>
            <div className="flex gap-2">
              {DROP_CAP_LINES.map((lines) => (
                <button
                  type="button"
                  key={lines}
                  onClick={() => handleDropCapsChange("lines", lines)}
                  className={cn(
                    "w-10 h-10",
                    "border-brutal border-black",
                    "font-bold",
                    "transition-all duration-100",
                    dropCaps.lines === lines
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
      <div className="mt-4 p-4 border-brutal border-black bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
          Preview
        </p>
        <div className="font-serif">
          {numbering.enabled !== false && (
            <p className="text-sm text-gray-600 uppercase tracking-widest mb-1">
              {(numbering.format || "Chapter {n}").replace("{n}", "1")}
            </p>
          )}
          <h3 className="text-xl font-bold mb-2">The Beginning</h3>
          <p className="text-sm leading-relaxed">
            {dropCaps.enabled ? (
              <>
                <span
                  className="float-left text-4xl font-bold mr-2 leading-none"
                  style={{
                    fontSize: `${(dropCaps.lines || 3) * 1.2}em`,
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
