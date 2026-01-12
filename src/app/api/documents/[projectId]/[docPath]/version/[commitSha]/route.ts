import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projects } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getFileAtCommit } from "@/lib/github";
import {
  ApiError,
  requireDatabase,
  requireGitHubAccessToken,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
    commitSha: string;
  }>;
}

// ============================================================================
// GET - Fetch document content at a specific commit
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { projectId, docPath, commitSha } = await params;
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

    const [owner, repo] = project.githubRepo.split("/");
    const documentPath = decodeURIComponent(docPath);

    const documentData = await getFileAtCommit(
      accessToken,
      owner,
      repo,
      documentPath,
      commitSha
    );

    return NextResponse.json({
      content: documentData.content,
      sha: documentData.sha,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("GET version error:", error);
    return ApiError.internal("Failed to fetch version").toResponse();
  }
}
