import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  requireDatabase,
  requireGitHubAccessToken,
} from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { projects } from "@/lib/db";
import { getCommitHistory } from "@/lib/github";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// ============================================================================
// GET - Fetch commit history for a document
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
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

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    const commits = await getCommitHistory(
      accessToken,
      owner,
      repo,
      documentPath,
      branch,
    );

    return NextResponse.json({ commits });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("GET history error:", error);
    return ApiError.internal("Failed to fetch history").toResponse();
  }
}
