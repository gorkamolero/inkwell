"use client";

import type * as React from "react";

/**
 * CollaboratorCursors - Shows other users' cursors in the editor
 *
 * Renders cursor positions and selections for all collaborators
 * in the current Liveblocks room. Each cursor shows the user's
 * name and uses their assigned color.
 */

// =============================================================================
// Types
// =============================================================================

export interface CursorData {
  /** User identifier */
  id: string;
  /** Display name */
  name: string;
  /** Cursor color (hex) */
  color: string;
  /** Cursor position in the document */
  position: {
    x: number;
    y: number;
  } | null;
  /** Text selection range, if any */
  selection?: {
    anchor: number;
    focus: number;
  } | null;
}

export interface CollaboratorCursorsProps {
  /** List of other users' cursor data from Liveblocks presence */
  cursors: CursorData[];
  /** Container element ref for positioning calculations */
  containerRef?: React.RefObject<HTMLElement>;
}

// =============================================================================
// Subcomponents
// =============================================================================

interface CursorProps {
  cursor: CursorData;
}

function Cursor({ cursor }: CursorProps) {
  if (!cursor.position) return null;

  // TODO: Implement proper cursor rendering with:
  // - Cursor SVG icon
  // - Name label that fades after inactivity
  // - Selection highlight overlay
  // - Smooth position transitions

  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-75"
      style={{
        transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
      }}
    >
      {/* Cursor icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
        style={{ color: cursor.color }}
        aria-labelledby={`cursor-title-${cursor.id}`}
        role="img"
      >
        <title id={`cursor-title-${cursor.id}`}>{cursor.name}&apos;s cursor</title>
        <path
          d="M5.65376 12.4563L5.65376 3.99999L14.1091 12.4563H9.01041L8.57951 12.6203L5.65376 12.4563Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute left-4 top-4 px-2 py-1 text-xs font-bold text-white whitespace-nowrap border-2 border-black shadow-[2px_2px_0_0_#000]"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.name}
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function CollaboratorCursors({
  cursors,
  containerRef: _containerRef,
}: CollaboratorCursorsProps) {
  // TODO: Use containerRef for relative position calculations
  // TODO: Implement Liveblocks useOthers() hook integration
  // TODO: Add smooth cursor position interpolation
  // TODO: Handle cursor visibility (hide after inactivity)
  // TODO: Calculate relative positions within container

  // Filter out cursors without positions
  const visibleCursors = cursors.filter((c) => c.position !== null);

  if (visibleCursors.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {visibleCursors.map((cursor) => (
        <Cursor key={cursor.id} cursor={cursor} />
      ))}

      {/* Hidden for screen readers */}
      <div className="sr-only">
        {visibleCursors.length} collaborator(s) editing
      </div>
    </div>
  );
}
