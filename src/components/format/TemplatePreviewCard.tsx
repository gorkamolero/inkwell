"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormatPreset } from "@/lib/format-presets";

/**
 * TemplatePreviewCard - Shows a realistic page preview for a template
 *
 * Renders a miniature book page with the template's typography,
 * drop caps, and styling applied to sample content.
 */

interface TemplatePreviewCardProps {
  preset: FormatPreset;
  isActive?: boolean;
  onClick: () => void;
}

export function TemplatePreviewCard({
  preset,
  isActive = false,
  onClick,
}: TemplatePreviewCardProps) {
  const { config } = preset;
  const body = config.typography?.body || {};
  const headings = config.typography?.headings || {};
  const chapters = config.chapters || {};
  const dropCaps = config.dropCaps || {};
  const numbering = chapters.numbering || {};

  // Build chapter number text
  const chapterFormat = numbering.format || "Chapter {n}";
  const chapterNum = chapterFormat
    .replace("{n}", "1")
    .replace("{word}", "One")
    .replace("{roman}", "I");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left w-full",
        "border-3 border-black bg-white",
        "transition-all duration-150",
        isActive
          ? "ring-4 ring-brutal-yellow ring-offset-2 shadow-[6px_6px_0_0_#000]"
          : "shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
      )}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-brutal-green text-white text-xs font-bold px-2 py-1 border-2 border-black">
          <Check className="h-3 w-3" />
          Active
        </div>
      )}

      {/* Page Preview */}
      <div className="aspect-[3/4] p-4 bg-[#FFFEF8] overflow-hidden">
        <div
          className="h-full flex flex-col"
          style={{
            fontFamily: body.font || "Georgia",
            fontSize: "8px",
            lineHeight: body.lineHeight || 1.5,
          }}
        >
          {/* Chapter Header */}
          <div
            className="text-center mb-3 pt-4"
            style={{
              fontFamily: headings.font || body.font || "Georgia",
            }}
          >
            {numbering.enabled !== false && (
              <p
                className="text-[7px] tracking-widest mb-1 opacity-70"
                style={{
                  textTransform: (chapters.title?.transform as React.CSSProperties["textTransform"]) || "uppercase",
                }}
              >
                {chapterNum}
              </p>
            )}
            <h3
              className="font-bold"
              style={{
                fontSize: chapters.title?.size ? "12px" : "11px",
                textAlign: (chapters.title?.align as React.CSSProperties["textAlign"]) || "center",
                textTransform: (chapters.title?.transform as React.CSSProperties["textTransform"]) || "none",
              }}
            >
              The Beginning
            </h3>
            {chapters.ornament?.enabled && (
              <div className="text-[10px] mt-1 opacity-50">❧</div>
            )}
          </div>

          {/* Body Text with Drop Cap */}
          <div className="flex-1 text-[7px] leading-relaxed text-gray-800">
            {dropCaps?.enabled ? (
              <p>
                <span
                  className="float-left mr-1 font-bold"
                  style={{
                    fontFamily: dropCaps.font || headings.font || body.font,
                    fontSize: `${(dropCaps.lines || 3) * 8}px`,
                    lineHeight: 0.8,
                  }}
                >
                  T
                </span>
                he morning sun cast long shadows across the empty courtyard. Sarah stood at the window, her breath fogging the glass as she watched the last autumn leaves drift lazily to the ground.
              </p>
            ) : (
              <p className="indent-3">
                The morning sun cast long shadows across the empty courtyard. Sarah stood at the window, her breath fogging the glass as she watched the last autumn leaves drift lazily to the ground.
              </p>
            )}
            <p className="indent-3 mt-2">
              She had waited three years for this day. Three long years of planning, of hoping, of wondering if it would ever come.
            </p>
          </div>

          {/* Page Number */}
          <div className="text-center text-[6px] opacity-40 mt-2">
            — 1 —
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t-2 border-black bg-white">
        <h4 className="font-bold text-sm">{preset.name}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
          {preset.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-[10px] px-1.5 py-0.5 border border-gray-300 bg-gray-50"
            style={{ fontFamily: body.font }}
          >
            {body.font || "Serif"}
          </span>
          {headings.font && headings.font !== body.font && (
            <span
              className="text-[10px] px-1.5 py-0.5 border border-gray-300 bg-gray-50"
              style={{ fontFamily: headings.font }}
            >
              {headings.font}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
