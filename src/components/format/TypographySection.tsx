"use client";

import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

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
  // Serif
  "Cormorant Garamond",
  "Crimson Text",
  "EB Garamond",
  "Georgia",
  "Libre Baskerville",
  "Lora",
  "Merriweather",
  "Playfair Display",
  "Source Serif Pro",
  // Sans
  "Atkinson Hyperlegible",
  "Exo 2",
  "Inter",
  "OpenDyslexic",
  "Oswald",
  "Roboto",
  "Roboto Condensed",
  "Source Sans Pro",
  // Display/Decorative
  "Cinzel",
  "Cinzel Decorative",
  "Orbitron",
  // Script
  "Alex Brush",
  "Great Vibes",
  "Pinyon Script",
  "Tangerine",
];

const FONT_SIZES = ["9pt", "10pt", "11pt", "12pt", "13pt", "14pt"];

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
          "border-brutal",
          "bg-white text-black",
          "font-medium",
          "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
          "transition-shadow duration-100",
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
          "border-brutal",
          "bg-white text-black",
          "font-medium",
          "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
          "transition-shadow duration-100",
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
  const body = typography.body || {};
  const headings = typography.headings || {};

  const handleBodyChange = (key: string, value: string | number) => {
    updateConfig({
      typography: {
        ...typography,
        body: { ...body, [key]: value },
      },
    });
  };

  const handleHeadingsChange = (key: string, value: string | number) => {
    updateConfig({
      typography: {
        ...typography,
        headings: { ...headings, [key]: value },
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
          value={body.font || "Cormorant Garamond"}
          onChange={(v) => handleBodyChange("font", v)}
          fonts={availableFonts}
        />

        <FontSelect
          label="Heading Font"
          value={headings.font || "Cinzel"}
          onChange={(v) => handleHeadingsChange("font", v)}
          fonts={availableFonts}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SizeSelect
          label="Body Size"
          value={body.size || "11pt"}
          onChange={(v) => handleBodyChange("size", v)}
          options={FONT_SIZES}
        />

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Line Height
          </label>
          <select
            value={body.lineHeight || 1.5}
            onChange={(e) =>
              handleBodyChange("lineHeight", parseFloat(e.target.value))
            }
            className={cn(
              "w-full h-10 px-3",
              "border-brutal",
              "bg-white text-black",
              "font-medium",
              "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
              "transition-shadow duration-100",
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
      <div className="mt-4 p-4 border-brutal bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
          Preview
        </p>
        <div
          style={{
            fontFamily: body.font || "Cormorant Garamond",
            fontSize: body.size || "11pt",
            lineHeight: body.lineHeight || 1.5,
          }}
        >
          <h3
            style={{
              fontFamily: headings.font || "Cinzel",
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
