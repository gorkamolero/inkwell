"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useThreads, useUser } from "@liveblocks/react";
import { Thread } from "@liveblocks/react-ui";
import { $getRoot, $isElementNode, type LexicalNode } from "lexical";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

function authorColor(id: string) {
  const colors = [
    "#0066FF",
    "#FF66B2",
    "#00FF66",
    "#FFE75C",
    "#FF3333",
    "#9933FF",
    "#FF9900",
    "#00CCCC",
  ];
  let hash = 0;
  for (const char of id) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

type Anchor = { id: string; x: number; y: number; element: HTMLElement };

function Author({ id }: { id: string }) {
  const { user } = useUser(id);
  const name = user?.name || "Writer";
  return (
    <>
      <span className="hotpress-pin-initials">
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </span>
      <span className="hotpress-pin-author">{name}</span>
    </>
  );
}

export function CommentPins({ nextRequest }: { nextRequest: number }) {
  const [editor] = useLexicalComposerContext();
  const { threads } = useThreads();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, origin: 0 });
  const popover = useRef<HTMLDivElement>(null);
  const previousRequest = useRef(nextRequest);
  const lastPin = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const root = editor.getRootElement();
      const host = root?.closest(".hotpress-document-layout");
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      const found = new Map<string, Anchor>();
      editor.getEditorState().read(() => {
        const visit = (node: LexicalNode) => {
          if (node.getType() === "lb-thread-mark") {
            const ids = (node.exportJSON() as { ids?: string[] }).ids || [];
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              const unresolved = ids.filter((id) =>
                threads?.some((t) => t.id === id && !t.resolved),
              );
              element.dataset.commentResolved = String(unresolved.length === 0);
              element.dataset.commentActive = String(
                unresolved.includes(active || ""),
              );
              const rects = element.getClientRects();
              const rect = rects[rects.length - 1];
              if (rect)
                for (const id of unresolved)
                  found.set(id, {
                    id,
                    x: Math.max(
                      16,
                      Math.min(rect.right - hostRect.left, hostRect.width - 42),
                    ),
                    y: rect.top - hostRect.top,
                    element,
                  });
            }
          }
          if ($isElementNode(node)) node.getChildren().forEach(visit);
        };
        visit($getRoot());
      });
      const pins = Array.from(found.values());
      // Separate pins sharing an anchor without changing document layout.
      pins.forEach((pin, i) => {
        for (const previous of pins.slice(0, i))
          if (
            Math.abs(pin.y - previous.y) < 28 &&
            Math.abs(pin.x - previous.x) < 48
          )
            pin.x = previous.x - 52;
      });
      setAnchors(pins);
      const selected = pins.find((pin) => pin.id === active);
      if (selected) {
        const pinX = hostRect.left + selected.x;
        const left = Math.max(12, Math.min(pinX - 36, window.innerWidth - 372));
        const height = popover.current?.offsetHeight || 340;
        const top = Math.max(
          12,
          Math.min(
            hostRect.top + selected.y + 32,
            window.innerHeight - height - 12,
          ),
        );
        setPosition({ left, top, origin: Math.max(12, pinX - left) });
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const unregister = editor.registerUpdateListener(schedule);
    const observer = new ResizeObserver(schedule);
    const root = editor.getRootElement();
    if (root) observer.observe(root);
    if (popover.current) observer.observe(popover.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    measure();
    return () => {
      unregister();
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [editor, threads, active]);

  useEffect(() => {
    if (previousRequest.current === nextRequest) return;
    previousRequest.current = nextRequest;
    const next =
      anchors[
        (anchors.findIndex((pin) => pin.id === active) + 1) % anchors.length
      ];
    if (next) {
      next.element.scrollIntoView({ block: "center", behavior: "smooth" });
      setActive(next.id);
    }
  }, [nextRequest, anchors, active]);

  useEffect(() => {
    if (!active) return;
    const close = (e: PointerEvent) => {
      if (
        e.target instanceof Element &&
        !e.target.closest(
          ".hotpress-comment-popover, .hotpress-comment-pin, .lb-portal, [title='Next unresolved comment']",
        )
      )
        setActive(null);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        lastPin.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onEscape);
    };
  }, [active]);

  const selected = threads?.find(
    (thread) => thread.id === active && !thread.resolved,
  );
  return (
    <>
      {anchors.map((anchor) => {
        const thread = threads?.find((t) => t.id === anchor.id);
        const first = thread?.comments.find((c) => !c.deletedAt);
        if (!thread || !first) return null;
        const preview = first.body?.content
          .flatMap((p) => p.children.map((c) => ("text" in c ? c.text : "")))
          .join(" ");
        return (
          <button
            key={anchor.id}
            ref={active === anchor.id ? lastPin : undefined}
            type="button"
            className="hotpress-comment-pin"
            style={
              {
                left: anchor.x,
                top: anchor.y,
                "--author-color": authorColor(first.userId),
              } as CSSProperties
            }
            aria-label={`Open comment, ${thread.comments.length - 1} replies`}
            aria-expanded={active === anchor.id}
            onClick={() => setActive(active === anchor.id ? null : anchor.id)}
          >
            <Author id={first.userId} />
            <span className="hotpress-pin-count">
              {thread.comments.length - 1}
            </span>
            <span className="hotpress-pin-preview">{preview}</span>
          </button>
        );
      })}
      {selected &&
        createPortal(
          <div
            ref={popover}
            role="dialog"
            aria-label="Comment thread"
            className="hotpress-comment-popover lb-root"
            style={{
              left: position.left,
              top: position.top,
              transformOrigin: `${position.origin}px 0`,
            }}
          >
            <div className="hotpress-popover-heading">
              <span>Discussion</span>
              <button
                type="button"
                aria-label="Close comment"
                onClick={() => setActive(null)}
              >
                ×
              </button>
            </div>
            <Thread thread={selected} showComposer showResolveAction />
          </div>,
          document.body,
        )}
    </>
  );
}
