"use client";

import { Palette, Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";
import {
  FORMAT_PRESETS,
  PRESET_CATEGORIES,
  type FormatPreset,
  applyPreset,
} from "@/lib/format-presets";
import type { FormatConfig } from "@/lib/format-schema";

export interface ThemeSectionProps {
  defaultExpanded?: boolean;
}

// Color schemes for preview cards based on category
const CATEGORY_COLORS: Record<FormatPreset["category"], { bg: string; primary: string; accent: string }> = {
  serif: { bg: "#FDF5E6", primary: "#1a1a1a", accent: "#8B4513" },
  sans: { bg: "#FFFFFF", primary: "#111111", accent: "#0066FF" },
  script: { bg: "#FFF8F0", primary: "#1C1C1C", accent: "#D4A574" },
  genre: { bg: "#F5F5F5", primary: "#1a1a1a", accent: "#4A4A4A" },
  accessible: { bg: "#FFFFF8", primary: "#000000", accent: "#006600" },
};

export function ThemeSection({ defaultExpanded = true }: ThemeSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const currentTheme = ((configAny.theme as Record<string, unknown>)?.preset as string) || null;
  const [confirmApply, setConfirmApply] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<FormatPreset["category"] | "all">("all");

  const handleApplyTheme = (preset: FormatPreset) => {
    const newConfig = applyPreset(config as FormatConfig, preset);
    updateConfig({
      ...newConfig,
      theme: { preset: preset.id },
    } as Record<string, unknown>);
    setConfirmApply(preset.id);
    setTimeout(() => setConfirmApply(null), 2000);
  };

  const filteredPresets = activeCategory === "all"
    ? FORMAT_PRESETS
    : FORMAT_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <FormatSection
      title="Theme"
      icon={<Palette className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      <p className="text-xs text-gray-500 mb-3">
        Choose a preset theme or customize individual settings below. Applying a theme will override typography, chapter, and scene break settings.
      </p>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-2 py-1 text-xs font-bold border-2 border-black transition-all",
            activeCategory === "all"
              ? "bg-brutal-yellow shadow-[2px_2px_0_0_#000]"
              : "bg-white hover:bg-gray-100"
          )}
        >
          All ({FORMAT_PRESETS.length})
        </button>
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-2 py-1 text-xs font-bold border-2 border-black transition-all",
              activeCategory === cat.id
                ? "bg-brutal-yellow shadow-[2px_2px_0_0_#000]"
                : "bg-white hover:bg-gray-100"
            )}
          >
            {cat.name.split(" / ")[0]} ({cat.count})
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const colors = CATEGORY_COLORS[preset.category];
          const bodyFont = preset.config.typography?.body?.font || "serif";
          const headingFont = preset.config.typography?.headings?.font || bodyFont;

          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => handleApplyTheme(preset)}
              className={cn(
                "relative text-left",
                "border-3 border-black",
                "transition-all duration-100",
                currentTheme === preset.id
                  ? "shadow-[4px_4px_0_0_#000] ring-2 ring-brutal-yellow ring-offset-2"
                  : "shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]"
              )}
            >
              {/* Preview Area */}
              <div
                className="h-20 p-2 flex flex-col justify-end"
                style={{ backgroundColor: colors.bg }}
              >
                <div
                  className="text-[9px] leading-tight opacity-70 line-clamp-2"
                  style={{ fontFamily: bodyFont, color: colors.primary }}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing...
                </div>
                <div
                  className="text-sm font-bold mt-1"
                  style={{ fontFamily: headingFont, color: colors.primary }}
                >
                  Chapter Title
                </div>
              </div>

              {/* Info Area */}
              <div className="p-2 bg-white border-t-2 border-black">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{preset.name}</span>
                  {currentTheme === preset.id && (
                    <span className="flex items-center gap-0.5 text-[10px] text-brutal-green font-bold">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {confirmApply === preset.id && currentTheme !== preset.id && (
                    <span className="text-[10px] text-brutal-green font-bold">Applied!</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              {/* Color Indicator */}
              <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                <div className="w-2.5 h-2.5 border border-black/20" style={{ backgroundColor: colors.primary }} />
                <div className="w-2.5 h-2.5 border border-black/20" style={{ backgroundColor: colors.accent }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Theme Info */}
      {currentTheme && (
        <div className="mt-4 p-3 border-3 border-black bg-white">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
            Current: {FORMAT_PRESETS.find((p) => p.id === currentTheme)?.name}
          </p>
          {(() => {
            const activePreset = FORMAT_PRESETS.find((p) => p.id === currentTheme);
            if (!activePreset) return null;
            const bodyFont = activePreset.config.typography?.body?.font || "serif";
            const headingFont = activePreset.config.typography?.headings?.font || bodyFont;
            return (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Body:</span>
                  <span className="font-medium" style={{ fontFamily: bodyFont }}>{bodyFont}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Headings:</span>
                  <span className="font-bold" style={{ fontFamily: headingFont }}>{headingFont}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </FormatSection>
  );
}
