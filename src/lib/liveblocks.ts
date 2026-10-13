"use client";

import {
  USER_COLORS,
  guestName,
  identityAvatar,
} from "./collaboration-identity";
import { createClient } from "@liveblocks/client";
import { useEffect } from "react";
import { createRoomContext } from "@liveblocks/react";

type DisplayUser = { name: string; avatar?: string };
// Keep identities learned in this browser even after a guest disconnects.
const knownUsers = new Map<string, DisplayUser>();

// The first response establishes the signed guest cookie before another token
// request starts, so simultaneous room/notification mounts share one identity.
let authorizationQueue: Promise<void> = Promise.resolve();
const client = createClient({
  authEndpoint: (room) => {
    const result = authorizationQueue.then(async () => {
      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room }),
      });
      if (!response.ok) throw new Error("Unable to authenticate collaboration");
      return response.json();
    });
    authorizationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  },
  throttle: 25,
  resolveUsers: async ({ userIds }) => {
    const missing = userIds.filter(
      (id) => !id.startsWith("anon-") && !knownUsers.has(id),
    );
    if (missing.length) {
      const response = await fetch("/api/liveblocks-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: missing }),
      });
      if (response.ok) {
        const users: (DisplayUser | null)[] = await response.json();
        users.forEach((user, index) => {
          if (user) knownUsers.set(missing[index], user);
        });
      } else if (response.status !== 401) {
        throw new Error("Unable to resolve comment authors");
      }
    }
    return userIds.map((id) => {
      const name =
        knownUsers.get(id)?.name ??
        (id.startsWith("anon-") ? guestName(id) : "Writer");
      return { name, avatar: identityAvatar(id, name) };
    });
  },
  resolveMentionSuggestions: ({ text, roomId }): string[] => {
    const room = client.getRoom(roomId);
    const participants = room ? [room.getSelf(), ...room.getOthers()] : [];
    return [
      ...new Set(
        participants
          .filter(
            (user) =>
              user &&
              String(user.info?.name ?? "")
                .toLowerCase()
                .includes(text.toLowerCase()),
          )
          .flatMap((user) => (user?.id ? [user.id] : [])),
      ),
    ];
  },
});

export type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
  isAuthenticated?: boolean;
};

const roomContext = createRoomContext<Presence>(client);

export const { RoomProvider, useRoom, useOthers, useMyPresence, useSelf } =
  roomContext;

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

/** Bridge trusted room userInfo into the Comments resolver (including guests). */
export function useRoomUserProfiles() {
  const self = useSelf();
  const others = useOthers();
  useEffect(() => {
    const changed: string[] = [];
    for (const user of [self, ...others]) {
      if (!user?.id || typeof user.info?.name !== "string") continue;
      const profile = {
        name: user.info.name,
        avatar:
          typeof user.info.picture === "string" ? user.info.picture : undefined,
      };
      if (JSON.stringify(knownUsers.get(user.id)) !== JSON.stringify(profile)) {
        knownUsers.set(user.id, profile);
        changed.push(user.id);
      }
    }
    if (changed.length) client.resolvers.invalidateUsers(changed);
  }, [self, others]);
}
