import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, requireDatabase } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { documents, projects } from "@/lib/db";
import { isAppInstalled, saveDocument } from "@/lib/github-app";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// ============================================================================
// POST - Commit draft to GitHub
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { message } = body;

    const database = requireDatabase();

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project?.githubRepo) {
      throw ApiError.notFound("Project not found or no GitHub repo connected");
    }

    const documentPath = decodeURIComponent(docPath);

    const document = await database.query.documents.findFirst({
      where: and(
        eq(documents.projectId, projectId),
        eq(documents.path, documentPath),
      ),
    });

    if (!document?.draftContent) {
      throw ApiError.badRequest("No draft to commit");
    }

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";

    // Check if GitHub App is installed
    const installed = await isAppInstalled(owner);
    if (!installed) {
      throw ApiError.forbidden(
        "GitHub App not installed. Please install the Hotpress app on your repository.",
      );
    }

    const newSha = await saveDocument(
      owner,
      repo,
      documentPath,
      document.draftContent,
      document.lastCommitSha || null,
      message || `Update ${documentPath}`,
      branch,
    );

    await database
      .update(documents)
      .set({
        draftContent: null,
        lastCommitSha: newSha,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(documents.projectId, projectId),
          eq(documents.path, documentPath),
        ),
      );

    return NextResponse.json({ sha: newSha, success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Commit error:", error);
    return ApiError.internal("Failed to commit to GitHub").toResponse();
  }
}
