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

import { authorColor, initials } from "@/lib/collaboration-identity";

type Anchor = { id: string; x: number; y: number; element: HTMLElement; rects: DOMRect[] };

function Author({ id }: { id: string }) {
  const { user } = useUser(id);
  const name = user?.name || "Writer";
  return <span className="hotpress-pin-initials">{initials(name)}</span>;
}

export function CommentPins({ nextRequest }: { nextRequest: number }) {
  const [editor] = useLexicalComposerContext();
  const { threads } = useThreads();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setActive(null);
      setClosing(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [closing]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ bottom: 8, height: 800 });
  const [position, setPosition] = useState({ left: 0, top: 0, origin: 0, maxHeight: 800 });
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
                    rects: [...(found.get(id)?.rects || []), ...Array.from(rects)],
                  });
            }
          }
          if ($isElementNode(node)) node.getChildren().forEach(visit);
        };
        visit($getRoot());
      });
      const pins = Array.from(found.values());
      // Measure glyphs, not element boxes (which include empty line width).
      const textRects: DOMRect[] = [];
      const walker = document.createTreeWalker(root!, NodeFilter.SHOW_TEXT);
      for (
        let textNode = walker.nextNode();
        textNode;
        textNode = walker.nextNode()
      ) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        textRects.push(...Array.from(range.getClientRects()));
      }
      const occupied: {
        left: number;
        right: number;
        top: number;
        bottom: number;
      }[] = [];
      for (const pin of pins) {
        const width = 52;
        let left = hostRect.left + pin.x - 8;
        let top = hostRect.top + pin.y - 29;
        const intersects = () =>
          [...textRects, ...occupied].some(
            (r) =>
              left < r.right + 3 &&
              left + width > r.left - 3 &&
              top < r.bottom + 3 &&
              top + 25 > r.top - 3,
          );
        if (intersects()) {
          const line = textRects.filter(
            (r) =>
              r.top < hostRect.top + pin.y + 25 &&
              r.bottom > hostRect.top + pin.y,
          );
          left = Math.min(
            window.innerWidth - width - 8,
            Math.max(...line.map((r) => r.right), hostRect.left + pin.x) + 8,
          );
          top = hostRect.top + pin.y;
          while (intersects()) top += 28;
        }
        pin.x = left - hostRect.left;
        pin.y = top - hostRect.top;
        occupied.push({ left, right: left + width, top, bottom: top + 25 });
      }

      setAnchors(pins);
      const selected = pins.find((pin) => pin.id === (active || hovered));
      if (selected) {
        const pinX = hostRect.left + selected.x;
        const left = Math.max(12, Math.min(pinX, window.innerWidth - 372));
        // Anchor to the entire highlighted range, never the raised pin. Clamping
        // the old pin-based top into the viewport could move a thread over words.
        const lineTop = Math.min(...selected.rects.map((r) => r.top));
        const lineBottom = Math.max(...selected.rects.map((r) => r.bottom));
        const desiredHeight = popover.current
          ? popover.current.scrollHeight +
            popover.current.offsetHeight - popover.current.clientHeight
          : 340;
        const below = Math.max(0, window.innerHeight - 12 - lineBottom - 8);
        const above = Math.max(0, lineTop - 8 - 12);
        const useBelow = desiredHeight <= below;
        const maxHeight = useBelow ? below : above;
        const height = Math.min(desiredHeight, maxHeight);
        const top = useBelow ? lineBottom + 8 : lineTop - 8 - height;
        setPosition({ left, top, origin: Math.max(12, pinX - left), maxHeight });
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
  }, [editor, threads, active, hovered]);

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setViewport({
        bottom: vv
          ? Math.max(8, window.innerHeight - vv.height - vv.offsetTop + 8)
          : 8,
        height: vv?.height || window.innerHeight,
      });
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

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
        setClosing(true);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setClosing(true);
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
            aria-label={`Open comment, ${thread.comments.filter((c) => !c.deletedAt).length} comments`}
            onMouseEnter={() => setHovered(anchor.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(anchor.id)}
            onBlur={() => setHovered(null)}
            aria-expanded={active === anchor.id}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.blur();
            }}
            onClick={() => {
              if (active === anchor.id) setClosing(true);
              else {
                setClosing(false);
                setActive(anchor.id);
              }
            }}
          >
            <Author id={first.userId} />
            <span className="hotpress-pin-count">
              {thread.comments.filter((c) => !c.deletedAt).length}
            </span>
          </button>
        );
      })}
      {!active &&
        hovered &&
        createPortal(
          <Preview
            thread={threads?.find((t) => t.id === hovered)}
            left={position.left}
            top={position.top}
          />,
          document.body,
        )}
      {selected &&
        createPortal(
          <div
            ref={popover}
            role="dialog"
            aria-label="Comment thread"
            className="hotpress-comment-popover lb-root"
            data-closing={closing}
            style={
              {
                left: position.left,
                top: position.top,
                transformOrigin: `${position.origin}px 0`,
                "--thread-max-height": `${position.maxHeight}px`,
                "--sheet-bottom": `${viewport.bottom}px`,
                "--sheet-height": `${viewport.height - 24}px`,
              } as CSSProperties
            }
          >
            <div className="hotpress-sheet-handle" aria-hidden="true" />
            <div className="hotpress-popover-heading">
              <span>Discussion</span>
              <button
                type="button"
                aria-label="Close comment"
                onClick={() => setClosing(true)}
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

function Preview({
  thread,
  left,
  top,
}: {
  thread: import("@liveblocks/client").ThreadData | undefined;
  left: number;
  top: number;
}) {
  const first = thread?.comments.find((c) => !c.deletedAt);
  const { user } = useUser(first?.userId || "");
  if (!first) return null;
  const text = first.body?.content
    .flatMap((p) => p.children.map((c) => ("text" in c ? c.text : "")))
    .join(" ");
  return (
    <div className="hotpress-comment-preview" style={{ left, top }}>
      <div className="hotpress-preview-author">
        <span
          className="hotpress-preview-avatar"
          style={{
            background: authorColor(first.userId),
            width: 28,
            height: 28,
            borderRadius: 5,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 700,
          }}
        >
          {initials(user?.name || "Writer")}
        </span>
        <strong>{user?.name}</strong>
      </div>
      <p>{text}</p>
    </div>
  );
}
