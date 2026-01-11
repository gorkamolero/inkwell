"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

/**
 * Liveblocks client configuration for Hotpress collaborative writing.
 *
 * Uses the auth endpoint to authenticate users for specific rooms.
 * Supports both authenticated users and anonymous guests.
 */
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

/**
 * Presence type for cursor tracking and user awareness.
 */
export type Presence = {
  /** User's cursor position (null when cursor is outside the editor) */
  cursor: { x: number; y: number } | null;
  /** Display name (user's name or "Anonymous Guest") */
  name: string;
  /** Unique color for this user's cursor and selection */
  color: string;
};

/**
 * Room context with typed presence for collaborative features.
 */
const roomContext = createRoomContext<Presence>(client);

export const {
  RoomProvider,
  useRoom,
  useOthers,
  useMyPresence,
  useSelf,
} = roomContext;

/**
 * Generate a random color for anonymous users.
 * Uses a predefined palette of neobrutalist-friendly colors.
 */
export function generateUserColor(): string {
  const colors = [
    "#0066FF", // Blue
    "#FF66B2", // Pink
    "#00FF66", // Green
    "#FFE75C", // Yellow
    "#FF3333", // Red
    "#9933FF", // Purple
    "#FF9900", // Orange
    "#00CCCC", // Teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a random anonymous user name.
 */
export function generateAnonymousName(): string {
  const adjectives = [
    "Swift",
    "Clever",
    "Bold",
    "Quiet",
    "Bright",
    "Keen",
    "Calm",
    "Brave",
  ];
  const nouns = [
    "Writer",
    "Author",
    "Scribe",
    "Wordsmith",
    "Poet",
    "Editor",
    "Storyteller",
    "Narrator",
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}
