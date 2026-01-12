import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projects, documents } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getDocument, deleteDocument } from "@/lib/github";
import { countWords, extractTitle } from "@/lib/editor-utils";
import {
  ApiError,
  requireDatabase,
  requireGitHubAccessToken,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// ============================================================================
// Helper: Parse GitHub repo info
// ============================================================================

function parseGitHubRepo(githubRepo: string): { owner: string; repo: string } {
  const [owner, repo] = githubRepo.split("/");
  return { owner, repo };
}

// ============================================================================
// GET - Fetch document content
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const database = requireDatabase();
    const accessToken = await requireGitHubAccessToken(session.user.id);

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project?.githubRepo) {
      throw ApiError.notFound("Project not found");
    }

    const { owner, repo } = parseGitHubRepo(project.githubRepo);
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    const documentData = await getDocument(
      accessToken,
      owner,
      repo,
      documentPath,
      branch
    );

    return NextResponse.json({
      content: documentData.content,
      sha: documentData.sha,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("GET document error:", error);
    return ApiError.internal("Failed to fetch document").toResponse();
  }
}

// ============================================================================
// PUT - Save document content (draft, no GitHub commit)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      throw ApiError.badRequest("Content is required");
    }

    const database = requireDatabase();
    await requireGitHubAccessToken(session.user.id);

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      throw ApiError.notFound("Project not found");
    }

    const documentPath = decodeURIComponent(docPath);
    const wordCount = countWords(content);
    const title = extractTitle(content);

    await database
      .update(documents)
      .set({
        draftContent: content,
        wordCount,
        title: title || undefined,
        updatedAt: new Date(),
      })
      .where(
        and(eq(documents.projectId, projectId), eq(documents.path, documentPath))
      );

    return NextResponse.json({ saved: true, wordCount, title });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("conflict")
    ) {
      return ApiError.conflict(
        "The document has been modified. Please refresh and try again."
      ).toResponse();
    }

    console.error("PUT document error:", error);
    return ApiError.internal("Failed to save document").toResponse();
  }
}

// ============================================================================
// DELETE - Delete document
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { sha } = body;

    if (!sha) {
      throw ApiError.badRequest("SHA is required");
    }

    const database = requireDatabase();
    const accessToken = await requireGitHubAccessToken(session.user.id);

    // Verify ownership
    const project = await database.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id)
      ),
    });

    if (!project?.githubRepo) {
      throw ApiError.notFound("Project not found");
    }

    const { owner, repo } = parseGitHubRepo(project.githubRepo);
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    await deleteDocument(accessToken, owner, repo, documentPath, sha, branch);

    await database
      .delete(documents)
      .where(
        and(eq(documents.projectId, projectId), eq(documents.path, documentPath))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("DELETE document error:", error);
    return ApiError.internal("Failed to delete document").toResponse();
  }
}
