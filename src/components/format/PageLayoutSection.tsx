"use client";

import { FileText } from "lucide-react";
import * as React from "react";
import { BrutalInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * PageLayoutSection - Page size and margin settings
 *
 * Controls for:
 * - Page size presets (6x9, 5x8, A5, etc.)
 * - Custom dimensions
 * - Margin settings (top, bottom, outer, gutter)
 */

// =============================================================================
// Types
// =============================================================================

export interface PageLayoutSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE_PRESETS = [
  { value: "6x9", label: '6" x 9"', width: "6in", height: "9in" },
  { value: "5.5x8.5", label: '5.5" x 8.5"', width: "5.5in", height: "8.5in" },
  { value: "5x8", label: '5" x 8"', width: "5in", height: "8in" },
  { value: "a5", label: "A5", width: "148mm", height: "210mm" },
  { value: "letter", label: "US Letter", width: "8.5in", height: "11in" },
  { value: "custom", label: "Custom", width: "", height: "" },
];

const MARGIN_PRESETS = [
  {
    value: "standard",
    label: "Standard",
    margins: {
      top: "0.75in",
      bottom: "0.75in",
      outer: "0.625in",
      gutter: "0.875in",
    },
  },
  {
    value: "wide",
    label: "Wide Margins",
    margins: { top: "1in", bottom: "1in", outer: "1in", gutter: "1in" },
  },
  {
    value: "narrow",
    label: "Narrow",
    margins: {
      top: "0.5in",
      bottom: "0.5in",
      outer: "0.5in",
      gutter: "0.75in",
    },
  },
  {
    value: "custom",
    label: "Custom",
    margins: null,
  },
];

// =============================================================================
// Component
// =============================================================================

export function PageLayoutSection({
  defaultExpanded = false,
}: PageLayoutSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const page = config.page || {};
  const [selectedPreset, setSelectedPreset] = React.useState(
    page.size || "6x9",
  );
  const [marginPreset, setMarginPreset] = React.useState("standard");

  // TODO: Add bleed settings for print
  // TODO: Add page number position settings
  // TODO: Add header/footer configuration
  // TODO: Add visual margin editor (drag handles)

  const handleSizeChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    const preset = PAGE_SIZE_PRESETS.find((p) => p.value === presetValue);
    if (preset && preset.value !== "custom") {
      updateConfig({
        page: {
          ...page,
          size: presetValue,
          width: preset.width,
          height: preset.height,
        },
      });
    }
  };

  const handleMarginPresetChange = (presetValue: string) => {
    setMarginPreset(presetValue);
    const preset = MARGIN_PRESETS.find((p) => p.value === presetValue);
    if (preset?.margins) {
      updateConfig({
        page: {
          ...page,
          margins: preset.margins,
        },
      });
    }
  };

  const handleMarginChange = (key: string, value: string) => {
    setMarginPreset("custom");
    updateConfig({
      page: {
        ...page,
        margins: {
          ...page.margins,
          [key]: value,
        },
      },
    });
  };

  const handleDimensionChange = (key: "width" | "height", value: string) => {
    setSelectedPreset("custom");
    updateConfig({
      page: {
        ...page,
        size: "custom",
        [key]: value,
      },
    });
  };

  return (
    <FormatSection
      title="Page Layout"
      icon={<FileText className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Page Size */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Page Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAGE_SIZE_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.value}
              onClick={() => handleSizeChange(preset.value)}
              className={cn(
                "px-3 py-2",
                "border-brutal",
                "font-bold text-sm",
                "transition-all duration-100",
                selectedPreset === preset.value
                  ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                  : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom dimensions */}
        {selectedPreset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <BrutalInput
              label="Width"
              value={page.width || ""}
              onChange={(e) => handleDimensionChange("width", e.target.value)}
              placeholder="6in"
              size="sm"
            />
            <BrutalInput
              label="Height"
              value={page.height || ""}
              onChange={(e) => handleDimensionChange("height", e.target.value)}
              placeholder="9in"
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Margins */}
      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Margins
        </label>
        <div className="flex gap-2">
          {MARGIN_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.value}
              onClick={() => handleMarginPresetChange(preset.value)}
              className={cn(
                "flex-1 px-3 py-2",
                "border-brutal",
                "font-bold text-xs",
                "transition-all duration-100",
                marginPreset === preset.value
                  ? "bg-brutal-yellow text-black shadow-[4px_4px_0_0_#000]"
                  : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom margins */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <BrutalInput
            label="Top"
            value={page.margins?.top || "0.75in"}
            onChange={(e) => handleMarginChange("top", e.target.value)}
            size="sm"
          />
          <BrutalInput
            label="Bottom"
            value={page.margins?.bottom || "0.75in"}
            onChange={(e) => handleMarginChange("bottom", e.target.value)}
            size="sm"
          />
          <BrutalInput
            label="Outer"
            value={page.margins?.outer || "0.625in"}
            onChange={(e) => handleMarginChange("outer", e.target.value)}
            size="sm"
          />
          <BrutalInput
            label="Gutter"
            value={page.margins?.gutter || "0.875in"}
            onChange={(e) => handleMarginChange("gutter", e.target.value)}
            helperText="Inner margin for binding"
            size="sm"
          />
        </div>
      </div>

      {/* Visual Preview */}
      <div className="mt-4 p-4 border-brutal bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-500">
          Preview (not to scale)
        </p>
        <div className="flex justify-center">
          <div
            className="relative bg-white border-brutal"
            style={{
              width: "120px",
              height: "180px",
            }}
          >
            {/* Margin visualization */}
            <div
              className="absolute bg-brutal-yellow/20 border border-dashed border-brutal-yellow"
              style={{
                top: "12px",
                bottom: "12px",
                left: "16px",
                right: "10px",
              }}
            >
              {/* Text lines */}
              <div className="p-2 space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 bg-gray-300"
                    style={{ width: `${80 - i * 5}%` }}
                  />
                ))}
              </div>
            </div>
            {/* Page label */}
            <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-gray-500">
              {page.width || "6in"} x {page.height || "9in"}
            </div>
          </div>
        </div>
      </div>
    </FormatSection>
  );
}
