#!/usr/bin/env node

import fs from "node:fs";
import postgres from "postgres";
import { Octokit } from "@octokit/rest";
import { Liveblocks } from "@liveblocks/node";
import { createEditor } from "lexical";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import * as Y from "yjs";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value.replace(/\\n/g, "\n");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const octokit = new Octokit();
const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY });

function isEmptyContent(content) {
  if (!content) return true;

  try {
    const parsed = JSON.parse(content);
    return (
      !parsed?.root?.children ||
      parsed.root.children.every(
        (child) =>
          child.type === "paragraph" &&
          (!child.children ||
            child.children.every((textNode) => !textNode.text?.trim())),
      )
    );
  } catch {
    return content.trim().length === 0;
  }
}

function markdownToLexical(markdown) {
  const editor = createEditor({
    namespace: "RepairSessionContent",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
    onError(error) {
      throw error;
    },
  });

  editor.update(() => {
    $convertFromMarkdownString(markdown, TRANSFORMERS);
  }, { discrete: true });

  return JSON.stringify(editor.getEditorState().toJSON());
}

function parseMarkdown(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.trim() === "") continue;
    if (["* * *", "---", "***"].includes(line.trim())) {
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

function blocksToLexicalYjs(blocks) {
  const ydoc = new Y.Doc();

  ydoc.transact(() => {
    const root = ydoc.get("root", Y.XmlText);
    root.setAttribute("__type", "root");

    const elements = [];
    let offset = 0;

    for (const block of blocks) {
      const element = new Y.XmlText();
      const textMap = new Y.Map();

      root.insertEmbed(offset, element);
      offset++;
      element.insertEmbed(0, textMap);
      element.insert(1, block.text);
      elements.push({ element, textMap, block });
    }

    for (const { element, textMap, block } of elements) {
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

async function fetchPublicRepoContent(repoFullName, repoPath) {
  const [owner, repo] = repoFullName.split("/");
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: repoPath,
    ref: "main",
  });

  if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
    throw new Error(`Expected file content for ${repoFullName}/${repoPath}`);
  }

  return {
    markdown: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

async function repairSession(session) {
  const { markdown, sha } = await fetchPublicRepoContent(
    session.github_repo,
    session.github_path,
  );

  const content = markdownToLexical(markdown);

  await sql`
    update writing_sessions
    set content = ${content},
        last_github_sha = ${sha},
        updated_at = now()
    where id = ${session.id}
  `;

  try {
    await liveblocks.deleteRoom(session.id);
  } catch {}

  await liveblocks.createRoom(session.id, {
    defaultAccesses: ["room:write"],
  });

  await liveblocks.sendYjsBinaryUpdate(
    session.id,
    blocksToLexicalYjs(parseMarkdown(markdown)),
  );

  return { sessionId: session.id, sha, markdownPreview: markdown.slice(0, 120) };
}

async function main() {
  const sessions = await sql`
    select id, title, github_repo, github_path, content
    from writing_sessions
    where github_repo like '%/%'
    order by updated_at desc
  `;

  const emptySessions = sessions.filter((session) => isEmptyContent(session.content));

  const repaired = [];
  const failed = [];

  for (const session of emptySessions) {
    try {
      repaired.push(await repairSession(session));
    } catch (error) {
      failed.push({
        sessionId: session.id,
        githubRepo: session.github_repo,
        githubPath: session.github_path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(JSON.stringify({
    scanned: sessions.length,
    emptySessions: emptySessions.length,
    repaired,
    failed,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
