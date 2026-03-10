import { eq, like } from "drizzle-orm";
import { Octokit } from "@octokit/rest";
import { createEditor } from "lexical";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, writingSessions } from "@/lib/db";
import { resetLiveblocksRoomWithMarkdown } from "@/lib/liveblocks-server";
import { updateSession } from "@/lib/session";

function isEmptyContent(content: string | null): boolean {
  if (!content) return true;

  try {
    const parsed = JSON.parse(content) as {
      root?: { children?: Array<{ type?: string; children?: Array<{ text?: string }> }> };
    };
    const children = parsed.root?.children ?? [];
    return (
      children.length === 0 ||
      children.every(
        (child) =>
          child.type === "paragraph" &&
          (child.children ?? []).every((textNode) => !textNode.text?.trim()),
      )
    );
  } catch {
    return content.trim().length === 0;
  }
}

function markdownToLexical(markdown: string): string {
  const editor = createEditor({
    namespace: "RecoveryBackfill",
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
    onError(error: Error) {
      throw error;
    },
  });

  editor.update(() => {
    $convertFromMarkdownString(markdown, TRANSFORMERS);
  }, { discrete: true });

  return JSON.stringify(editor.getEditorState().toJSON());
}

async function fetchPublicRepoContent(repoFullName: string, repoPath: string) {
  const [owner, repo] = repoFullName.split("/");
  const octokit = new Octokit();

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

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    if (!db) {
      throw ApiError.internal("Database not configured");
    }

    const repoSessions = await db.query.writingSessions.findMany({
      where: like(writingSessions.githubRepo, "%/%"),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
      limit: 200,
    });

    const candidates = repoSessions.filter((item) => isEmptyContent(item.content));
    const repaired: Array<{
      sessionId: string;
      repo: string | null;
      path: string | null;
      sha: string;
    }> = [];
    const failed: Array<{
      sessionId: string;
      repo: string | null;
      path: string | null;
      error: string;
    }> = [];

    for (const candidate of candidates) {
      try {
        if (!candidate.githubRepo || !candidate.githubPath) {
          throw new Error("Missing repo or path");
        }

        const { markdown, sha } = await fetchPublicRepoContent(
          candidate.githubRepo,
          candidate.githubPath,
        );

        const restored = await updateSession(candidate.id, {
          content: markdownToLexical(markdown),
          lastGithubSha: sha,
          snapshotSource: "admin-backfill",
          snapshotActorUserId: session.user.id,
        });

        if (!restored) {
          throw new Error("Failed to update session");
        }

        await resetLiveblocksRoomWithMarkdown(candidate.id, markdown);
        repaired.push({
          sessionId: candidate.id,
          repo: candidate.githubRepo,
          path: candidate.githubPath,
          sha,
        });
      } catch (error) {
        failed.push({
          sessionId: candidate.id,
          repo: candidate.githubRepo,
          path: candidate.githubPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      scanned: repoSessions.length,
      candidates: candidates.length,
      repaired,
      failed,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error running backfill repair:", error);
    return ApiError.internal().toResponse();
  }
}
