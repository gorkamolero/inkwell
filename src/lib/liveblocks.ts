"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
};

const roomContext = createRoomContext<Presence>(client);

export const { RoomProvider, useRoom, useOthers, useMyPresence, useSelf } =
  roomContext;

/** Neobrutalist-friendly color palette for user cursors and selections. */
const USER_COLORS = [
  "#0066FF", // Blue
  "#FF66B2", // Pink
  "#00FF66", // Green
  "#FFE75C", // Yellow
  "#FF3333", // Red
  "#9933FF", // Purple
  "#FF9900", // Orange
  "#00CCCC", // Teal
] as const;

const ADJECTIVES = [
  "Swift",
  "Clever",
  "Bold",
  "Quiet",
  "Bright",
  "Keen",
  "Calm",
  "Brave",
] as const;

const NOUNS = [
  "Writer",
  "Author",
  "Scribe",
  "Wordsmith",
  "Poet",
  "Editor",
  "Storyteller",
  "Narrator",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateUserColor(): string {
  return pickRandom(USER_COLORS);
}

export function generateAnonymousName(): string {
  return `${pickRandom(ADJECTIVES)} ${pickRandom(NOUNS)}`;
}
