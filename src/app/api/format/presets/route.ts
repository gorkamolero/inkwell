import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import type { FormatConfig } from "../../sessions/[id]/format/route";

// ============================================================================
// Types
// ============================================================================

/**
 * A format preset (theme) that can be applied to a session
 */
export interface FormatPreset {
  id: string;
  name: string;
  description: string;
  category: "classic" | "modern" | "minimal" | "creative";
  config: FormatConfig;
  preview?: string; // URL to preview image
}

/**
 * Response for listing format presets
 */
export interface GetPresetsResponse {
  presets: FormatPreset[];
}

// ============================================================================
// Default Presets
// ============================================================================

/**
 * Built-in format presets (MVP)
 */
export const DEFAULT_PRESETS: FormatPreset[] = [
  {
    id: "classic-serif",
    name: "Classic Serif",
    description: "Traditional book styling with elegant serif fonts",
    category: "classic",
    config: {
      typography: {
        body: { font: "Cormorant Garamond", size: "11pt", lineHeight: 1.5 },
        headings: { font: "Cinzel", size: "18pt" },
      },
      chapters: {
        numbering: { enabled: true, format: "Chapter {n}" },
        dropCaps: { enabled: true, lines: 3, font: "Cinzel" },
      },
      page: { size: "6x9" },
    },
  },
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Contemporary styling with clean sans-serif fonts",
    category: "modern",
    config: {
      typography: {
        body: { font: "Inter", size: "11pt", lineHeight: 1.6 },
        headings: { font: "Inter", size: "20pt" },
      },
      chapters: {
        numbering: { enabled: true, format: "{n}" },
        dropCaps: { enabled: false },
      },
      page: { size: "6x9" },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and understated design",
    category: "minimal",
    config: {
      typography: {
        body: { font: "Lora", size: "11pt", lineHeight: 1.5 },
        headings: { font: "Lora", size: "16pt" },
      },
      chapters: {
        numbering: { enabled: false },
        dropCaps: { enabled: false },
      },
      page: { size: "5.5x8.5" },
    },
  },
  {
    id: "literary-fiction",
    name: "Literary Fiction",
    description: "Sophisticated styling for literary works",
    category: "creative",
    config: {
      typography: {
        body: { font: "EB Garamond", size: "11pt", lineHeight: 1.5 },
        headings: { font: "EB Garamond", size: "18pt" },
      },
      chapters: {
        numbering: { enabled: true, format: "{roman}" },
        dropCaps: { enabled: true, lines: 3, font: "EB Garamond" },
      },
      page: { size: "5.5x8.5" },
    },
  },
];

// ============================================================================
// GET /api/format/presets - List available format presets
// ============================================================================

export async function GET(): Promise<NextResponse> {
  try {
    // Return the built-in presets
    // Future: Include user's custom presets if authenticated
    // Future: Include community presets

    const response: GetPresetsResponse = {
      presets: DEFAULT_PRESETS,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error getting format presets:", error);
    return ApiError.internal().toResponse();
  }
}
