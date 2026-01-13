"use client";

import { X, Search, Sliders } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FORMAT_PRESETS,
  PRESET_CATEGORIES,
  type FormatPreset,
  applyPreset,
} from "@/lib/format-presets";
import type { FormatConfig } from "@/lib/format-schema";
import { TemplatePreviewCard } from "./TemplatePreviewCard";

/**
 * TemplateGalleryModal - Full-screen template picker with previews
 *
 * Shows all templates as cards with realistic page previews.
 * Categories as tabs, search, and click-to-apply functionality.
 */

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: FormatConfig;
  onApply: (config: FormatConfig, presetId: string) => void;
  onCustomize: () => void;
}

type CategoryFilter = FormatPreset["category"] | "all";

export function TemplateGalleryModal({
  isOpen,
  onClose,
  currentConfig,
  onApply,
  onCustomize,
}: TemplateGalleryModalProps) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get current theme preset ID
  const currentPresetId = (currentConfig as Record<string, unknown>).theme
    ? ((currentConfig as Record<string, unknown>).theme as Record<string, unknown>)?.preset as string
    : null;

  // Filter presets
  const filteredPresets = React.useMemo(() => {
    let presets = FORMAT_PRESETS;

    // Filter by category
    if (activeCategory !== "all") {
      presets = presets.filter((p) => p.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      presets = presets.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return presets;
  }, [activeCategory, searchQuery]);

  const handleApplyTemplate = (preset: FormatPreset) => {
    const newConfig = applyPreset(currentConfig, preset);
    onApply(
      { ...newConfig, theme: { preset: preset.id } } as FormatConfig,
      preset.id
    );
    onClose();
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-brutal-blue text-white">
          <div>
            <h1 className="text-2xl font-black">Choose a Template</h1>
            <p className="text-sm opacity-80">
              Pick a starting point, then customize to make it yours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCustomize();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold border-3 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_#000] transition-all"
            >
              <Sliders className="h-4 w-4" />
              Customize Current
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-4 px-6 py-3 border-b-2 border-black bg-gray-50">
          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 text-sm font-bold border-2 border-black transition-all",
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
                  "px-3 py-1.5 text-sm font-bold border-2 border-black transition-all",
                  activeCategory === cat.id
                    ? "bg-brutal-yellow shadow-[2px_2px_0_0_#000]"
                    : "bg-white hover:bg-gray-100"
                )}
              >
                {cat.name.split(" / ")[0]} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:shadow-[3px_3px_0_0_#000] transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg font-bold">No templates found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPresets.map((preset) => (
                <TemplatePreviewCard
                  key={preset.id}
                  preset={preset}
                  isActive={currentPresetId === preset.id}
                  onClick={() => handleApplyTemplate(preset)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t-2 border-black bg-white text-center text-sm text-gray-500">
          Click a template to apply it. You can customize any template after applying.
          <span className="ml-2 font-bold">Coming soon: Save your own templates!</span>
        </footer>
      </div>
    </div>
  );
}
