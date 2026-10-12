"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useEffect } from "react";
import { useRoom } from "@/lib/liveblocks";

declare global {
  interface Window {
    __collaborationSnapshot?: () => unknown;
  }
}

function snapshot(value: unknown): unknown {
  if (value && typeof value === "object") {
    if ("toDelta" in value && typeof value.toDelta === "function") {
      const delta = value.toDelta() as Array<{ insert?: unknown }>;
      return delta.map(({ insert }) =>
        typeof insert === "string" ? insert : snapshot(insert),
      );
    }
    if ("toJSON" in value && typeof value.toJSON === "function") {
      return value.toJSON();
    }
  }
  return value;
}

/** Read-only local proof bridge; never enabled in a normal application build. */
export function CollaborationProofSnapshot() {
  const room = useRoom();
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_COLLABORATION_PROOF !== "1") return;
    window.__collaborationSnapshot = () =>
      snapshot(getYjsProviderForRoom(room).getYDoc().get("root"));
    return () => {
      delete window.__collaborationSnapshot;
    };
  }, [room]);
  return null;
}
