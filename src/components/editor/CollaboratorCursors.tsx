"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef, useState } from "react";
import { useMyPresence, useOthers, type Presence } from "@/lib/liveblocks";

type Point = NonNullable<Presence["cursor"]>;

function Pointer({
  point,
  name,
  color,
  showLabel,
}: {
  point: Point;
  name: string;
  color: string;
  showLabel: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef({ x: point.x, y: point.y });
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    setIdle(false);
    const timer = window.setTimeout(() => setIdle(true), 3000);
    let frame = 0;
    let previous = performance.now();
    const move = (now: number) => {
      const alpha = 1 - Math.exp(-Math.min(now - previous, 64) / 45);
      previous = now;
      current.current.x += (point.x - current.current.x) * alpha;
      current.current.y += (point.y - current.current.y) * alpha;
      if (ref.current)
        ref.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      if (
        Math.abs(point.x - current.current.x) +
          Math.abs(point.y - current.current.y) >
        0.1
      )
        frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [point]);
  return (
    <div
      ref={ref}
      className="hotpress-pointer"
      data-idle={idle}
      data-testid="remote-pointer"
      style={{
        color,
        transform: `translate3d(${current.current.x}px, ${current.current.y}px, 0)`,
      }}
    >
      <svg
        width="22"
        height="25"
        viewBox="0 0 22 25"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 0L20 15L11 17L7 24L0 0Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && <span style={{ background: color }}>{name}</span>}
    </div>
  );
}

/** Coordinates use the content column, with normalized x for narrower windows. */
export function CollaboratorCursors() {
  const [editor] = useLexicalComposerContext();
  const others = useOthers();
  const [, update] = useMyPresence();
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 1 });
  useEffect(() => {
    let cleanup = () => {};
    const unregister = editor.registerRootListener((root) => {
      cleanup();
      if (!root) return;
      const measure = () => {
        const host = root.closest(".hotpress-document-layout");
        if (!host) return;
        const r = root.getBoundingClientRect();
        const h = host.getBoundingClientRect();
        setBounds({ x: r.left - h.left, y: r.top - h.top, width: r.width });
      };
      let timer = 0;
      let latest: Point | null = null;
      let activity: "pointer" | "caret" = "pointer";
      let mouse: { x: number; y: number } | null = null;
      const publish = () => {
        if (!mouse) return;
        const rect = root.getBoundingClientRect();
        latest = {
          x: (mouse.x - rect.left) / rect.width,
          y: mouse.y - rect.top,
        };
        if (!timer)
          timer = window.setTimeout(() => {
            timer = 0;
            update({ cursor: latest, labelActivity: activity });
          }, 25);
      };
      const move = (e: PointerEvent) => {
        if (
          e.pointerType !== "mouse"
        )
          return;
        activity = "pointer";
        mouse = { x: e.clientX, y: e.clientY };
        publish();
      };
      const type = () => {
        activity = "caret";
        clearTimeout(timer);
        timer = 0;
        update({ labelActivity: "caret" });
      };
      const leave = () => {
        mouse = null;
        clearTimeout(timer);
        timer = 0;
        update({ cursor: null });
      };
      const observer = new ResizeObserver(measure);
      observer.observe(root);
      root.addEventListener("pointermove", move);
      root.addEventListener("beforeinput", type);
      root.addEventListener("keydown", type);
      root.addEventListener("pointerleave", leave);
      window.addEventListener("blur", leave);
      window.addEventListener("scroll", publish, true);
      measure();
      cleanup = () => {
        observer.disconnect();
        root.removeEventListener("pointermove", move);
        root.removeEventListener("beforeinput", type);
        root.removeEventListener("keydown", type);
        root.removeEventListener("pointerleave", leave);
        window.removeEventListener("blur", leave);
        window.removeEventListener("scroll", publish, true);
        leave();
      };
    });
    return () => {
      unregister();
      cleanup();
    };
  }, [editor, update]);
  return (
    <div
      className="hotpress-pointers"
      aria-hidden="true"
      style={{ left: bounds.x, top: bounds.y }}
    >
      <style>{others.map((other) => {
        const id = other.presence.__yjs_clientid;
        if (typeof id !== "number") return "";
        const hide = other.presence.cursor && other.presence.labelActivity === "pointer";
        return `[data-yjs-client-id="${id}"] > span { visibility: ${hide ? "hidden" : "visible"}; }`;
      }).join("\n")}</style>
      {others.map(
        (other) =>
          other.presence.cursor && (
            <Pointer
              key={other.connectionId}
              point={{
                x: other.presence.cursor.x * bounds.width,
                y: other.presence.cursor.y,
              }}
              showLabel={other.presence.labelActivity === "pointer"}
              name={String(other.info?.name || "Writer")}
              color={String(other.info?.color || "#0066ff")}
            />
          ),
      )}
    </div>
  );
}
