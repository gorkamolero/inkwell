/**
 * Scene Break Ornaments for React-PDF
 *
 * Text and SVG-based ornaments for scene breaks and chapter decorations.
 * Each ornament is a React component that renders within the PDF.
 */

import { Svg, Path, View, Circle, Line, Text, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// Types
// =============================================================================

interface OrnamentProps {
  width?: number;
  height?: number;
  color?: string;
}

type OrnamentType =
  | "three-asterisks"
  | "three-dots"
  | "em-dash"
  | "three-dashes"
  | "fleuron"
  | "asterism"
  | "dinkus"
  | "flourish"
  | "leaf"
  | "diamond"
  | "blank";

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  ornamentText: {
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 4,
  },
  ornamentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

// =============================================================================
// Individual Ornament Components
// =============================================================================

/**
 * Three Asterisks: * * *
 */
function ThreeAsterisks({ color = "#000" }: OrnamentProps) {
  return (
    <Text style={[styles.ornamentText, { color }]}>*    *    *</Text>
  );
}

/**
 * Three Dots: • • •
 */
function ThreeDots({ width = 60, height = 20, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 60 20">
      <Circle cx="10" cy="10" r="3" fill={color} />
      <Circle cx="30" cy="10" r="3" fill={color} />
      <Circle cx="50" cy="10" r="3" fill={color} />
    </Svg>
  );
}

/**
 * Em Dash: —
 */
function EmDash({ color = "#000" }: OrnamentProps) {
  return (
    <Text style={[styles.ornamentText, { color, fontSize: 14 }]}>—</Text>
  );
}

/**
 * Three Dashes: — — —
 */
function ThreeDashes({ width = 80, height = 20, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 80 20">
      <Line x1="5" y1="10" x2="20" y2="10" stroke={color} strokeWidth={1.5} />
      <Line x1="32" y1="10" x2="48" y2="10" stroke={color} strokeWidth={1.5} />
      <Line x1="60" y1="10" x2="75" y2="10" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

/**
 * Fleuron: ❧ (stylized ornament using paths)
 */
function Fleuron({ width = 30, height = 30, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 30 30">
      <Path
        d="M15 5 Q8 8, 5 15 Q8 22, 15 25 Q22 22, 25 15 Q22 8, 15 5"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Asterism: ⁂ (triangle of asterisks)
 */
function Asterism({ color = "#000" }: OrnamentProps) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.ornamentText, { color, marginBottom: -4 }]}>*</Text>
      <Text style={[styles.ornamentText, { color, letterSpacing: 8 }]}>*  *</Text>
    </View>
  );
}

/**
 * Dinkus: # # #
 */
function Dinkus({ color = "#000" }: OrnamentProps) {
  return (
    <Text style={[styles.ornamentText, { color }]}>#    #    #</Text>
  );
}

/**
 * Flourish: decorative swirl
 */
function Flourish({ width = 80, height = 20, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 80 20">
      <Path
        d="M5 10 Q20 0, 40 10 Q60 20, 75 10"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx="5" cy="10" r="2" fill={color} />
      <Circle cx="75" cy="10" r="2" fill={color} />
    </Svg>
  );
}

/**
 * Leaf: simple leaf ornament
 */
function Leaf({ width = 30, height = 20, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 30 20">
      <Path
        d="M15 2 C8 6, 5 14, 15 18 C25 14, 22 6, 15 2"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Diamond: ◆
 */
function Diamond({ width = 20, height = 20, color = "#000" }: OrnamentProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20">
      <Path
        d="M10 2 L18 10 L10 18 L2 10 Z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Blank: just spacing, no visual
 */
function Blank({ width = 40, height = 20 }: OrnamentProps) {
  return (
    <View style={{ width, height }} />
  );
}

// =============================================================================
// Ornament Registry
// =============================================================================

const ORNAMENT_COMPONENTS: Record<OrnamentType, React.ComponentType<OrnamentProps>> = {
  "three-asterisks": ThreeAsterisks,
  "three-dots": ThreeDots,
  "em-dash": EmDash,
  "three-dashes": ThreeDashes,
  "fleuron": Fleuron,
  "asterism": Asterism,
  "dinkus": Dinkus,
  "flourish": Flourish,
  "leaf": Leaf,
  "diamond": Diamond,
  "blank": Blank,
};

// =============================================================================
// Main Component
// =============================================================================

interface SceneBreakOrnamentProps {
  type: OrnamentType | string;
  width?: number;
  height?: number;
  color?: string;
  spacing?: number;
}

/**
 * SceneBreakOrnament - Renders the appropriate ornament based on type
 */
export function SceneBreakOrnament({
  type,
  width,
  height,
  color = "#000",
  spacing = 24,
}: SceneBreakOrnamentProps) {
  const OrnamentComponent = ORNAMENT_COMPONENTS[type as OrnamentType] || ThreeAsterisks;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        marginVertical: spacing,
      }}
    >
      <OrnamentComponent width={width} height={height} color={color} />
    </View>
  );
}

// =============================================================================
// Chapter Ornaments
// =============================================================================

interface ChapterOrnamentProps {
  type?: string;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * ChapterOrnament - Decorative ornament for chapter title pages
 */
export function ChapterOrnament({
  type = "flourish",
  width = 80,
  height = 30,
  color = "#000",
}: ChapterOrnamentProps) {
  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      {type === "flourish-01" && <Flourish width={width} height={height} color={color} />}
      {type === "flourish-02" && (
        <Svg width={width} height={height} viewBox="0 0 80 30">
          <Path
            d="M10 15 Q25 5, 40 15 Q55 25, 70 15"
            stroke={color}
            strokeWidth={1}
            fill="none"
          />
          <Path
            d="M10 15 Q25 25, 40 15 Q55 5, 70 15"
            stroke={color}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      )}
      {type === "flourish-03" && (
        <Svg width={width} height={height} viewBox="0 0 80 30">
          <Line x1="5" y1="15" x2="32" y2="15" stroke={color} strokeWidth={1} />
          <Path d="M40 8 L48 15 L40 22 L32 15 Z" fill={color} />
          <Line x1="48" y1="15" x2="75" y2="15" stroke={color} strokeWidth={1} />
        </Svg>
      )}
      {type === "line" && (
        <Svg width={width} height={height} viewBox="0 0 80 30">
          <Line x1="10" y1="15" x2="70" y2="15" stroke={color} strokeWidth={1} />
        </Svg>
      )}
      {!["flourish-01", "flourish-02", "flourish-03", "line"].includes(type || "") && (
        <Flourish width={width} height={height} color={color} />
      )}
    </View>
  );
}

// =============================================================================
// Exports
// =============================================================================

export {
  ThreeAsterisks,
  ThreeDots,
  EmDash,
  ThreeDashes,
  Fleuron,
  Asterism,
  Dinkus,
  Flourish,
  Leaf,
  Diamond,
  Blank,
};

export type { OrnamentType, OrnamentProps, SceneBreakOrnamentProps, ChapterOrnamentProps };
