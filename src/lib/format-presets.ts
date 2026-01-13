/**
 * Format Templates for Hotpress
 *
 * 20+ aesthetic templates inspired by Vellum's approach:
 * evocative names, curated combinations, multiple variations.
 */

import type { FormatConfig } from "./format-schema";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface FormatPreset {
  id: string;
  name: string;
  description: string;
  category: "serif" | "sans" | "script" | "genre" | "accessible";
  config: DeepPartial<FormatConfig>;
}

// ============================================================================
// SERIF / CLASSIC TEMPLATES
// ============================================================================

export const ASHFORD: FormatPreset = {
  id: "ashford",
  name: "Ashford",
  description: "Timeless elegance with refined serif typography",
  category: "serif",
  config: {
    typography: {
      body: { font: "Cormorant Garamond", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Cinzel" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "24pt", align: "center", transform: "uppercase" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: true, image: "flourish-01" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Cinzel", lines: 3, style: "raised" },
    sceneBreaks: { ornament: "three-asterisks", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Cormorant Garamond", size: "9pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

export const PEMBERTON: FormatPreset = {
  id: "pemberton",
  name: "Pemberton",
  description: "Distinguished literary style with generous margins",
  category: "serif",
  config: {
    typography: {
      body: { font: "EB Garamond", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Playfair Display" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "22pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "Chapter {word}" },
      ornament: { enabled: true, image: "flourish-02" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Playfair Display", lines: 3, style: "dropped" },
    sceneBreaks: { ornament: "flourish", spacing: "1.5em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "EB Garamond", size: "9pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

export const THORNBURY: FormatPreset = {
  id: "thornbury",
  name: "Thornbury",
  description: "Classic English manor house aesthetic",
  category: "serif",
  config: {
    typography: {
      body: { font: "Libre Baskerville", size: "10.5pt", lineHeight: 1.55 },
      headings: { font: "Libre Baskerville" },
      paragraph: { indent: "2em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "26pt", align: "center", transform: "uppercase" },
      numbering: { enabled: true, format: "Chapter {roman}" },
      ornament: { enabled: true, image: "flourish-03" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Libre Baskerville", lines: 4, style: "dropped" },
    sceneBreaks: { ornament: "fleuron", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Libre Baskerville", size: "8pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "— {n} —" } },
  },
};

export const WHITMORE: FormatPreset = {
  id: "whitmore",
  name: "Whitmore",
  description: "Understated sophistication with subtle details",
  category: "serif",
  config: {
    typography: {
      body: { font: "Crimson Text", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Cinzel" },
      paragraph: { indent: "1.25em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "20pt", align: "center", transform: "uppercase" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Cinzel", lines: 2, style: "raised" },
    sceneBreaks: { ornament: "em-dash", spacing: "1.5em" },
    headers: { enabled: true, left: "{title}", right: "{n}", font: "Crimson Text", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

export const CAMBRIDGE: FormatPreset = {
  id: "cambridge",
  name: "Cambridge",
  description: "Academic elegance for scholarly works",
  category: "serif",
  config: {
    typography: {
      body: { font: "Georgia", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Georgia" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "18pt", align: "left", transform: "none" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Georgia", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "right", format: "{n}" } },
  },
};

export const HAWTHORNE: FormatPreset = {
  id: "hawthorne",
  name: "Hawthorne",
  description: "American classic with bold chapter numbers",
  category: "serif",
  config: {
    typography: {
      body: { font: "Merriweather", size: "10.5pt", lineHeight: 1.6 },
      headings: { font: "Merriweather" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "32pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Merriweather", lines: 3, style: "dropped" },
    sceneBreaks: { ornament: "three-asterisks", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{chapter}", font: "Merriweather", size: "8pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

// ============================================================================
// SANS / MODERN TEMPLATES
// ============================================================================

export const SLATE: FormatPreset = {
  id: "slate",
  name: "Slate",
  description: "Clean contemporary design for modern readers",
  category: "sans",
  config: {
    typography: {
      body: { font: "Inter", size: "10pt", lineHeight: 1.6 },
      headings: { font: "Inter" },
      paragraph: { indent: "0", spacing: "0.5em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "28pt", align: "left", transform: "none" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: true, left: "{title}", right: "{n}", font: "Inter", size: "8pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

export const CARBON: FormatPreset = {
  id: "carbon",
  name: "Carbon",
  description: "Bold and minimal with strong typography",
  category: "sans",
  config: {
    typography: {
      body: { font: "Inter", size: "10pt", lineHeight: 1.55 },
      headings: { font: "Inter" },
      paragraph: { indent: "0", spacing: "0.75em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "36pt", align: "left", transform: "uppercase" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "em-dash", spacing: "2em" },
    headers: { enabled: false },
    footers: { enabled: true, pageNumber: { position: "right", format: "{n}" } },
  },
};

export const AXIOM: FormatPreset = {
  id: "axiom",
  name: "Axiom",
  description: "Technical precision with systematic layout",
  category: "sans",
  config: {
    typography: {
      body: { font: "Source Sans Pro", size: "10pt", lineHeight: 1.5 },
      headings: { font: "Source Sans Pro" },
      paragraph: { indent: "0", spacing: "0.5em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "24pt", align: "left", transform: "none" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: false },
      startOn: "any",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "1.5em" },
    headers: { enabled: true, left: "{chapter}", right: "{n}", font: "Source Sans Pro", size: "8pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

export const VERTEX: FormatPreset = {
  id: "vertex",
  name: "Vertex",
  description: "Sharp angles and geometric precision",
  category: "sans",
  config: {
    typography: {
      body: { font: "Roboto", size: "10pt", lineHeight: 1.55 },
      headings: { font: "Roboto Condensed" },
      paragraph: { indent: "0", spacing: "0.5em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "30pt", align: "left", transform: "uppercase" },
      numbering: { enabled: true, format: "{n}." },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Roboto", size: "7pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

export const CLARITY: FormatPreset = {
  id: "clarity",
  name: "Clarity",
  description: "Maximum readability with zero distractions",
  category: "sans",
  config: {
    typography: {
      body: { font: "Source Serif Pro", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Source Serif Pro" },
      paragraph: { indent: "1em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "20pt", align: "left", transform: "none" },
      numbering: { enabled: false },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: false },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

// ============================================================================
// SCRIPT / ELEGANT TEMPLATES
// ============================================================================

export const SERAPHINE: FormatPreset = {
  id: "seraphine",
  name: "Seraphine",
  description: "Romantic elegance with flowing script accents",
  category: "script",
  config: {
    typography: {
      body: { font: "Cormorant Garamond", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Pinyon Script" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "32pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "Chapter {word}" },
      ornament: { enabled: true, image: "flourish-02" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Pinyon Script", lines: 3, style: "dropped" },
    sceneBreaks: { ornament: "flourish", spacing: "1.5em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Cormorant Garamond", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "~ {n} ~" } },
  },
};

export const ROSEWOOD: FormatPreset = {
  id: "rosewood",
  name: "Rosewood",
  description: "Warm and inviting with decorative touches",
  category: "script",
  config: {
    typography: {
      body: { font: "Lora", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Great Vibes" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "28pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "{word}" },
      ornament: { enabled: true, image: "flourish-01" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Great Vibes", lines: 3, style: "raised" },
    sceneBreaks: { ornament: "fleuron", spacing: "2em" },
    headers: { enabled: true, left: "{title}", right: "", font: "Lora", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

export const BELLEVUE: FormatPreset = {
  id: "bellevue",
  name: "Bellevue",
  description: "French sophistication with artistic flair",
  category: "script",
  config: {
    typography: {
      body: { font: "EB Garamond", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Tangerine" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "36pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "Chapitre {n}" },
      ornament: { enabled: true, image: "flourish-03" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Tangerine", lines: 4, style: "dropped" },
    sceneBreaks: { ornament: "flourish", spacing: "1.5em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "EB Garamond", size: "8pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "— {n} —" } },
  },
};

export const WISTERIA: FormatPreset = {
  id: "wisteria",
  name: "Wisteria",
  description: "Delicate and dreamy with soft typography",
  category: "script",
  config: {
    typography: {
      body: { font: "Crimson Text", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Alex Brush" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "30pt", align: "center", transform: "none" },
      numbering: { enabled: false },
      ornament: { enabled: true, image: "flourish-02" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Alex Brush", lines: 3, style: "raised" },
    sceneBreaks: { ornament: "three-asterisks", spacing: "2em" },
    headers: { enabled: false },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

// ============================================================================
// GENRE-SPECIFIC TEMPLATES
// ============================================================================

export const IRONCLAD: FormatPreset = {
  id: "ironclad",
  name: "Ironclad",
  description: "Bold and gritty for thrillers and action",
  category: "genre",
  config: {
    typography: {
      body: { font: "Source Serif Pro", size: "10.5pt", lineHeight: 1.5 },
      headings: { font: "Oswald" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "28pt", align: "left", transform: "uppercase" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "em-dash", spacing: "1.5em" },
    headers: { enabled: true, left: "{author}", right: "{chapter}", font: "Oswald", size: "8pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "right", format: "{n}" } },
  },
};

export const NEBULA: FormatPreset = {
  id: "nebula",
  name: "Nebula",
  description: "Futuristic and sleek for sci-fi adventures",
  category: "genre",
  config: {
    typography: {
      body: { font: "Exo 2", size: "10pt", lineHeight: 1.55 },
      headings: { font: "Orbitron" },
      paragraph: { indent: "0", spacing: "0.5em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "24pt", align: "left", transform: "uppercase" },
      numbering: { enabled: true, format: "{n}" },
      ornament: { enabled: false },
      startOn: "right",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "em-dash", spacing: "2em" },
    headers: { enabled: true, left: "{title}", right: "{n}", font: "Exo 2", size: "7pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

export const CRIMSON: FormatPreset = {
  id: "crimson",
  name: "Crimson",
  description: "Passionate and alluring for romance",
  category: "genre",
  config: {
    typography: {
      body: { font: "Cormorant Garamond", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Playfair Display" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "26pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "Chapter {word}" },
      ornament: { enabled: true, image: "flourish-02" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Playfair Display", lines: 3, style: "dropped" },
    sceneBreaks: { ornament: "flourish", spacing: "1.5em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Cormorant Garamond", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "~ {n} ~" } },
  },
};

export const SHADOWVALE: FormatPreset = {
  id: "shadowvale",
  name: "Shadowvale",
  description: "Dark and atmospheric for horror and gothic",
  category: "genre",
  config: {
    typography: {
      body: { font: "EB Garamond", size: "11pt", lineHeight: 1.5 },
      headings: { font: "Cinzel Decorative" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "22pt", align: "center", transform: "uppercase" },
      numbering: { enabled: true, format: "{roman}" },
      ornament: { enabled: true, image: "flourish-03" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Cinzel Decorative", lines: 4, style: "dropped" },
    sceneBreaks: { ornament: "fleuron", spacing: "2em" },
    headers: { enabled: true, left: "{title}", right: "", font: "EB Garamond", size: "8pt", transform: "uppercase", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "• {n} •" } },
  },
};

export const EVERGREEN: FormatPreset = {
  id: "evergreen",
  name: "Evergreen",
  description: "Warm and nostalgic for cozy mysteries",
  category: "genre",
  config: {
    typography: {
      body: { font: "Lora", size: "11pt", lineHeight: 1.55 },
      headings: { font: "Lora" },
      paragraph: { indent: "1.5em", spacing: "0", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "20pt", align: "center", transform: "none" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: true, image: "flourish-01" },
      startOn: "right",
    },
    dropCaps: { enabled: true, font: "Lora", lines: 2, style: "raised" },
    sceneBreaks: { ornament: "three-asterisks", spacing: "2em" },
    headers: { enabled: true, left: "{author}", right: "{title}", font: "Lora", size: "9pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: true, pageNumber: { position: "center", format: "{n}" } },
  },
};

// ============================================================================
// ACCESSIBLE TEMPLATES
// ============================================================================

export const OPENREAD: FormatPreset = {
  id: "openread",
  name: "OpenRead",
  description: "Optimized for dyslexia with OpenDyslexic font",
  category: "accessible",
  config: {
    typography: {
      body: { font: "OpenDyslexic", size: "12pt", lineHeight: 1.8 },
      headings: { font: "OpenDyslexic" },
      paragraph: { indent: "0", spacing: "0.75em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "24pt", align: "left", transform: "none" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: false },
      startOn: "any",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: true, left: "{chapter}", right: "{n}", font: "OpenDyslexic", size: "10pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

export const HYPERLEGIBLE: FormatPreset = {
  id: "hyperlegible",
  name: "Hyperlegible",
  description: "Maximum clarity with Atkinson Hyperlegible",
  category: "accessible",
  config: {
    typography: {
      body: { font: "Atkinson Hyperlegible", size: "12pt", lineHeight: 1.7 },
      headings: { font: "Atkinson Hyperlegible" },
      paragraph: { indent: "0", spacing: "0.5em", firstParagraphIndent: false },
    },
    chapters: {
      title: { size: "22pt", align: "left", transform: "none" },
      numbering: { enabled: true, format: "Chapter {n}" },
      ornament: { enabled: false },
      startOn: "any",
    },
    dropCaps: { enabled: false },
    sceneBreaks: { ornament: "blank", spacing: "2em" },
    headers: { enabled: true, left: "{title}", right: "{n}", font: "Atkinson Hyperlegible", size: "10pt", transform: "none", hideOnChapterStart: true },
    footers: { enabled: false },
  },
};

// ============================================================================
// EXPORTS & UTILITIES
// ============================================================================

export const FORMAT_PRESETS: FormatPreset[] = [
  // Serif
  ASHFORD, PEMBERTON, THORNBURY, WHITMORE, CAMBRIDGE, HAWTHORNE,
  // Sans
  SLATE, CARBON, AXIOM, VERTEX, CLARITY,
  // Script
  SERAPHINE, ROSEWOOD, BELLEVUE, WISTERIA,
  // Genre
  IRONCLAD, NEBULA, CRIMSON, SHADOWVALE, EVERGREEN,
  // Accessible
  OPENREAD, HYPERLEGIBLE,
];

export const PRESET_CATEGORIES = [
  { id: "serif", name: "Serif / Classic", count: 6 },
  { id: "sans", name: "Sans / Modern", count: 5 },
  { id: "script", name: "Script / Elegant", count: 4 },
  { id: "genre", name: "Genre-Specific", count: 5 },
  { id: "accessible", name: "Accessible", count: 2 },
] as const;

export function getPresetById(id: string): FormatPreset | undefined {
  return FORMAT_PRESETS.find((preset) => preset.id === id);
}

export function getPresetsByCategory(category: FormatPreset["category"]): FormatPreset[] {
  return FORMAT_PRESETS.filter((preset) => preset.category === category);
}

export function applyPreset(
  currentConfig: FormatConfig,
  preset: FormatPreset
): FormatConfig {
  return deepMerge(currentConfig, preset.config as Partial<FormatConfig>) as FormatConfig;
}

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (
        sourceValue !== null &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}
