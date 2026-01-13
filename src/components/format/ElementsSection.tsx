"use client";

import { Quote, FileText, AlertCircle } from "lucide-react";
import type * as React from "react";
import { BrutalSwitch } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * ElementsSection - Special text elements settings
 *
 * Controls for:
 * - Blockquote styling
 * - Verse/poetry formatting
 * - Callout boxes
 * - Footnotes style
 */

// =============================================================================
// Types
// =============================================================================

export interface ElementsSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const BLOCKQUOTE_STYLES = [
  { value: "italic", label: "Italic" },
  { value: "normal", label: "Normal" },
];

const INDENT_OPTIONS = [
  { value: "1em", label: "Small" },
  { value: "2em", label: "Medium" },
  { value: "3em", label: "Large" },
  { value: "4em", label: "Extra Large" },
];

const FOOTNOTE_STYLES = [
  { value: "bottom", label: "Bottom of Page", description: "Traditional footnotes at page bottom" },
  { value: "endnotes", label: "End Notes", description: "Collected at end of chapter/book" },
];

const VERSE_ALIGNMENTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
];

// =============================================================================
// Component
// =============================================================================

export function ElementsSection({
  defaultExpanded = false,
}: ElementsSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const elements = (configAny.elements as Record<string, Record<string, unknown>>) || {};

  const blockquote = elements.blockquote || {};
  const verse = elements.verse || {};
  const callout = elements.callout || {};
  const footnotes = elements.footnotes || {};

  const handleBlockquoteChange = (key: string, value: string) => {
    updateConfig({
      elements: {
        ...elements,
        blockquote: { ...blockquote, [key]: value },
      },
    } as Record<string, unknown>);
  };

  const handleVerseChange = (key: string, value: string) => {
    updateConfig({
      elements: {
        ...elements,
        verse: { ...verse, [key]: value },
      },
    } as Record<string, unknown>);
  };

  const handleCalloutChange = (key: string, value: boolean | string) => {
    updateConfig({
      elements: {
        ...elements,
        callout: { ...callout, [key]: value },
      },
    } as Record<string, unknown>);
  };

  const handleFootnotesChange = (key: string, value: string) => {
    updateConfig({
      elements: {
        ...elements,
        footnotes: { ...footnotes, [key]: value },
      },
    } as Record<string, unknown>);
  };

  return (
    <FormatSection
      title="Special Elements"
      icon={<Quote className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Blockquotes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <Quote className="h-3 w-3" />
          Blockquotes
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Style */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Style
            </label>
            <div className="flex gap-2">
              {BLOCKQUOTE_STYLES.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleBlockquoteChange("style", value)}
                  className={cn(
                    "flex-1 px-3 py-2",
                    "border-brutal",
                    "font-bold text-xs",
                    "transition-all duration-100",
                    ((blockquote.style as string) || "italic") === value
                      ? "bg-brutal-pink text-black shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Indent */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Indent
            </label>
            <select
              value={(blockquote.indent as string) || "2em"}
              onChange={(e) => handleBlockquoteChange("indent", e.target.value)}
              className={cn(
                "w-full h-10 px-3",
                "border-brutal",
                "bg-white text-black",
                "font-medium text-sm",
                "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                "transition-shadow duration-100",
              )}
            >
              {INDENT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Blockquote Preview */}
        <div className="p-3 border-2 border-gray-200 bg-white">
          <div
            className="text-sm"
            style={{
              marginLeft: (blockquote.indent as string) || "2em",
              fontStyle: ((blockquote.style as string) || "italic") === "italic" ? "italic" : "normal",
            }}
          >
            &ldquo;The only thing we have to fear is fear itself.&rdquo;
            <span className="block mt-1 text-xs text-gray-500">— Franklin D. Roosevelt</span>
          </div>
        </div>
      </div>

      {/* Verse/Poetry */}
      <div className="space-y-4 pt-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <FileText className="h-3 w-3" />
          Verse / Poetry
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Style */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Style
            </label>
            <div className="flex gap-2">
              {BLOCKQUOTE_STYLES.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleVerseChange("style", value)}
                  className={cn(
                    "flex-1 px-3 py-2",
                    "border-brutal",
                    "font-bold text-xs",
                    "transition-all duration-100",
                    ((verse.style as string) || "italic") === value
                      ? "bg-brutal-pink text-black shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Alignment
            </label>
            <div className="flex gap-2">
              {VERSE_ALIGNMENTS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleVerseChange("align", value)}
                  className={cn(
                    "flex-1 px-3 py-2",
                    "border-brutal",
                    "font-bold text-xs",
                    "transition-all duration-100",
                    ((verse.align as string) || "left") === value
                      ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verse Preview */}
        <div className="p-3 border-2 border-gray-200 bg-white">
          <div
            className="text-sm leading-relaxed"
            style={{
              textAlign: ((verse.align as string) || "left") as React.CSSProperties["textAlign"],
              fontStyle: ((verse.style as string) || "italic") === "italic" ? "italic" : "normal",
            }}
          >
            Two roads diverged in a yellow wood,<br />
            And sorry I could not travel both<br />
            And be one traveler, long I stood<br />
            And looked down one as far as I could
          </div>
        </div>
      </div>

      {/* Callouts */}
      <div className="space-y-4 pt-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <AlertCircle className="h-3 w-3" />
          Callout Boxes
        </div>

        <BrutalSwitch
          label="Enable Callouts"
          description="Styled boxes for notes, warnings, tips"
          checked={(callout.enabled as boolean) ?? true}
          onCheckedChange={(v) => handleCalloutChange("enabled", v)}
        />

        {(callout.enabled as boolean) !== false && (
          <div className="p-3 border-brutal bg-gray-100">
            <div className="text-xs font-bold uppercase mb-1">Note</div>
            <div className="text-sm">
              This is how callout boxes will appear in your document.
            </div>
          </div>
        )}
      </div>

      {/* Footnotes */}
      <div className="space-y-4 pt-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <span className="text-[10px] align-super">1</span>
          Footnotes
        </div>

        <div className="space-y-2">
          {FOOTNOTE_STYLES.map(({ value, label, description }) => (
            <button
              type="button"
              key={value}
              onClick={() => handleFootnotesChange("style", value)}
              className={cn(
                "w-full px-4 py-3 text-left",
                "border-brutal",
                "transition-all duration-100",
                ((footnotes.style as string) || "bottom") === value
                  ? "bg-brutal-yellow text-black shadow-[4px_4px_0_0_#000]"
                  : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
              )}
            >
              <span className="block font-bold text-sm">{label}</span>
              <span className="block text-xs text-gray-600 mt-0.5">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </FormatSection>
  );
}
