import { Liveblocks } from "@liveblocks/node";
import { type NextRequest, NextResponse } from "next/server";
import * as Y from "yjs";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { getSessionById } from "@/lib/session";

/**
 * POST /api/sessions/[id]/inject-content
 *
 * Injects markdown content directly into the Liveblocks Yjs document.
 * Uses the correct Lexical Yjs structure:
 * - Root is XmlText with __type="root"
 * - Paragraphs/headings are XmlText embedded in root
 * - Text is Y.Map embedded in element, with text inserted after
 */

type RouteParams = { params: Promise<{ id: string }> };

const InjectContentSchema = z.object({
  content: z.string().min(1),
});

// Lazy-load Liveblocks client
let liveblocksClient: Liveblocks | null = null;

function getLiveblocks(): Liveblocks {
  if (!liveblocksClient) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is not set");
    }
    liveblocksClient = new Liveblocks({ secret });
  }
  return liveblocksClient;
}

interface BlockNode {
  type: "paragraph" | "heading" | "quote";
  tag?: string; // h1-h6 for headings
  text: string;
}

/**
 * Parse markdown into block nodes
 */
function parseMarkdown(markdown: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === "") continue;

    // Skip scene breaks (we'll handle them as empty paragraphs for now)
    if (line.trim() === "* * *" || line.trim() === "---" || line.trim() === "***") {
      blocks.push({ type: "paragraph", text: "* * *" });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({
        type: "heading",
        tag: `h${level}`,
        text: headingMatch[2]
      });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push({
        type: "quote",
        text: line.slice(2)
      });
      continue;
    }

    // Regular paragraph - strip markdown formatting for plain text
    let text = line;
    text = text.replace(/\*\*(.+?)\*\*/g, "$1"); // bold
    text = text.replace(/__(.+?)__/g, "$1");
    text = text.replace(/\*(.+?)\*/g, "$1"); // italic
    text = text.replace(/_(.+?)_/g, "$1");

    blocks.push({ type: "paragraph", text });
  }

  return blocks;
}

/**
 * Convert parsed blocks to Lexical Yjs structure
 *
 * Lexical Yjs format:
 * - Root: Y.XmlText with attribute __type="root"
 * - Elements (paragraph/heading): Y.XmlText embedded in parent
 * - Text: Y.Map with __type="text" embedded, then text string inserted
 *
 * IMPORTANT: Attributes must be set AFTER types are integrated into the doc,
 * otherwise they won't be captured in the update.
 */
function blocksToLexicalYjs(blocks: BlockNode[]): Uint8Array {
  const ydoc = new Y.Doc();

  ydoc.transact(() => {
    // Get root as XmlText (this is how Lexical accesses it)
    const root = ydoc.get("root", Y.XmlText);

    // Set root type attribute (root is already integrated via doc.get)
    root.setAttribute("__type", "root");

    // Track all elements so we can set their attributes after embedding
    const elementsToSetup: Array<{
      element: Y.XmlText;
      textMap: Y.Map<string>;
      block: BlockNode;
    }> = [];

    let offset = 0;

    for (const block of blocks) {
      // Create element node (XmlText for paragraph/heading/quote)
      const element = new Y.XmlText();

      // Create text node (Y.Map)
      const textMap = new Y.Map<string>();

      // Embed the element in root FIRST (integrates it into the doc)
      root.insertEmbed(offset, element);
      offset++;

      // Embed text map in element and insert text AFTER element is integrated
      element.insertEmbed(0, textMap);
      element.insert(1, block.text);

      // Track for attribute setting
      elementsToSetup.push({ element, textMap, block });
    }

    // Now set attributes on all integrated types
    for (const { element, textMap, block } of elementsToSetup) {
      // Set element type (now that it's integrated)
      if (block.type === "heading") {
        element.setAttribute("__type", "heading");
        element.setAttribute("__tag", block.tag || "h1");
      } else if (block.type === "quote") {
        element.setAttribute("__type", "quote");
      } else {
        element.setAttribute("__type", "paragraph");
      }

      // Set text node type (now that it's integrated)
      textMap.set("__type", "text");
    }
  });

  return Y.encodeStateAsUpdate(ydoc);
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await validateBody(request, InjectContentSchema);

    // Verify session exists
    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const liveblocks = getLiveblocks();

    // Parse markdown and convert to Yjs
    const blocks = parseMarkdown(body.content);
    const yjsUpdate = blocksToLexicalYjs(blocks);

    // Ensure room exists (create if needed)
    try {
      await liveblocks.getRoom(id);
    } catch {
      // Room doesn't exist, create it
      await liveblocks.createRoom(id, {
        defaultAccesses: ["room:write"],
      });
    }

    // Send the update to the Liveblocks room
    await liveblocks.sendYjsBinaryUpdate(id, yjsUpdate);

    return NextResponse.json({
      success: true,
      message: "Content injected successfully",
      roomId: id,
      blockCount: blocks.length,
      contentLength: body.content.length,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error injecting content:", error);
    return ApiError.internal(String(error)).toResponse();
  }
}

/**
 * DELETE /api/sessions/[id]/inject-content
 *
 * Clears the Liveblocks room to start fresh
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const session = await getSessionById(id);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }

    const liveblocks = getLiveblocks();

    try {
      await liveblocks.deleteRoom(id);
    } catch {
      // Room might not exist, that's ok
    }

    return NextResponse.json({
      success: true,
      message: "Room cleared. Refresh to start fresh.",
      roomId: id,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error clearing room:", error);
    return ApiError.internal(String(error)).toResponse();
  }
}
