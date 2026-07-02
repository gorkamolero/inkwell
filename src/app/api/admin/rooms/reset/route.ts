import { Liveblocks } from "@liveblocks/node";
import { type NextRequest, NextResponse } from "next/server";
import * as Y from "yjs";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

/**
 * POST /api/admin/rooms/reset
 *
 * Reset a Liveblocks room: delete, recreate, optionally inject content
 */

let liveblocksClient: Liveblocks | null = null;

function getLiveblocks(): Liveblocks {
  if (!liveblocksClient) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY not set");
    }
    liveblocksClient = new Liveblocks({ secret });
  }
  return liveblocksClient;
}

const ResetRoomSchema = z.object({
  id: z.string().min(1),
  content: z.string().optional(),
});

async function requireAuthenticatedAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

interface BlockNode {
  type: "paragraph" | "heading" | "quote";
  tag?: string;
  text: string;
}

function parseMarkdown(markdown: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.trim() === "") continue;

    if (line.trim() === "* * *" || line.trim() === "---" || line.trim() === "***") {
      blocks.push({ type: "paragraph", text: "* * *" });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        tag: `h${headingMatch[1].length}`,
        text: headingMatch[2],
      });
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push({ type: "quote", text: line.slice(2) });
      continue;
    }

    let text = line;
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");
    text = text.replace(/__(.+?)__/g, "$1");
    text = text.replace(/\*(.+?)\*/g, "$1");
    text = text.replace(/_(.+?)_/g, "$1");
    blocks.push({ type: "paragraph", text });
  }

  return blocks;
}

function blocksToLexicalYjs(blocks: BlockNode[]): Uint8Array {
  const ydoc = new Y.Doc();

  ydoc.transact(() => {
    const root = ydoc.get("root", Y.XmlText);
    root.setAttribute("__type", "root");

    const elementsToSetup: Array<{
      element: Y.XmlText;
      textMap: Y.Map<string>;
      block: BlockNode;
    }> = [];

    let offset = 0;

    for (const block of blocks) {
      const element = new Y.XmlText();
      const textMap = new Y.Map<string>();

      root.insertEmbed(offset, element);
      offset++;

      element.insertEmbed(0, textMap);
      element.insert(1, block.text);

      elementsToSetup.push({ element, textMap, block });
    }

    for (const { element, textMap, block } of elementsToSetup) {
      if (block.type === "heading") {
        element.setAttribute("__type", "heading");
        element.setAttribute("__tag", block.tag || "h1");
      } else if (block.type === "quote") {
        element.setAttribute("__type", "quote");
      } else {
        element.setAttribute("__type", "paragraph");
      }
      textMap.set("__type", "text");
    }
  });

  return Y.encodeStateAsUpdate(ydoc);
}

export async function POST(request: NextRequest) {
  const authError = await requireAuthenticatedAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, content } = ResetRoomSchema.parse(body);

    const liveblocks = getLiveblocks();

    // Delete existing room
    try {
      await liveblocks.deleteRoom(id);
    } catch {
      // Room might not exist
    }

    // Create fresh room
    await liveblocks.createRoom(id, {
      defaultAccesses: ["room:write"],
    });

    // Inject content if provided
    let blockCount = 0;
    if (content) {
      const blocks = parseMarkdown(content);
      const yjsUpdate = blocksToLexicalYjs(blocks);
      await liveblocks.sendYjsBinaryUpdate(id, yjsUpdate);
      blockCount = blocks.length;
    }

    return NextResponse.json({
      success: true,
      id,
      reset: true,
      contentInjected: !!content,
      blockCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset room", details: String(error) },
      { status: 500 }
    );
  }
}
