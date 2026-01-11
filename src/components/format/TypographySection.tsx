"use client";

import * as React from "react";
import { Type } from "lucide-react";
import { FormatSection, useFormatContext } from "./FormatPanel";
import { cn } from "@/lib/utils";

/**
 * TypographySection - Font and size settings
 *
 * Controls for:
 * - Body font family
 * - Heading font family
 * - Font sizes
 * - Line height
 * - Paragraph spacing
 */

// =============================================================================
// Types
// =============================================================================

export interface TypographySectionProps {
  /** Available fonts for selection */
  availableFonts?: string[];
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_FONTS = [
  "Cormorant Garamond",
  "Cinzel",
  "Lora",
  "Merriweather",
  "Playfair Display",
  "Source Serif Pro",
  "Libre Baskerville",
  "EB Garamond",
  "Crimson Text",
  "Georgia",
];

const FONT_SIZES = [
  "9pt",
  "10pt",
  "11pt",
  "12pt",
  "13pt",
  "14pt",
];

const LINE_HEIGHTS = [
  { value: 1.2, label: "Tight (1.2)" },
  { value: 1.4, label: "Normal (1.4)" },
  { value: 1.5, label: "Relaxed (1.5)" },
  { value: 1.6, label: "Loose (1.6)" },
  { value: 1.8, label: "Very Loose (1.8)" },
];

// =============================================================================
// Subcomponents
// =============================================================================

interface FontSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fonts: string[];
}

function FontSelect({ label, value, onChange, fonts }: FontSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-10 px-3",
          "border-3 border-black",
          "bg-white text-black",
          "font-medium",
          "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
          "transition-shadow duration-100"
        )}
        style={{ fontFamily: value }}
      >
        {fonts.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SizeSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function SizeSelect({ label, value, onChange, options }: SizeSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-10 px-3",
          "border-3 border-black",
          "bg-white text-black",
          "font-medium",
          "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
          "transition-shadow duration-100"
        )}
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function TypographySection({
  availableFonts = DEFAULT_FONTS,
  defaultExpanded = true,
}: TypographySectionProps) {
  const { config, updateConfig } = useFormatContext();
  const typography = config.typography || {};

  // TODO: Add font preview/sample text
  // TODO: Add custom font upload support
  // TODO: Add Google Fonts integration
  // TODO: Add paragraph indent settings

  const handleChange = (key: string, value: string | number) => {
    updateConfig({
      typography: {
        ...typography,
        [key]: value,
      },
    });
  };

  return (
    <FormatSection
      title="Typography"
      icon={<Type className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      <div className="grid grid-cols-2 gap-4">
        <FontSelect
          label="Body Font"
          value={typography.bodyFont || "Cormorant Garamond"}
          onChange={(v) => handleChange("bodyFont", v)}
          fonts={availableFonts}
        />

        <FontSelect
          label="Heading Font"
          value={typography.headingFont || "Cinzel"}
          onChange={(v) => handleChange("headingFont", v)}
          fonts={availableFonts}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SizeSelect
          label="Body Size"
          value={typography.bodySize || "11pt"}
          onChange={(v) => handleChange("bodySize", v)}
          options={FONT_SIZES}
        />

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Line Height
          </label>
          <select
            value={typography.lineHeight || 1.5}
            onChange={(e) =>
              handleChange("lineHeight", parseFloat(e.target.value))
            }
            className={cn(
              "w-full h-10 px-3",
              "border-3 border-black",
              "bg-white text-black",
              "font-medium",
              "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
              "transition-shadow duration-100"
            )}
          >
            {LINE_HEIGHTS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border-3 border-black bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
          Preview
        </p>
        <div
          style={{
            fontFamily: typography.bodyFont || "Cormorant Garamond",
            fontSize: typography.bodySize || "11pt",
            lineHeight: typography.lineHeight || 1.5,
          }}
        >
          <h3
            style={{
              fontFamily: typography.headingFont || "Cinzel",
              fontSize: "1.5em",
              fontWeight: "bold",
              marginBottom: "0.5em",
            }}
          >
            Chapter One
          </h3>
          <p>
            The quick brown fox jumps over the lazy dog. This sample text
            demonstrates how your typography settings will appear in the final
            output.
          </p>
        </div>
      </div>
    </FormatSection>
  );
}
