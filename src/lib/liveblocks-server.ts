import { Liveblocks } from "@liveblocks/node";
import * as Y from "yjs";

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
  tag?: string;
  text: string;
}

function parseMarkdown(markdown: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.trim() === "") continue;

    if (
      line.trim() === "* * *" ||
      line.trim() === "---" ||
      line.trim() === "***"
    ) {
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

export async function ensureLiveblocksRoom(roomId: string): Promise<void> {
  const liveblocks = getLiveblocks();

  try {
    await liveblocks.getRoom(roomId);
  } catch {
    await liveblocks.createRoom(roomId, {
      defaultAccesses: ["room:write"],
    });
  }
}

export async function injectMarkdownIntoLiveblocksRoom(
  roomId: string,
  markdown: string,
): Promise<{ blockCount: number }> {
  await ensureLiveblocksRoom(roomId);

  if (!markdown.trim()) {
    return { blockCount: 0 };
  }

  const blocks = parseMarkdown(markdown);
  const yjsUpdate = blocksToLexicalYjs(blocks);

  await getLiveblocks().sendYjsBinaryUpdate(roomId, yjsUpdate);

  return { blockCount: blocks.length };
}
