import { CodeHighlightNode, CodeNode } from "@lexical/code";
// $generateHtmlFromNodes removed - unused
import { createHeadlessEditor } from "@lexical/headless";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { SerializedEditorState } from "lexical";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  type AuthContext,
  validateBody,
  withAuth,
} from "@/lib/api-utils";
import { commitMultipleFiles, createRepository } from "@/lib/github-app";
import {
  getSessionById,
  getSessionIdFromCookie,
  updateSessionGitHub,
} from "@/lib/session";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Request body for saving to GitHub
 */
export const SaveToGitHubSchema = z.object({
  repo: z
    .string()
    .regex(/^[\w-]+\/[\w.-]+$/, "Invalid repo format (owner/repo)")
    .optional(),
  path: z.string().optional().default("content/book.md"),
  branch: z.string().optional().default("main"),
  commitMessage: z.string().optional(),
  createRepo: z.boolean().optional().default(false),
  repoName: z.string().optional(),
  repoDescription: z.string().optional(),
  private: z.boolean().optional().default(true),
});

export type SaveToGitHubRequest = z.infer<typeof SaveToGitHubSchema>;

/**
 * Response for saving to GitHub
 */
export interface SaveToGitHubResponse {
  success: boolean;
  repo: string;
  path: string;
  branch: string;
  commitSha: string;
  commitUrl: string;
  sessionUpdated: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert Lexical JSON content to Markdown
 */
async function convertToMarkdown(content: string | null): Promise<string> {
  if (!content) {
    return "";
  }

  try {
    const parsed = JSON.parse(content) as SerializedEditorState;

    // Create a headless editor
    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
      ],
    });

    // Set the editor state and convert to markdown
    const editorState = editor.parseEditorState(parsed);
    let markdown = "";

    editorState.read(() => {
      markdown = $convertToMarkdownString(TRANSFORMERS);
    });

    return markdown;
  } catch (error) {
    console.error("[save-to-github] Error converting to markdown:", error);
    return "";
  }
}

/**
 * Generate hotpress.yaml content
 */
function generateHotpressYaml(
  session: { title: string | null; type: string | null; formatConfig: unknown },
  path: string,
): string {
  const config = {
    version: "1.0",
    title: session.title || "Untitled",
    type: session.type || "book",
    content: path,
    format: session.formatConfig || {},
  };

  // Convert to YAML (simple implementation)
  const lines: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "object") {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value)) {
        lines.push(`  ${k}: ${JSON.stringify(v)}`);
      }
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join("\n");
}

// ============================================================================
// POST /api/sessions/[id]/save-to-github - Save session content to GitHub
// ============================================================================

async function saveToGitHubHandler(
  request: NextRequest,
  context: AuthContext & { sessionId: string },
): Promise<NextResponse> {
  const { sessionId, accessToken } = context;

  if (!accessToken) {
    throw ApiError.forbidden(
      "GitHub is not connected. Please sign in with GitHub to save.",
    );
  }

  const body = await validateBody(request, SaveToGitHubSchema);

  // Find session by ID
  const session = await getSessionById(sessionId);
  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  // Verify access (owner or session cookie matches)
  const cookieSessionId = await getSessionIdFromCookie();
  const hasAccess =
    session.ownerId === context.userId ||
    cookieSessionId === sessionId ||
    !session.ownerId;

  if (!hasAccess) {
    throw ApiError.forbidden("You don't have permission to save this session");
  }

  let owner: string;
  let repoName: string;
  let branch = body.branch || "main";

  // Handle repo creation or use existing
  if (body.createRepo) {
    if (!body.repoName) {
      throw ApiError.badRequest("repoName is required when createRepo is true");
    }

    const created = await createRepository(
      accessToken,
      body.repoName,
      body.private ?? true,
      body.repoDescription,
    );

    if (!created) {
      throw ApiError.internal("Failed to create repository");
    }

    owner = created.owner;
    repoName = created.repo;
    branch = created.defaultBranch;
  } else {
    if (!body.repo) {
      throw ApiError.badRequest(
        "repo is required when not creating a new repo",
      );
    }

    const [o, r] = body.repo.split("/");
    owner = o;
    repoName = r;
  }

  // Convert content to markdown
  const markdown = await convertToMarkdown(session.content);
  const contentPath = body.path || "content/book.md";

  // Generate hotpress.yaml
  const hotpressYaml = generateHotpressYaml(session, contentPath);

  // Prepare files to commit
  const files = [
    { path: contentPath, content: markdown },
    { path: "hotpress.yaml", content: hotpressYaml },
  ];

  // Commit message
  const commitMessage =
    body.commitMessage ||
    `Update from Hotpress: ${session.title || "Untitled"}`;

  // Commit files
  const result = await commitMultipleFiles(
    accessToken,
    owner,
    repoName,
    files,
    commitMessage,
    branch,
  );

  if (!result) {
    throw ApiError.internal("Failed to commit files to GitHub");
  }

  // Update session with GitHub info
  await updateSessionGitHub(sessionId, {
    githubRepo: `${owner}/${repoName}`,
    githubPath: contentPath,
    lastGithubSha: result.sha,
  });

  const response: SaveToGitHubResponse = {
    success: true,
    repo: `${owner}/${repoName}`,
    path: contentPath,
    branch,
    commitSha: result.sha,
    commitUrl: result.commitUrl,
    sessionUpdated: true,
  };

  return NextResponse.json(response);
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { id } = await params;

  // Use withAuth wrapper to ensure user is authenticated
  const handler = withAuth(async (req, ctx) => {
    return saveToGitHubHandler(req, { ...ctx, sessionId: id });
  });

  return handler(request);
}
