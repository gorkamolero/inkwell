/**
 * Print-Ready PDF Post-Processor
 *
 * Transforms RGB PDFs from @react-pdf/renderer into print-ready PDFs using pdf-lib.
 * Adds bleed area, trim marks, registration marks, and sets proper page boxes.
 */

import { PDFDocument, cmyk, type PDFPage } from "pdf-lib";

// ============================================================================
// Types
// ============================================================================

export interface PrintProcessorOptions {
  /** Bleed size in points (9pt = 0.125in = 3mm) */
  bleed: number;
  /** Add trim/crop marks at corners */
  addTrimMarks: boolean;
  /** Add registration marks for color alignment */
  addRegistrationMarks: boolean;
  /** Add color bars for print verification */
  addColorBars: boolean;
  /** PDF/X output intent */
  outputIntent: "none" | "PDF/X-4";
}

// ============================================================================
// Constants
// ============================================================================

/** Length of trim marks in points (~0.25 inches) */
const TRIM_MARK_LENGTH = 18;

/** Offset from trim edge for marks in points */
const TRIM_MARK_OFFSET = 6;

/** Line width for marks */
const MARK_LINE_WIDTH = 0.5;

/** Registration mark circle radius */
const REGISTRATION_MARK_RADIUS = 6;

// ============================================================================
// Main Processor
// ============================================================================

/**
 * Process a PDF buffer for professional printing
 */
export async function processForPrint(
  inputBuffer: Buffer,
  options: PrintProcessorOptions
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(inputBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (options.bleed > 0) {
      expandPageForBleed(page, width, height, options.bleed);
    }

    if (options.addTrimMarks) {
      drawTrimMarks(page, width, height, options.bleed);
    }

    if (options.addRegistrationMarks) {
      drawRegistrationMarks(page, width, height, options.bleed);
    }

    if (options.addColorBars) {
      drawColorBars(page, width, height, options.bleed);
    }
  }

  if (options.outputIntent === "PDF/X-4") {
    addOutputIntent(pdfDoc);
  }

  return Buffer.from(await pdfDoc.save());
}

// ============================================================================
// Page Box Manipulation
// ============================================================================

/**
 * Expand page dimensions to include bleed area and set proper page boxes
 *
 * Page box hierarchy (from largest to smallest):
 * - MediaBox: Physical page size (includes bleed + marks area)
 * - BleedBox: Content area including bleed
 * - TrimBox: Final trimmed page size (original dimensions)
 */
function expandPageForBleed(
  page: PDFPage,
  width: number,
  height: number,
  bleed: number
): void {
  // Total extra space needed for bleed + mark area
  const markSpace = TRIM_MARK_LENGTH + TRIM_MARK_OFFSET + 6;
  const totalExpansion = bleed + markSpace;

  // MediaBox: Full physical page including all marks
  page.setMediaBox(
    -totalExpansion,
    -totalExpansion,
    width + totalExpansion * 2,
    height + totalExpansion * 2
  );

  // BleedBox: Includes bleed but not marks
  page.setBleedBox(-bleed, -bleed, width + bleed * 2, height + bleed * 2);

  // TrimBox: Final trimmed size (original content area)
  page.setTrimBox(0, 0, width, height);

  // Translate existing content so it remains in the correct position
  page.translateContent(totalExpansion, totalExpansion);
}

// ============================================================================
// Trim Marks (Crop Marks)
// ============================================================================

/**
 * Draw trim marks at all four corners
 *
 * Trim marks are L-shaped lines at corners showing where to cut.
 * They are drawn in registration black (100% K in CMYK).
 */
function drawTrimMarks(
  page: PDFPage,
  width: number,
  height: number,
  bleed: number
): void {
  const markColor = cmyk(0, 0, 0, 1); // Registration black
  const offset = TRIM_MARK_OFFSET + bleed;
  const len = TRIM_MARK_LENGTH;

  // Helper to draw corner marks
  const drawCorner = (
    cornerX: number,
    cornerY: number,
    hDir: number,
    vDir: number
  ) => {
    // Horizontal mark
    page.drawLine({
      start: { x: cornerX + offset * hDir, y: cornerY },
      end: { x: cornerX + (offset + len) * hDir, y: cornerY },
      thickness: MARK_LINE_WIDTH,
      color: markColor,
    });

    // Vertical mark
    page.drawLine({
      start: { x: cornerX, y: cornerY + offset * vDir },
      end: { x: cornerX, y: cornerY + (offset + len) * vDir },
      thickness: MARK_LINE_WIDTH,
      color: markColor,
    });
  };

  // Top-left corner
  drawCorner(0, height, -1, 1);

  // Top-right corner
  drawCorner(width, height, 1, 1);

  // Bottom-left corner
  drawCorner(0, 0, -1, -1);

  // Bottom-right corner
  drawCorner(width, 0, 1, -1);
}

