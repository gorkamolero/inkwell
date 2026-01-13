"use client";

import { PanelTop, PanelBottom } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * HeadersFootersSection - Page headers and footers settings
 *
 * Controls for:
 * - Headers: enable, left/right templates, font, size, transform
 * - Footers: enable, page number position, format
 */

// =============================================================================
// Types
// =============================================================================

export interface HeadersFootersSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const HEADER_TEMPLATES = [
  { value: "{author}", label: "Author Name" },
  { value: "{title}", label: "Book Title" },
  { value: "{chapter}", label: "Chapter Title" },
  { value: "{section}", label: "Section" },
  { value: "", label: "None" },
];

const PAGE_NUMBER_POSITIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const PAGE_NUMBER_FORMATS = [
  { value: "{n}", label: "1, 2, 3..." },
  { value: "- {n} -", label: "- 1 -, - 2 -..." },
  { value: "— {n} —", label: "— 1 —, — 2 —..." },
  { value: "Page {n}", label: "Page 1, Page 2..." },
];

const TEXT_TRANSFORMS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "capitalize", label: "Capitalize" },
];

const HEADER_FONTS = [
  "Cormorant Garamond",
  "Cinzel",
  "Inter",
  "Georgia",
  "Times New Roman",
];

const FONT_SIZES = ["8pt", "9pt", "10pt", "11pt", "12pt"];

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
        type="button"
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

