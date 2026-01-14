"use client";

import { Download, FileText, Book, Settings2, Sparkles, Lock } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { FormatSection, useFormatContext } from "./FormatPanel";
import { BrutalCard, BrutalInput, BrutalSwitch, BrutalBadge } from "@/components/ui";
import { UpgradeModal } from "@/components/export/upgrade-modal";
import { PRICING } from "@/lib/stripe";

export interface OutputSectionProps {
  defaultExpanded?: boolean;
  sessionId?: string; // For upgrade modal
}

/**
 * OutputSection - Configure output format options
 *
 * Allows users to:
 * - Select output formats (PDF, ePub)
 * - Configure PDF options (color profile, bleed)
 * - Configure ePub options (TOC depth)
 * - Unlock professional exports
 */
export function OutputSection({ defaultExpanded = false, sessionId }: OutputSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const handleUpgrade = async (tier: "creator" | "pro") => {
    try {
      const body = tier === "creator" && sessionId
        ? { priceId: PRICING.CREATOR.priceId, sessionId }
        : { priceId: PRICING.PRO.priceId };

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          const currentUrl = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?callbackUrl=${currentUrl}`;
          return;
        }
        
        const error = await response.json();
        throw new Error(error.message || "Checkout failed");
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error("No checkout URL returned");
      }
      
      window.location.href = url;
    } catch (error) {
      console.error("Upgrade failed:", error);
      throw error;
    }
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

      {/* Export Access Status */}
      <div className="mt-4 border-4 border-black bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4" />
          <span className="font-bold">Export Options</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Free exports include a small "Made with Hotpress" footer. Unlock professional exports:
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="w-full border-3 border-black bg-white px-4 py-2 text-left font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]"
          >
            <div className="flex items-center justify-between">
              <span>Creator - ${PRICING.CREATOR.price}</span>
              <span className="text-xs text-gray-500">this book only</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="w-full border-3 border-black bg-brutal-yellow px-4 py-2 text-left font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]"
          >
            <div className="flex items-center justify-between">
              <span>Pro - ${PRICING.PRO.price}/year</span>
              <span className="text-xs">all projects</span>
            </div>
          </button>
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
                className="w-full border-brutal bg-white px-3 py-2 font-bold shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-0"
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

          {/* Pro Print Features */}
          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold">Print-Ready Features</span>
              <BrutalBadge variant="primary">PRO</BrutalBadge>
            </div>

            <div className="space-y-3">
              {/* Trim Marks */}
              <BrutalSwitch
                label="Trim Marks"
                description="Add crop marks at corners for cutting"
                checked={(pdf.trimMarks as boolean) ?? false}
                onCheckedChange={(v) => updatePdf("trimMarks", v)}
              />

              {/* Registration Marks */}
              <BrutalSwitch
                label="Registration Marks"
                description="Add alignment targets for color separation"
                checked={(pdf.registrationMarks as boolean) ?? false}
                onCheckedChange={(v) => updatePdf("registrationMarks", v)}
              />

              {/* Color Bars */}
              <BrutalSwitch
                label="Color Bars"
                description="Add CMYK color verification bars"
                checked={(pdf.colorBars as boolean) ?? false}
                onCheckedChange={(v) => updatePdf("colorBars", v)}
              />

              {/* PDF/X-4 Output Intent */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Output Intent
                </label>
                <select
                  value={(pdf.outputIntent as string) || "none"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => updatePdf("outputIntent", e.target.value)}
                  className="w-full border-brutal bg-white px-3 py-2 font-bold shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-0"
                >
                  <option value="none">None (Standard PDF)</option>
                  <option value="PDF/X-4">PDF/X-4 (Print Production)</option>
                </select>
              </div>
            </div>

            {/* Pro features info */}
            <div className="mt-3 rounded border-2 border-brutal-yellow bg-brutal-yellow/20 p-2 text-xs">
              <strong>Pro tip:</strong> These features prepare your PDF for professional print shops.
              Trim marks show where to cut, registration marks align colors.
            </div>
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
                className="w-full border-brutal bg-white px-3 py-2 font-bold shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-0"
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

          {/* Info box */}
          <div className="rounded border-2 border-gray-300 bg-gray-50 p-2 text-xs text-gray-600">
            <strong>Tip:</strong> Add a cover image URL for a polished ePub. Square or portrait images work best.
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {sessionId && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}
    </FormatSection>
  );
}