// ============================================================================
// Registration Marks
// ============================================================================

/**
 * Draw registration marks for color alignment
 *
 * Registration marks are target circles with crosshairs placed
 * outside the bleed area. They help printers align color separations.
 */
function drawRegistrationMarks(
  page: PDFPage,
  width: number,
  height: number,
  bleed: number
): void {
  const markColor = cmyk(0, 0, 0, 1);
  const offset = bleed + TRIM_MARK_OFFSET + TRIM_MARK_LENGTH + 12;
  const r = REGISTRATION_MARK_RADIUS;

  // Draw registration mark at center of each edge
  const positions = [
    { x: width / 2, y: height + offset }, // Top
    { x: width / 2, y: -offset }, // Bottom
    { x: -offset, y: height / 2 }, // Left
    { x: width + offset, y: height / 2 }, // Right
  ];

  for (const pos of positions) {
    // Outer circle
    page.drawCircle({
      x: pos.x,
      y: pos.y,
      size: r,
      borderColor: markColor,
      borderWidth: MARK_LINE_WIDTH,
    });

    // Inner circle
    page.drawCircle({
      x: pos.x,
      y: pos.y,
      size: r / 2,
      borderColor: markColor,
      borderWidth: MARK_LINE_WIDTH,
    });

    // Crosshairs
    page.drawLine({
      start: { x: pos.x - r - 3, y: pos.y },
      end: { x: pos.x + r + 3, y: pos.y },
      thickness: MARK_LINE_WIDTH,
      color: markColor,
    });

    page.drawLine({
      start: { x: pos.x, y: pos.y - r - 3 },
      end: { x: pos.x, y: pos.y + r + 3 },
      thickness: MARK_LINE_WIDTH,
      color: markColor,
    });
  }
}

// ============================================================================
// Color Bars
// ============================================================================

/**
 * Draw color bars for print verification
 *
 * Color bars show CMYK primaries and combinations to verify
 * color accuracy during printing.
 */
function drawColorBars(
  page: PDFPage,
  width: number,
  _height: number,
  bleed: number
): void {
  const barHeight = 8;
  const barWidth = 12;
  const offset = bleed + TRIM_MARK_OFFSET + TRIM_MARK_LENGTH + 6;
  const startX = width / 2 - (barWidth * 7) / 2;
  const y = -offset - barHeight;

  // CMYK color bar sequence
  const colors = [
    cmyk(1, 0, 0, 0), // Cyan
    cmyk(0, 1, 0, 0), // Magenta
    cmyk(1, 1, 0, 0), // Blue (C+M)
    cmyk(0, 0, 1, 0), // Yellow
    cmyk(0, 1, 1, 0), // Red (M+Y)
    cmyk(1, 0, 1, 0), // Green (C+Y)
    cmyk(0, 0, 0, 1), // Black
  ];

  for (let i = 0; i < colors.length; i++) {
    page.drawRectangle({
      x: startX + i * barWidth,
      y,
      width: barWidth,
      height: barHeight,
      color: colors[i],
      borderWidth: 0,
    });
  }
}

// ============================================================================
// PDF/X Output Intent
// ============================================================================

/**
 * Add PDF/X-4 output intent metadata
 *
 * This sets metadata indicating the PDF is intended for professional printing.
 * Full PDF/X compliance requires ICC profile embedding which needs native tools,
 * but setting the intent helps downstream workflows.
 */
function addOutputIntent(pdfDoc: PDFDocument): void {
  // Set PDF metadata to indicate print intent
  pdfDoc.setTitle(pdfDoc.getTitle() || "Untitled");
  pdfDoc.setProducer("Hotpress PDF Generator (PDF/X-4 Intent)");

  // Note: Full PDF/X-4 compliance requires:
  // 1. Embedded ICC output profile (FOGRA39 or GRACoL2006)
  // 2. OutputIntent dictionary in the document catalog
  // 3. All fonts embedded (react-pdf handles this)
  // 4. No JavaScript or forms (not applicable to our use case)
  //
  // pdf-lib doesn't provide direct API for OutputIntent dictionaries,
  // so we mark the document metadata. Full compliance should be verified
  // with Adobe Acrobat or similar tools for production printing.
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if print processing is needed based on options
 */
export function requiresPrintProcessing(options: PrintProcessorOptions): boolean {
  return (
    options.bleed > 0 ||
    options.addTrimMarks ||
    options.addRegistrationMarks ||
    options.addColorBars ||
    options.outputIntent !== "none"
  );
}