export function HeadersFootersSection({
  defaultExpanded = false,
}: HeadersFootersSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const headers = (configAny.headers as Record<string, unknown>) || {};
  const footers = (configAny.footers as Record<string, unknown>) || {};

  const handleHeaderChange = (key: string, value: string | boolean) => {
    updateConfig({
      headers: {
        ...headers,
        [key]: value,
      },
    } as Record<string, unknown>);
  };

  const handleFooterChange = (key: string, value: string | boolean | Record<string, unknown>) => {
    updateConfig({
      footers: {
        ...footers,
        [key]: value,
      },
    } as Record<string, unknown>);
  };

  const handlePageNumberChange = (key: string, value: string) => {
    const pageNumber = (footers.pageNumber as Record<string, unknown>) || {};
    handleFooterChange("pageNumber", {
      ...pageNumber,
      [key]: value,
    });
  };

  return (
    <FormatSection
      title="Headers & Footers"
      icon={<PanelTop className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Headers Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <PanelTop className="h-3 w-3" />
          Headers
        </div>

        <ToggleSwitch
          label="Enable Headers"
          description="Show running headers on pages"
          checked={(headers.enabled as boolean) ?? true}
          onChange={(v) => handleHeaderChange("enabled", v)}
        />

        {(headers.enabled as boolean) !== false && (
          <div className="ml-15 space-y-4">
            {/* Left/Right Templates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Left Page
                </label>
                <select
                  value={(headers.left as string) || "{author}"}
                  onChange={(e) => handleHeaderChange("left", e.target.value)}
                  className={cn(
                    "w-full h-10 px-3",
                    "border-3 border-black",
                    "bg-white text-black",
                    "font-medium text-sm",
                    "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                    "transition-shadow duration-100",
                  )}
                >
                  {HEADER_TEMPLATES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Right Page
                </label>
                <select
                  value={(headers.right as string) || "{title}"}
                  onChange={(e) => handleHeaderChange("right", e.target.value)}
                  className={cn(
                    "w-full h-10 px-3",
                    "border-3 border-black",
                    "bg-white text-black",
                    "font-medium text-sm",
                    "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                    "transition-shadow duration-100",
                  )}
                >
                  {HEADER_TEMPLATES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Font
                </label>
                <select
                  value={(headers.font as string) || "Cormorant Garamond"}
                  onChange={(e) => handleHeaderChange("font", e.target.value)}
                  className={cn(
                    "w-full h-10 px-3",
                    "border-3 border-black",
                    "bg-white text-black",
                    "font-medium text-sm",
                    "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                    "transition-shadow duration-100",
                  )}
                  style={{ fontFamily: (headers.font as string) || "Cormorant Garamond" }}
                >
                  {HEADER_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Size
                </label>
                <select
                  value={(headers.size as string) || "9pt"}
                  onChange={(e) => handleHeaderChange("size", e.target.value)}
                  className={cn(
                    "w-full h-10 px-3",
                    "border-3 border-black",
                    "bg-white text-black",
                    "font-medium text-sm",
                    "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                    "transition-shadow duration-100",
                  )}
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Text Transform */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Text Style
              </label>
              <div className="flex gap-2">
                {TEXT_TRANSFORMS.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => handleHeaderChange("transform", value)}
                    className={cn(
                      "flex-1 px-3 py-2",
                      "border-3 border-black",
                      "font-bold text-xs",
                      "transition-all duration-100",
                      (headers.transform as string) === value
                        ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                        : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleSwitch
              label="Hide on Chapter Start"
              description="Don't show header on chapter opening pages"
              checked={(headers.hideOnChapterStart as boolean) ?? true}
              onChange={(v) => handleHeaderChange("hideOnChapterStart", v)}
            />
          </div>
        )}
      </div>

      {/* Footers Section */}
      <div className="space-y-4 pt-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <PanelBottom className="h-3 w-3" />
          Footers
        </div>

        <ToggleSwitch
          label="Enable Footers"
          description="Show page numbers in footer"
          checked={(footers.enabled as boolean) ?? true}
          onChange={(v) => handleFooterChange("enabled", v)}
        />

        {(footers.enabled as boolean) !== false && (
          <div className="ml-15 space-y-4">
            {/* Page Number Position */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Page Number Position
              </label>
              <div className="flex gap-2">
                {PAGE_NUMBER_POSITIONS.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => handlePageNumberChange("position", value)}
                    className={cn(
                      "flex-1 px-4 py-2",
                      "border-3 border-black",
                      "font-bold text-sm",
                      "transition-all duration-100",
                      ((footers.pageNumber as Record<string, unknown>)?.position as string || "center") === value
                        ? "bg-brutal-yellow text-black shadow-[4px_4px_0_0_#000]"
                        : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Number Format */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Format
              </label>
              <select
                value={((footers.pageNumber as Record<string, unknown>)?.format as string) || "{n}"}
                onChange={(e) => handlePageNumberChange("format", e.target.value)}
                className={cn(
                  "w-full h-10 px-3",
                  "border-3 border-black",
                  "bg-white text-black",
                  "font-medium",
                  "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
                  "transition-shadow duration-100",
                )}
              >
                {PAGE_NUMBER_FORMATS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border-3 border-black bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-500">
          Preview
        </p>
        <div
          className="relative bg-white border-2 border-gray-300 mx-auto"
          style={{ width: "160px", height: "200px" }}
        >
          {/* Header */}
          {(headers.enabled as boolean) !== false && (
            <div
              className="absolute top-2 left-3 right-3 text-center text-[8px] border-b border-gray-200 pb-1"
              style={{
                fontFamily: (headers.font as string) || "Georgia",
                textTransform: ((headers.transform as string) || "uppercase") as React.CSSProperties["textTransform"],
              }}
            >
              {(headers.left as string) === "{author}" ? "Author Name" : "Book Title"}
            </div>
          )}

          {/* Content placeholder */}
          <div className="absolute top-8 bottom-6 left-3 right-3 space-y-1.5 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-1 bg-gray-200"
                style={{ width: `${90 - (i % 3) * 10}%` }}
              />
            ))}
          </div>

          {/* Footer */}
          {(footers.enabled as boolean) !== false && (
            <div
              className={cn(
                "absolute bottom-2 left-3 right-3 text-[8px]",
                ((footers.pageNumber as Record<string, unknown>)?.position as string) === "left" && "text-left",
                ((footers.pageNumber as Record<string, unknown>)?.position as string) === "right" && "text-right",
                (((footers.pageNumber as Record<string, unknown>)?.position as string) || "center") === "center" && "text-center",
              )}
            >
              {(((footers.pageNumber as Record<string, unknown>)?.format as string) || "{n}").replace("{n}", "42")}
            </div>
          )}
        </div>
      </div>
    </FormatSection>
  );
}
