import { and, eq } from "drizzle-orm";
import type { SerializedEditorState } from "lexical";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, documents, projectCollaborators, projects } from "@/lib/db";
import { countWords, extractTitle, lexicalToMarkdown } from "@/lib/editor-utils";
import { isAppInstalled, saveDocument } from "@/lib/github-app";
import { getSessionById, updateSessionGitHub } from "@/lib/session";

type RouteParams = { params: Promise<{ id: string }> };

const CommitSessionSchema = z.object({
  message: z.string().max(200).optional(),
});

function isGitHubLinkedSession(session: {
  githubRepo: string | null;
  githubPath: string | null;
}): session is { githubRepo: string; githubPath: string } {
  return !!(
    session.githubRepo &&
    session.githubPath &&
    session.githubRepo.includes("/") &&
    !session.githubRepo.startsWith("project:")
  );
}

async function findAuthorizedProject(
  userId: string,
  githubRepo: string,
  githubPath: string,
) {
  const database = db;

  if (!database) {
    throw ApiError.internal("Database not configured");
  }

  const matchingProjects = await database.query.projects.findMany({
    where: eq(projects.githubRepo, githubRepo),
  });

  for (const project of matchingProjects) {
    const document = await database.query.documents.findFirst({
      where: and(
        eq(documents.projectId, project.id),
        eq(documents.path, githubPath),
      ),
    });

    if (!document) {
      continue;
    }

    if (project.userId === userId) {
      return { project, document };
    }

    const collaborator = await database.query.projectCollaborators.findFirst({
      where: and(
        eq(projectCollaborators.projectId, project.id),
        eq(projectCollaborators.userId, userId),
      ),
    });

    if (collaborator?.role === "editor" || collaborator?.role === "admin") {
      return { project, document };
    }
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await validateBody(request, CommitSessionSchema).catch(
      () => ({ message: undefined } as z.infer<typeof CommitSessionSchema>),
    );

    const writingSession = await getSessionById(id);
    if (!writingSession) {
      throw ApiError.notFound("Session not found");
    }

    if (!isGitHubLinkedSession(writingSession)) {
      throw ApiError.badRequest("Session is not linked to a GitHub document");
    }

    const authorized = await findAuthorizedProject(
      session.user.id,
      writingSession.githubRepo,
      writingSession.githubPath,
    );

    if (!authorized) {
      throw ApiError.forbidden(
        "You do not have permission to commit this document",
      );
    }

    const content = writingSession.content;
    if (!content) {
      throw ApiError.badRequest("No content available to commit");
    }

    let markdown = content;
    try {
      markdown = lexicalToMarkdown(
        JSON.parse(content) as SerializedEditorState,
      );
    } catch {
      markdown = content;
    }

    const [owner, repo] = writingSession.githubRepo.split("/");
    const installed = await isAppInstalled(owner);
    if (!installed) {
      throw ApiError.forbidden(
        "GitHub App not installed. Please install the Hotpress app on your repository.",
      );
    }

    const commitMessage =
      body.message ||
      `Update ${authorized.document.path.split("/").pop() || authorized.document.path}`;

    const newSha = await saveDocument(
      owner,
      repo,
      writingSession.githubPath,
      markdown,
      writingSession.lastGithubSha || authorized.document.lastCommitSha || null,
      commitMessage,
      authorized.project.githubBranch || "main",
    );

    const now = new Date();
    const title = extractTitle(markdown);

    const database = db;

    if (!database) {
      throw ApiError.internal("Database not configured");
    }

    await database
      .update(documents)
      .set({
        draftContent: markdown,
        lastCommitSha: newSha,
        lastSyncedAt: now,
        wordCount: countWords(markdown),
        title: title || authorized.document.title,
        updatedAt: now,
      })
      .where(eq(documents.id, authorized.document.id));

    await updateSessionGitHub(id, {
      githubRepo: writingSession.githubRepo,
      githubPath: writingSession.githubPath,
      lastGithubSha: newSha,
    });

    return NextResponse.json({ success: true, sha: newSha });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }

    console.error("Commit session error:", error);
    return ApiError.internal("Failed to commit document to GitHub").toResponse();
  }
}
