"use client";

import * as React from "react";
import type { SerializedEditorState } from "lexical";

/**
 * SessionEditor - Main editor wrapper with Liveblocks integration
 *
 * This component wraps the Lexical editor with Liveblocks for real-time
 * collaboration. It handles:
 * - Liveblocks room connection
 * - Y.js document binding
 * - Presence updates
 * - Auto-save to database
 */

// =============================================================================
// Types
// =============================================================================

export interface SessionEditorProps {
  /** The session ID (also used as Liveblocks room ID) */
  sessionId: string;
  /** Initial content from database */
  initialContent?: SerializedEditorState | null;
  /** Callback when content changes (for auto-save) */
  onContentChange?: (content: SerializedEditorState) => void;
  /** Whether the session is read-only */
  readOnly?: boolean;
  /** Current user info for presence */
  user?: {
    id: string;
    name: string;
    color: string;
  };
}

// =============================================================================
// Component
// =============================================================================

export function SessionEditor({
  sessionId,
  initialContent,
  onContentChange,
  readOnly = false,
  user,
}: SessionEditorProps) {
  // TODO: Implement Liveblocks RoomProvider wrapping
  // TODO: Set up Y.js document for CRDT sync
  // TODO: Connect Lexical CollaborationPlugin
  // TODO: Handle presence updates (cursor position, user info)
  // TODO: Implement auto-save debounce to database
  // TODO: Handle offline/reconnection states

  return (
    <div className="relative w-full h-full">
      {/* TODO: Wrap with RoomProvider */}
      {/* TODO: Add CollaboratorCursors component */}
      {/* TODO: Add Lexical editor with Y.js binding */}

      {/* Placeholder structure */}
      <div className="border-3 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <p className="text-gray-500">
          SessionEditor: session={sessionId}, readOnly={String(readOnly)}
        </p>
        {user && (
          <p className="text-sm text-gray-400">
            User: {user.name} ({user.id})
          </p>
        )}
        {initialContent && (
          <p className="text-xs text-gray-400 mt-2">
            Has initial content
          </p>
        )}
        {onContentChange && (
          <p className="text-xs text-gray-400">
            Auto-save enabled
          </p>
        )}
      </div>
    </div>
  );
}
