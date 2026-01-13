/**
 * Font Registration for React-PDF
 *
 * Registers Google Fonts from @fontsource npm packages for high-quality PDF typography.
 * Uses WOFF format files from the fontsource packages.
 */

import { Font } from "@react-pdf/renderer";
import path from "node:path";

/**
 * Font configuration with paths to fontsource files
 * Each font family needs regular, bold, italic, and boldItalic variants
 */
interface FontConfig {
  family: string;
  fonts: {
    src: string;
    fontWeight?: "normal" | "bold" | number;
    fontStyle?: "normal" | "italic";
  }[];
}

/**
 * Get the absolute path to a font file in node_modules
 */
function getFontPath(pkg: string, file: string): string {
  // In Node.js, we can construct the path to node_modules
  return path.join(process.cwd(), "node_modules", pkg, "files", file);
}

/**
 * Font definitions using fontsource packages
 */
const FONT_CONFIGS: FontConfig[] = [
  {
    family: "Cormorant Garamond",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/cormorant-garamond",
          "cormorant-garamond-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/cormorant-garamond",
          "cormorant-garamond-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/cormorant-garamond",
          "cormorant-garamond-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/cormorant-garamond",
          "cormorant-garamond-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Cinzel",
    fonts: [
      {
        src: getFontPath("@fontsource/cinzel", "cinzel-latin-400-normal.woff"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath("@fontsource/cinzel", "cinzel-latin-700-normal.woff"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
    ],
  },
  {
    family: "EB Garamond",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/eb-garamond",
          "eb-garamond-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/eb-garamond",
          "eb-garamond-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/eb-garamond",
          "eb-garamond-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/eb-garamond",
          "eb-garamond-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Libre Baskerville",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/libre-baskerville",
          "libre-baskerville-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/libre-baskerville",
          "libre-baskerville-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/libre-baskerville",
          "libre-baskerville-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Source Serif Pro",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/source-serif-pro",
          "source-serif-pro-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/source-serif-pro",
          "source-serif-pro-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/source-serif-pro",
          "source-serif-pro-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/source-serif-pro",
          "source-serif-pro-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Crimson Pro",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/crimson-pro",
          "crimson-pro-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/crimson-pro",
          "crimson-pro-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/crimson-pro",
          "crimson-pro-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/crimson-pro",
          "crimson-pro-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Lora",
    fonts: [
      {
        src: getFontPath("@fontsource/lora", "lora-latin-400-normal.woff"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath("@fontsource/lora", "lora-latin-700-normal.woff"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath("@fontsource/lora", "lora-latin-400-italic.woff"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath("@fontsource/lora", "lora-latin-700-italic.woff"),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Merriweather",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/merriweather",
          "merriweather-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/merriweather",
          "merriweather-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/merriweather",
          "merriweather-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/merriweather",
          "merriweather-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Playfair Display",
    fonts: [
      {
        src: getFontPath(
          "@fontsource/playfair-display",
          "playfair-display-latin-400-normal.woff"
        ),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/playfair-display",
          "playfair-display-latin-700-normal.woff"
        ),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: getFontPath(
          "@fontsource/playfair-display",
          "playfair-display-latin-400-italic.woff"
        ),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: getFontPath(
          "@fontsource/playfair-display",
          "playfair-display-latin-700-italic.woff"
        ),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  },
  {
    family: "Inter",
    fonts: [
      {
        src: getFontPath("@fontsource/inter", "inter-latin-400-normal.woff"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: getFontPath("@fontsource/inter", "inter-latin-700-normal.woff"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
    ],
  },
];

/**
 * Map of registered font families for quick lookup
 */
const REGISTERED_FONTS = new Set<string>();

let fontsRegistered = false;

/**
 * Register fonts with React-PDF
 * Loads fonts from @fontsource npm packages
 */
export function registerFonts(): void {
  if (fontsRegistered) return;

  // Disable hyphenation for better control over text layout
  Font.registerHyphenationCallback((word) => [word]);

  // Register each font family
  for (const config of FONT_CONFIGS) {
    try {
      Font.register({
        family: config.family,
        fonts: config.fonts,
      });
      REGISTERED_FONTS.add(config.family);
    } catch (error) {
      console.warn(`Failed to register font ${config.family}:`, error);
    }
  }

  fontsRegistered = true;
}

/**
 * Get available font families
 */
export function getAvailableFonts(): string[] {
  return FONT_CONFIGS.map((c) => c.family);
}

/**
 * Check if a font is available
 */
export function isFontAvailable(family: string): boolean {
  return REGISTERED_FONTS.has(family);
}

/**
 * Get the font family name to use, with fallback
 * Returns the requested font if available, otherwise falls back to Cormorant Garamond
 */
export function getFontWithFallback(family: string): string {
  // Handle legacy "Crimson" name
  if (family === "Crimson") {
    return "Crimson Pro";
  }

  // If the font is registered, use it
  if (REGISTERED_FONTS.has(family)) {
    return family;
  }

  // Check if it's a known font that should be registered
  const knownFont = FONT_CONFIGS.find((c) => c.family === family);
  if (knownFont) {
    return family;
  }

  // Default fallback to Cormorant Garamond (elegant serif for books)
  return "Cormorant Garamond";
}
