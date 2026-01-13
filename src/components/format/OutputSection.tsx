"use client";

import { Download, FileText, Book, Settings2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { FormatSection, useFormatContext } from "./FormatPanel";
import { BrutalCard, BrutalInput } from "@/components/ui";

export interface OutputSectionProps {
  defaultExpanded?: boolean;
}

/**
 * OutputSection - Configure output format options
 *
 * Allows users to:
 * - Select output formats (PDF, ePub)
 * - Configure PDF options (color profile, bleed)
 * - Configure ePub options (TOC depth)
 */
export function OutputSection({ defaultExpanded = false }: OutputSectionProps) {
  const { config, updateConfig } = useFormatContext();

  // Get output config with defaults
  const output = (config as Record<string, unknown>).output as Record<string, unknown> || {};
  const formats = (output.formats as string[]) || ["pdf"];
  const pdf = (output.pdf as Record<string, unknown>) || {};
  const epub = (output.epub as Record<string, unknown>) || {};

  const updateOutput = (key: string, value: unknown) => {
    updateConfig({
      output: {
        ...output,
        [key]: value,
      },
    } as Record<string, unknown>);
  };

  const updatePdf = (key: string, value: unknown) => {
    updateConfig({
      output: {
        ...output,
        pdf: {
          ...pdf,
          [key]: value,
        },
      },
    } as Record<string, unknown>);
  };

  const updateEpub = (key: string, value: unknown) => {
    updateConfig({
      output: {
        ...output,
        epub: {
          ...epub,
          [key]: value,
        },
      },
    } as Record<string, unknown>);
  };

  const toggleFormat = (format: string) => {
    const newFormats = formats.includes(format)
      ? formats.filter((f) => f !== format)
      : [...formats, format];
    updateOutput("formats", newFormats);
  };

  return (
    <FormatSection
      title="Output"
      icon={<Download className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Output Formats */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-wide text-gray-600">
          Output Formats
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* PDF Format */}
          <BrutalCard
            className={`cursor-pointer transition-all ${
              formats.includes("pdf")
                ? "bg-brutal-green"
                : "bg-white hover:bg-gray-50"
            }`}
            padding="sm"
            onClick={() => toggleFormat("pdf")}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formats.includes("pdf")}
                onChange={() => toggleFormat("pdf")}
                className="h-4 w-4 border-2 border-black accent-black"
              />
              <FileText className="h-4 w-4" />
              <span className="font-bold">PDF</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Print-ready document
            </p>
          </BrutalCard>

          {/* ePub Format */}
          <BrutalCard
            className={`cursor-pointer transition-all ${
              formats.includes("epub")
                ? "bg-brutal-blue text-white"
                : "bg-white hover:bg-gray-50"
            }`}
            padding="sm"
            onClick={() => toggleFormat("epub")}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formats.includes("epub")}
                onChange={() => toggleFormat("epub")}
                className="h-4 w-4 border-2 border-black accent-black"
              />
              <Book className="h-4 w-4" />
              <span className="font-bold">ePub</span>
            </div>
            <p className={`mt-1 text-xs ${formats.includes("epub") ? "text-white/80" : "text-gray-600"}`}>
              E-reader format
            </p>
          </BrutalCard>
        </div>
      </div>

      {/* PDF Options */}
      {formats.includes("pdf") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
            <Settings2 className="h-3 w-3" />
            PDF Options
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Color Profile */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Color Profile
              </label>
              <select
                value={(pdf.colorProfile as string) || "CMYK"}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updatePdf("colorProfile", e.target.value)}
                className="w-full border-3 border-black bg-white px-3 py-2 font-bold shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-0"
              >
                <option value="CMYK">CMYK (Print)</option>
                <option value="RGB">RGB (Screen)</option>
              </select>
            </div>

            {/* Bleed */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Bleed
              </label>
              <BrutalInput
                type="text"
                value={(pdf.bleed as string) || "0.125in"}
                onChange={(e) => updatePdf("bleed", e.target.value)}
                placeholder="0.125in"
              />
            </div>
          </div>

          {/* Info box */}
          <div className="rounded border-2 border-gray-300 bg-gray-50 p-2 text-xs text-gray-600">
            <strong>CMYK</strong> is recommended for professional printing.
            <strong> RGB</strong> is for digital viewing only.
          </div>
        </div>
      )}

      {/* ePub Options */}
      {formats.includes("epub") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
            <Settings2 className="h-3 w-3" />
            ePub Options
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* TOC Depth */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                TOC Depth
              </label>
              <select
                value={String((epub.tocDepth as number) || 2)}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateEpub("tocDepth", parseInt(e.target.value, 10))}
                className="w-full border-3 border-black bg-white px-3 py-2 font-bold shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-0"
              >
                <option value="1">1 - Chapters only</option>
                <option value="2">2 - Include sections</option>
                <option value="3">3 - Include subsections</option>
              </select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Cover Image URL
              </label>
              <BrutalInput
                type="text"
                value={(epub.coverImage as string) || ""}
                onChange={(e) => updateEpub("coverImage", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Coming soon notice */}
          <div className="rounded border-2 border-brutal-blue/30 bg-brutal-blue/10 p-2 text-xs text-brutal-blue">
            <strong>Note:</strong> ePub generation coming soon. Configure now for when it&apos;s available.
          </div>
        </div>
      )}
    </FormatSection>
  );
}
